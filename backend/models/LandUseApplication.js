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

    // Verified, user-controlled fields (editable until Verified) - expanded to match HLURB template
    data: {
      // Administrative fields
      application_no: { type: String, default: '' },
      date_of_receipt: { type: String, default: '' },
      or_no: { type: String, default: '' },
      or_date_issued: { type: String, default: '' },
      or_amount_paid: { type: String, default: '' },
      
      // Applicant details
      applicant_name: { type: String, default: '' },
      corporation_name: { type: String, default: '' },
      applicant_address: { type: String, default: '' },
      corporation_address: { type: String, default: '' },
      authorized_rep_name: { type: String, default: '' },
      authorized_rep_address: { type: String, default: '' },
      
      // Project details
      project_type: { type: String, default: '' },
      project_nature_new: { type: String, default: '' },
      project_nature_existing: { type: String, default: '' },
      project_nature_other: { type: String, default: '' },
      project_location: { type: String, default: '' },
      project_tenure_permanent: { type: String, default: '' },
      project_tenure_temporary: { type: String, default: '' },
      
      // Land rights
      right_owner: { type: String, default: '' },
      right_lessee: { type: String, default: '' },
      right_other: { type: String, default: '' },
      
      // Areas
      lot_area_sqm: { type: String, default: '' },
      building_area: { type: String, default: '' },
      
      // Land use classifications
      land_use_residential: { type: String, default: '' },
      land_use_institutional: { type: String, default: '' },
      land_use_commercial: { type: String, default: '' },
      land_use_industrial: { type: String, default: '' },
      land_use_vacant: { type: String, default: '' },
      land_use_agricultural: { type: String, default: '' },
      
      // Administrative processes
      notice_date: { type: String, default: '' },
      applied_other_yes: { type: String, default: '' },
      applied_other_no: { type: String, default: '' },
      other_application_date: { type: String, default: '' },
      other_application_action: { type: String, default: '' },
      
      // Signatures
      rep_signature_name: { type: String, default: '' },
      applicant_signature_name: { type: String, default: '' }
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
