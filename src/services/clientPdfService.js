import * as pdfjsLib from 'pdfjs-dist';
import { Document, Paragraph, TextRun, Packer } from 'docx';

// Set up worker source dynamically from CDN matching pdfjs version for Vercel/browser compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

/**
 * Converts a PDF file directly in the browser using pdfjs-dist and docx.
 * @param {File} file - PDF file to convert.
 * @param {Function} [onProgress] - Optional progress callback.
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export const convertPdfToWordClientSide = async (file, onProgress) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    if (typeof onProgress === 'function') {
      onProgress({ loaded: 20, total: 100 });
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const docxParagraphs = [];
    let totalText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items by vertical position Y to reconstruct lines
      const lineMap = new Map();

      for (const item of textContent.items) {
        if (!item.str || item.str.trim().length === 0) continue;

        // Y position rounded to group text on the same line
        const yPos = Math.round(item.transform[5] / 4) * 4;
        if (!lineMap.has(yPos)) {
          lineMap.set(yPos, []);
        }
        lineMap.get(yPos).push(item.str);
      }

      // Sort lines from top to bottom (higher Y means higher on page in PDF coordinates)
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
                  size: 24, // 12pt
                  color: '1F2937',
                }),
              ],
              spacing: {
                after: 140, // 7pt spacing
                line: 276,  // 1.15 line spacing
              },
            })
          );
        }
      }

      if (typeof onProgress === 'function') {
        const pageProgress = 20 + Math.round((pageNum / numPages) * 70);
        onProgress({ loaded: pageProgress, total: 100 });
      }
    }

    const cleanTextCount = totalText.replace(/[^a-zA-Z0-9]/g, '').length;
    if (cleanTextCount === 0) {
      throw new Error('This PDF appears to be scanned or image-based. Scanned PDFs require an OCR tool to extract text.');
    }

    if (docxParagraphs.length === 0) {
      docxParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'Empty document.', font: 'Calibri', size: 24 })],
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
