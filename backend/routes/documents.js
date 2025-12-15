import express from "express";
import { documentUpload } from "../middleware/uploadMiddleware.js";
import {
  uploadRequirements,
  uploadRevision
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

export default router;
