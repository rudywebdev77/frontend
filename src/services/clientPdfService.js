import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { Document, Paragraph, TextRun, ImageRun, Packer, AlignmentType } from 'docx';

// Set up worker source dynamically from CDN matching pdfjs version for Vercel/browser compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

const MAX_CLIENT_OCR_PAGES = 20;

/**
 * Client-side 1:1 exact visual replica converter.
 */
export const convertPdfToWordClientSideExact = async (file, onProgress) => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const sections = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1.0 });
    const widthPt = baseViewport.width;
    const heightPt = baseViewport.height;

    const renderScale = 2.0;
    const renderViewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

    await page.render({ canvasContext: context, viewport: renderViewport }).promise;

    const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const imageBuffer = new Uint8Array(await imageBlob.arrayBuffer());

    sections.push({
      properties: {
        page: {
          size: {
            width: Math.round(widthPt * 20),
            height: Math.round(heightPt * 20),
          },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: {
                width: Math.round(widthPt * (96 / 72)),
                height: Math.round(heightPt * (96 / 72)),
              },
            }),
          ],
          spacing: { before: 0, after: 0 },
        }),
      ],
    });

    if (typeof onProgress === 'function') {
      onProgress({ loaded: Math.round((pageNum / numPages) * 100), total: 100 });
    }
  }

  const doc = new Document({ sections });
  const docxBlob = await Packer.toBlob(doc);
  const baseName = file.name.replace(/\.pdf$/i, '');

  return {
    blob: docxBlob,
    filename: `${baseName || 'converted'}.docx`,
  };
};

/**
 * Converts a PDF file directly in the browser using pdfjs-dist and docx.
 * If text extraction yields no readable text, automatically performs client-side OCR using tesseract.js.
 *
 * @param {File} file - PDF file to convert.
 * @param {'exact'|'editable'} [mode='exact'] - Conversion mode.
 * @param {Function} [onProgress] - Optional progress callback.
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export const convertPdfToWordClientSide = async (file, mode = 'exact', onProgress) => {
  if (typeof mode === 'function') {
    onProgress = mode;
    mode = 'exact';
  }

  if (mode === 'exact') {
    return await convertPdfToWordClientSideExact(file, onProgress);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    if (typeof onProgress === 'function') {
      onProgress({ loaded: 10, total: 100 });
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const docxParagraphs = [];
    let totalText = '';

    // Step 1: Standard text extraction attempt
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const lineMap = new Map();

      for (const item of textContent.items) {
        if (!item.str || item.str.trim().length === 0) continue;
        const yPos = Math.round(item.transform[5] / 4) * 4;
        if (!lineMap.has(yPos)) {
          lineMap.set(yPos, []);
        }
        lineMap.get(yPos).push(item.str);
      }

      const sortedYPositions = Array.from(lineMap.keys()).sort((a, b) => b - a);

      for (const yPos of sortedYPositions) {
        const lineText = lineMap.get(yPos).join(' ').trim();
        if (lineText.length > 0) {
          totalText += lineText + ' ';
          docxParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: lineText,
                  font: 'Calibri',
                  size: 24,
                  color: '1F2937',
                }),
              ],
              spacing: {
                after: 140,
                line: 276,
              },
            })
          );
        }
      }

      if (typeof onProgress === 'function') {
        const pageProgress = 10 + Math.round((pageNum / numPages) * 30);
        onProgress({ loaded: pageProgress, total: 100 });
      }
    }

    const cleanTextCount = totalText.replace(/[^a-zA-Z0-9]/g, '').length;

    // Step 2: If little or no text was found, automatically run OCR on scanned pages
    if (cleanTextCount < 15) {
      console.log('Client-side: PDF contains little/no text. Running browser OCR...');

      if (numPages > MAX_CLIENT_OCR_PAGES) {
        throw new Error(`Scanned PDF contains ${numPages} pages, exceeding the ${MAX_CLIENT_OCR_PAGES} page limit for OCR processing.`);
      }

      docxParagraphs.length = 0; // Clear empty paragraphs
      let worker = null;

      try {
        worker = await createWorker('eng');

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = Math.floor(viewport.height);
            canvas.width = Math.floor(viewport.width);

            await page.render({ canvasContext: context, viewport }).promise;

            const recognitionResult = await worker.recognize(canvas);
            const pageText = recognitionResult?.data?.text ? recognitionResult.data.text.trim() : '';

            if (pageText.length > 0) {
              const lines = pageText.split(/\r?\n/);
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.length > 0) {
                  docxParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: trimmed,
                          font: 'Calibri',
                          size: 24,
                          color: '1F2937',
                        }),
                      ],
                      spacing: { after: 140, line: 276 },
                    })
                  );
                }
              }
            }
          } catch (pageError) {
            console.warn(`Browser OCR warning: Failed to process page ${pageNum}:`, pageError);
          }

          if (typeof onProgress === 'function') {
            const ocrProgress = 40 + Math.round((pageNum / numPages) * 50);
            onProgress({ loaded: ocrProgress, total: 100 });
          }
        }
      } finally {
        if (worker) {
          await worker.terminate();
        }
      }
    }

    if (docxParagraphs.length === 0) {
      docxParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'No readable text could be extracted from this PDF.', font: 'Calibri', size: 24 })],
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docxParagraphs,
        },
      ],
    });

    const docxBlob = await Packer.toBlob(doc);

    if (typeof onProgress === 'function') {
      onProgress({ loaded: 100, total: 100 });
    }

    const baseName = file.name.replace(/\.pdf$/i, '');
    const filename = `${baseName || 'converted'}.docx`;

    return {
      blob: docxBlob,
      filename,
    };
  } catch (error) {
    console.error('Client-side PDF conversion error:', error);
    throw new Error(error.message || 'Failed to process PDF in browser.');
  }
};
