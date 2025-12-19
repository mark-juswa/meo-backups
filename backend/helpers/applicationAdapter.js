// helpers/applicationAdapter.js
// Adapter to maintain API response shape while using separate collections

import Document from '../models/Document.js';
import Payment from '../models/Payment.js';

/**
 * Enriches application with documents and payment from separate collections
 * Returns application with embedded-like structure for frontend compatibility
 */
export const enrichApplication = async (application) => {
  if (!application) return null;

  // Convert to plain object if it's a Mongoose document
  const enriched = application.toObject ? application.toObject() : { ...application };

  try {
    // Fetch documents from separate collection, ordered by originalIndex
    const documents = await Document.find({
      applicationId: enriched._id,
      isActive: true
    })
    .sort({ originalIndex: 1 })
    .lean();

    // Map to embedded document format
    enriched.documents = documents.map(doc => ({
      _id: doc._id,
      originalIndex: doc.originalIndex,
      requirementName: doc.requirementName,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileContent: doc.fileContent,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedBy,
      uploadedByRole: doc.uploadedByRole
    }));

    // Fetch payment from separate collection
    const payment = await Payment.findOne({
      applicationId: enriched._id,
      isActive: true
    }).lean();

    // Map to embedded payment format
    if (payment) {
      enriched.paymentDetails = {
        method: payment.method,
        status: payment.status,
        referenceNumber: payment.referenceNumber,
        proofOfPaymentFile: payment.proofOfPaymentFile,
        paymentProof: payment.paymentProof,
        dateSubmitted: payment.dateSubmitted,
        amountPaid: payment.amountPaid
      };
    } else if (!enriched.paymentDetails) {
      // Provide default structure if no payment exists
      enriched.paymentDetails = {
        method: null,
        status: 'Pending',
        referenceNumber: null,
        proofOfPaymentFile: null,
        paymentProof: null,
        dateSubmitted: null,
        amountPaid: null
      };
    }

  } catch (error) {
    console.error('Error enriching application:', error);
    // Fallback to embedded data if separate collections fail
    enriched.documents = enriched.documents || [];
    enriched.paymentDetails = enriched.paymentDetails || {
      method: null,
      status: 'Pending'
    };
  }

  return enriched;
};

/**
 * Enriches multiple applications
 */
export const enrichApplications = async (applications) => {
  return Promise.all(applications.map(app => enrichApplication(app)));
};
