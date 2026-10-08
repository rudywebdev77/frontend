import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { Document, Paragraph, TextRun, ImageRun, Packer, AlignmentType } from 'docx';

// Set up worker source dynamically from CDN matching pdfjs version for Vercel/browser compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

const MAX_CLIENT_OCR_PAGES = 20;

function parseClientTextItems(textContent, viewport) {
  const items = [];
  for (const item of textContent.items) {
    if (!item.str || item.str.length === 0) continue;

    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const scaleX = Math.abs(transform[0]);
    const scaleY = Math.abs(transform[3]);
    const fontSizePt = Math.max(8, Math.round(scaleY || scaleX || 11));

    const xPt = transform[4];
    const pdfY = transform[5];
    const yPt = viewport.height - pdfY;

    const fontName = (item.fontName || '').toLowerCase();
    const isBold = fontName.includes('bold') || fontName.includes('heavy') || fontName.includes('bd');
    const isItalic = fontName.includes('italic') || fontName.includes('oblique') || fontName.includes('it');

    items.push({
      str: item.str,
      xPt,
      yPt,
      widthPt: item.width || 0,
      fontSizePt,
      fontFamily: 'Calibri',
      isBold,
      isItalic,
      color: '1F2937',
    });
  }
  return items;
}

function clusterClientTextItems(items) {
  if (items.length === 0) return [];
  items.sort((a, b) => a.yPt - b.yPt);

  const clusters = [];
  for (const item of items) {
    let matched = null;
    for (const cluster of clusters) {
      if (Math.abs(item.yPt - cluster.avgY) <= Math.max(6, item.fontSizePt * 0.65)) {
        matched = cluster;
        break;
      }
    }

    if (matched) {
      matched.items.push(item);
      matched.avgY = matched.items.reduce((sum, it) => sum + it.yPt, 0) / matched.items.length;
    } else {
      clusters.push({ avgY: item.yPt, items: [item] });
    }
  }

  clusters.sort((a, b) => a.avgY - b.avgY);
  for (const cluster of clusters) {
    cluster.items.sort((a, b) => a.xPt - b.xPt);
  }
  return clusters;
}

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
 * @param {'exact'|'editable'} [mode='editable'] - Conversion mode.
 * @param {Function} [onProgress] - Optional progress callback.
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export const convertPdfToWordClientSide = async (file, mode = 'editable', onProgress) => {
  if (typeof mode === 'function') {
    onProgress = mode;
    mode = 'editable';
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
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      const pageMidX = viewport.width / 2;
      
      const textItems = parseClientTextItems(textContent, viewport);
      const lineClusters = clusterClientTextItems(textItems);

      for (const cluster of lineClusters) {
        const lineRuns = [];
        let currentRun = null;

        for (const item of cluster.items) {
          totalText += item.str + ' ';
          if (!currentRun) {
            currentRun = { ...item };
          } else {
            const prevRightX = currentRun.xPt + currentRun.widthPt;
            const gap = item.xPt - prevRightX;
            if (item.fontSizePt === currentRun.fontSizePt && item.isBold === currentRun.isBold && item.isItalic === currentRun.isItalic) {
              if (gap > 2) {
                currentRun.str += ' ' + item.str;
              } else {
                currentRun.str += item.str;
              }
              currentRun.widthPt = Math.max(currentRun.widthPt, item.xPt + item.widthPt - currentRun.xPt);
            } else {
              lineRuns.push(currentRun);
              currentRun = { ...item };
            }
          }
        }
        if (currentRun) lineRuns.push(currentRun);

        if (lineRuns.length > 0) {
          const minX = Math.min(...cluster.items.map((it) => it.xPt));
          const maxX = Math.max(...cluster.items.map((it) => it.xPt + (it.widthPt || 0)));
          const lineWidth = maxX - minX;
          const lineMidX = (minX + maxX) / 2;

          let alignment = AlignmentType.LEFT;
          if (Math.abs(lineMidX - pageMidX) < 45 && lineWidth < viewport.width * 0.75) {
            alignment = AlignmentType.CENTER;
          }

          const docxRuns = [];
          for (let i = 0; i < lineRuns.length; i++) {
            const run = lineRuns[i];
            if (i > 0) {
              const prevRun = lineRuns[i - 1];
              const gap = run.xPt - (prevRun.xPt + prevRun.widthPt);
              if (gap > 35) {
                docxRuns.push(new TextRun({ text: '\t\t\t\t' }));
              } else {
                docxRuns.push(new TextRun({ text: ' ' }));
              }
            }
            docxRuns.push(
              new TextRun({
                text: run.str,
                font: 'Calibri',
                size: Math.min(96, Math.max(16, run.fontSizePt * 2)),
                bold: run.isBold,
                italic: run.isItalic,
                color: '1F2937',
              })
            );
          }

          const isTitle = lineRuns[0].fontSizePt >= 18;
          docxParagraphs.push(
            new Paragraph({
              children: docxRuns,
              alignment,
              spacing: {
                before: isTitle ? 180 : 40,
                after: isTitle ? 120 : 60,
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
