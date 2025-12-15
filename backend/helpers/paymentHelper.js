// helpers/paymentHelper.js
// Helper functions for payment operations

import Payment from '../models/Payment.js';

/**
 * Create or update payment record
 */
export const submitPayment = async (applicationId, applicationType, paymentData) => {
  // Find or create payment record
  let payment = await Payment.findOne({ applicationId });

  if (!payment) {
    payment = new Payment({
      applicationId,
      applicationType,
      method: paymentData.method,
      status: 'Pending'
    });
  }

  // Update payment details
  payment.method = paymentData.method;
  payment.referenceNumber = paymentData.referenceNumber || payment.referenceNumber;
  payment.amountPaid = paymentData.amountPaid || payment.amountPaid;
  payment.dateSubmitted = new Date();

  // Store payment proof
  if (paymentData.paymentProof) {
    payment.paymentProof = {
      fileName: paymentData.paymentProof.fileName,
      fileContent: paymentData.paymentProof.fileContent,
      mimeType: paymentData.paymentProof.mimeType,
      fileSize: paymentData.paymentProof.fileSize
    };
    payment.proofOfPaymentFile = paymentData.proofOfPaymentFile || null;
  }

  await payment.save();
  return payment;
};

/**
 * Get payment for an application
 */
export const getPayment = async (applicationId) => {
  const payment = await Payment.findOne({
    applicationId,
    isActive: true
  }).lean();

  return payment;
};

/**
 * Get payment proof file data
 */
export const getPaymentProof = async (applicationId) => {
  const payment = await Payment.findOne({
    applicationId,
    isActive: true
  }).lean();

  if (!payment || !payment.paymentProof) {
    return null;
  }

  return payment.paymentProof;
};
