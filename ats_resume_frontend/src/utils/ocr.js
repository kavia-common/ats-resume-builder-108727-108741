import Tesseract from 'tesseract.js';

/**
 * Lightweight OCR helpers using Tesseract.js.
 * These functions are used as a fallback when pdf.js/mammoth don't extract any usable text,
 * e.g., for scanned PDFs or image uploads.
 */

// PUBLIC_INTERFACE
export async function ocrImageBlobToText(blob, lang = 'eng') {
  /** Run OCR on an image Blob or File and return recognized text. */
  if (!blob) throw new Error('No image provided for OCR.');
  const { data } = await Tesseract.recognize(blob, lang, {
    // You can customize logger for progress if needed
    // logger: m => console.debug(m)
  });
  return (data?.text || '').trim();
}

// PUBLIC_INTERFACE
export async function ocrCanvasToText(canvas, lang = 'eng') {
  /** Run OCR on a canvas element; converts to blob first for Tesseract. */
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(async (blob) => {
        try {
          const text = await ocrImageBlobToText(blob, lang);
          resolve(text);
        } catch (err) {
          reject(err);
        }
      }, 'image/png', 0.95);
    } catch (e) {
      reject(e);
    }
  });
}
