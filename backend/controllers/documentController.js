import Document from "../models/Document.js";
import BuildingApplication from "../models/BuildingApplication.js";
import OccupancyApplication from "../models/OccupancyApplication.js";

// Helper to select correct model
const getModel = (type) => {
    if (type === "Building") return BuildingApplication;
    if (type === "Occupancy") return OccupancyApplication;
    throw new Error("Invalid application type.");
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

        const newDoc = new Document({
            application: appId,
            requirementName: requirementName || "Requirement",
            filePath: `/uploads/documents/${req.file.filename}`
        });

        await newDoc.save();

        application.documents.push(newDoc._id);
        await application.save();

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

// Helper function to convert file to Base64
const fileToBase64 = (file) => {
    return file.buffer.toString('base64');
};

export const uploadRevision = async (req, res) => {
    try {
        const { appId, applicationType } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded." });
        }

        const Model = applicationType === "Building" ? BuildingApplication : OccupancyApplication;
        const application = await Model.findById(appId);
        
        if (!application) return res.status(404).json({ message: "Application not found." });

        if (!application.documents) application.documents = [];

        // Save files as base64 in database (not as file paths)
        req.files.forEach(file => {
            application.documents.push({
                requirementName: "Revised Checklist/Documents",
                fileName: file.originalname,
                fileContent: fileToBase64(file),
                mimeType: file.mimetype,
                fileSize: file.size,
                uploadedAt: new Date(),
                uploadedBy: 'user',
                status: "Pending"
            });
        });

        const lastComment = application.rejectionDetails?.comments || "";
        
        if (lastComment.includes("BFP")) {
            application.status = "Pending BFP"; // Return to BFP
        } else {
            application.status = "Pending MEO"; // Default to MEO
        }


        if (application.rejectionDetails) {
            application.rejectionDetails.isResolved = true;
        }

        application.workflowHistory.push({
            status: application.status, 
            comments: `User uploaded ${req.files.length} revised document(s).`,
            timestamp: new Date()
        });

        await application.save();

        return res.status(200).json({
            success: true,
            message: "Revisions uploaded successfully.",
            application
        });

    } catch (err) {
        console.error("UPLOAD REVISION ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};



