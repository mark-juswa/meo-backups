import Document from "../models/Document.js";
import BuildingApplication from "../models/BuildingApplication.js";
import OccupancyApplication from "../models/OccupancyApplication.js";

// Helper to select correct model
const getModel = (type) => {
    if (type === "Building") return BuildingApplication;
    if (type === "Occupancy") return OccupancyApplication;
    throw new Error("Invalid application type.");
};

// Helper to convert file to Base64
const fileToBase64 = (file) => file.buffer.toString('base64');

// Compute next originalIndex per application for stable ordering
const getNextOriginalIndex = async (applicationId) => {
  const last = await Document.find({ applicationId }).sort({ originalIndex: -1 }).limit(1);
  if (!last || last.length === 0) return 0;
  const lastIdx = typeof last[0].originalIndex === 'number' ? last[0].originalIndex : 0;
  return lastIdx + 1;
};


// UPLOAD INITIAL REQUIREMENTS (PDF ONLY)

export const uploadRequirements = async (req, res) => {
    try {
        const { appId, requirementName, applicationType } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No PDF uploaded." });
        }

        const Model = applicationType === "Building"
            ? BuildingApplication
            : OccupancyApplication;

        const application = await Model.findById(appId);
        if (!application)
            return res.status(404).json({ success: false, message: "Application not found." });

        // Save into Document collection (decoupled)
        const nextIndex = await getNextOriginalIndex(application._id);
        const newDoc = await Document.create({
            applicationId: application._id,
            applicationType,
            requirementName: requirementName || "Requirement",
            fileName: req.file.originalname,
            fileContent: fileToBase64(req.file),
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            originalIndex: nextIndex,
            uploadedBy: 'user'
        });

        res.json({
            success: true,
            message: "Requirement uploaded successfully.",
            document: newDoc
        });
    } catch (err) {
        console.error("UPLOAD REQUIREMENTS ERROR:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};


// UPLOAD REVISIONS 

// (removed duplicate fileToBase64)

export const uploadRevision = async (req, res) => {
    try {
        const { appId, applicationType } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded." });
        }

        const Model = applicationType === "Building" ? BuildingApplication : OccupancyApplication;
        const application = await Model.findById(appId);
        
        if (!application) return res.status(404).json({ message: "Application not found." });

        // Store revisions in Document collection (decoupled), preserve originalIndex sequence
        let nextIndex = await getNextOriginalIndex(application._id);
        const saved = [];
        for (const file of req.files) {
          const doc = await Document.create({
            applicationId: application._id,
            applicationType,
            requirementName: "Revised Checklist/Documents",
            fileName: file.originalname,
            fileContent: fileToBase64(file),
            mimeType: file.mimetype,
            fileSize: file.size,
            originalIndex: nextIndex++,
            uploadedBy: 'user'
          });
          saved.push(doc);
        }

        // Maintain previous behavior: reset status back to MEO/BFP depending on rejection comment
        const lastComment = application.rejectionDetails?.comments || "";
        const newStatus = lastComment.includes("BFP") ? "Pending BFP" : "Pending MEO";

        await Model.findByIdAndUpdate(
          appId,
          {
            $set: {
              status: newStatus,
              'rejectionDetails.isResolved': true
            },
            $push: {
              workflowHistory: {
                status: newStatus,
                comments: `User uploaded ${req.files.length} revised document(s).`,
                timestamp: new Date()
              }
            }
          },
          { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Revisions uploaded successfully.",
            documents: saved
        });

    } catch (err) {
        console.error("UPLOAD REVISION ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};



