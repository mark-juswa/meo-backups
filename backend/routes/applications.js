import express from 'express';
import {
    submitBuildingApplication,
    submitOccupancyApplication,
    getMyApplications,
    getApplicationByReferenceNo,
    getAllApplications,
    updateApplicationStatus,
    updateAdminChecklist,
    uploadPaymentProof,
    uploadSupportingDocuments,
    downloadApplicationPDF,
    serveFileFromDatabase,
    servePaymentProofFromDatabase
} from '../controllers/applicationController.js';
import { verifyToken, verifyRole } from '../middleware/authMiddleware.js';
import { imageUpload, documentUpload } from "../middleware/uploadMiddleware.js";
import { uploadRevision } from "../controllers/documentController.js";



const router = express.Router();

// User Routes
router.post('/building', verifyToken, submitBuildingApplication);
router.post('/occupancy', verifyToken, submitOccupancyApplication);
router.get('/my-applications', verifyToken, getMyApplications);
router.get('/track/:referenceNo', getApplicationByReferenceNo);

// Admin Routes - MUST come before /:id route to avoid conflicts
router.get(
    '/all', 
    verifyToken, 
    verifyRole(['meoadmin', 'bfpadmin', 'mayoradmin']), 
    getAllApplications
);

router.get('/:id', verifyToken, getApplicationByReferenceNo); // Get single application by ID

router.put(
    '/:id/status',
    verifyToken,
    // ALL admins can update a status
    verifyRole(['meoadmin', 'bfpadmin', 'mayoradmin']), 
    updateApplicationStatus
);

// Update admin checklist
router.put(
    '/:id/checklist',
    verifyToken,
    verifyRole(['meoadmin', 'bfpadmin']), 
    updateAdminChecklist
);


// FILE UPLOAD ROUTES (Payment / Revisions)

// Upload proof of payment 
router.post(
    '/:id/upload-payment',
    verifyToken,
    imageUpload.single("file"), 
    uploadPaymentProof
);

// Upload revision documents
router.post(
    '/:id/upload-revision',
    verifyToken,
    documentUpload.array("files", 10),  
    uploadRevision
);

// Upload supporting documents for building applications
router.post(
    '/:id/upload-documents',
    verifyToken,
    documentUpload.single("file"),
    uploadSupportingDocuments
);

// Saves document file in database 
router.get(
    '/:applicationId/documents/:documentIndex/file',
    verifyToken,
    serveFileFromDatabase
);

// Saves payment proof in database 
router.get(
    '/:applicationId/payment-proof',
    verifyToken,
    servePaymentProofFromDatabase
);

// Download application PDF (Admin only)
router.get(
    '/:id/download-pdf',
    verifyToken,
    verifyRole(['meoadmin', 'bfpadmin', 'mayoradmin']),
    downloadApplicationPDF
);


export default router;