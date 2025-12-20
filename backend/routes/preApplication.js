import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { ocrDocumentUpload } from '../middleware/uploadMiddleware.js';
import { ocrUpload } from '../controllers/preApplicationController.js';
import { getLatestVerifiedLandUse } from '../controllers/landUseApplicationQueryController.js';
import {
  createLandUseDraft,
  listMyLandUse,
  getLandUseById,
  updateLandUse,
  confirmLandUse,
  generateLandUsePdf,
  serveLandUsePdf
} from '../controllers/landUseApplicationController.js';

const router = express.Router();

// PRE-APPLICATION (Land Use / Zoning)
// OCR is assistive only; never submits/creates permits.
router.post('/ocr/upload', verifyToken, ocrDocumentUpload.single('file'), ocrUpload);

// Land Use / Zoning pre-application records
router.post('/land-use', verifyToken, createLandUseDraft);
router.get('/land-use/my', verifyToken, listMyLandUse);
router.get('/land-use/latest-verified', verifyToken, getLatestVerifiedLandUse);
router.get('/land-use/:id', verifyToken, getLandUseById);
router.put('/land-use/:id', verifyToken, updateLandUse);
router.post('/land-use/:id/confirm', verifyToken, confirmLandUse);
router.post('/land-use/:id/generate-pdf', verifyToken, generateLandUsePdf);
router.get('/land-use/:id/pdf', verifyToken, serveLandUsePdf);

export default router;
