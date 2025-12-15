// models/Payment.js
import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  // Application reference (ONE payment per application)
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  applicationType: {
    type: String,
    enum: ['Building', 'Occupancy'],
    required: true,
    index: true
  },
  
  // Payment details (SAME structure as embedded paymentDetails)
  method: {
    type: String,
    enum: ['Walk-In', 'Online'],
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Failed'],
    default: 'Pending',
    index: true
  },
  referenceNumber: {
    type: String,
    sparse: true
  },
  amountPaid: {
    type: Number,
    default: null
  },
  
  // Payment proof (BASE64 - same as embedded)
  paymentProof: {
    fileName: {
      type: String,
      required: false
    },
    fileContent: {
      type: String, // BASE64 encoded
      required: false
    },
    mimeType: {
      type: String,
      required: false
    },
    fileSize: {
      type: Number,
      required: false
    }
  },
  
  // Timestamps
  dateSubmitted: {
    type: Date,
    default: null
  },
  
  // Legacy compatibility
  proofOfPaymentFile: {
    type: String, // File path (legacy)
    required: false
  },
  
  // Soft delete
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
PaymentSchema.index({ applicationId: 1, isActive: 1 });
PaymentSchema.index({ status: 1, dateSubmitted: 1 });

export default mongoose.model('Payment', PaymentSchema);
