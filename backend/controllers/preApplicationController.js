import { runOcrOnUpload } from '../services/preApplicationOcrService.js';

// POST /api/pre-application/ocr/upload
// Accepts image/pdf upload and returns raw text + confidence + (optional) parsed suggestions.
export const ocrUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Expected multipart/form-data field "file".' });
    }

    const result = await runOcrOnUpload(req.file);
    return res.status(200).json(result);
  } catch (error) {
    console.error('pre-application OCR upload error:', error);
    const status = error?.statusCode || 500;

    // For some validation/OCR failures, we still return partial extraction data
    if (error?.partialResult) {
      return res.status(status).json({
        message: error?.message || 'OCR validation failed',
        ...error.partialResult
      });
    }

    return res.status(status).json({
      message: error?.message || 'Server error during OCR processing',
      details: error?.details
    });
  }
};
