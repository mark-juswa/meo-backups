import mongoose from 'mongoose';

const OcrMetaSchema = new mongoose.Schema(
  {
    rawText: { type: String },
    confidence: { type: Number },
    warnings: [{ type: String }],
    uploadedFileName: { type: String },
    uploadedMimeType: { type: String },
    extractedAt: { type: Date }
  },
  { _id: false }
);

const LandUseApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Pre-application lifecycle only
    status: {
      type: String,
      enum: ['Draft', 'Verified', 'Used'],
      default: 'Draft',
      index: true
    },

    // Verified, user-controlled fields (editable until Verified)
    data: {
      applicantName: { type: String, default: '' },
      projectLocation: { type: String, default: '' },
      barangay: { type: String, default: '' },
      cityMunicipality: { type: String, default: '' },
      lotNumber: { type: String, default: '' },
      blockNumber: { type: String, default: '' },
      existingLandUse: { type: String, default: '' },
      zoningClassification: { type: String, default: '' },
      projectTypeNature: { type: String, default: '' },
      lotArea: { type: String, default: '' },
      projectCost: { type: String, default: '' }
    },

    // Optional metadata (never authoritative)
    ocr: { type: OcrMetaSchema, default: null },

    // Generated PDF (path or base64). Keeping similar to existing approach: store base64.
    generatedPdf: {
      fileName: { type: String },
      fileContent: { type: String }, // base64
      mimeType: { type: String, default: 'application/pdf' },
      generatedAt: { type: Date }
    }
  },
  { timestamps: true }
);

LandUseApplicationSchema.index({ applicant: 1, status: 1, createdAt: -1 });

export default mongoose.model('LandUseApplication', LandUseApplicationSchema);
