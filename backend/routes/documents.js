import express from "express";
import { documentUpload } from "../middleware/uploadMiddleware.js";
import { verifyToken, verifyRole } from "../middleware/authMiddleware.js";
import {
  uploadRequirements,
  uploadRevision,
  uploadAdminDocuments,
  listDocumentsByApp
} from "../controllers/documentController.js";


const router = express.Router();

router.post(
  "/requirements",
  documentUpload.single("file"),
  uploadRequirements
);


router.post(
  "/revision",
  documentUpload.array("files", 10), 
  uploadRevision
);

// Admin uploads (multiple files)
router.post(
  "/admin",
  verifyToken,
  verifyRole(['meoadmin', 'bfpadmin', 'mayoradmin']),
  documentUpload.array("files", 10),
  uploadAdminDocuments
);

// List by application (optional role)
router.get(
  "/by-app",
  verifyToken,
  listDocumentsByApp
);

export default router;
