// models/Document.js
import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  // Parent application reference (supports both Building and Occupancy)
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  applicationType: {
    type: String,
    enum: ['Building', 'Occupancy'],
    required: true,
    index: true
  },
  
  // Document identification
  requirementName: {
    type: String,
    required: true,
    index: true
  },
  
  // File storage (BASE64 - same as embedded)
  fileName: {
    type: String,
    required: true
  },
  fileContent: {
    type: String, // BASE64 encoded
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  
  // Preserve array order for index-based access
  originalIndex: {
    type: Number,
    required: true,
    index: true
  },
  
  // Metadata
  uploadedBy: {
    type: String,
    enum: ['user', 'system', 'admin'],
    default: 'user'
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Legacy compatibility
  filePath: {
    type: String,
    required: false
  },
  
  // Status tracking
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for performance
DocumentSchema.index({ applicationId: 1, originalIndex: 1 });
DocumentSchema.index({ applicationId: 1, requirementName: 1, isActive: 1 });

export default mongoose.model("Document", DocumentSchema);
