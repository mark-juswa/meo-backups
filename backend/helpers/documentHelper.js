// helpers/documentHelper.js
// Helper functions for document operations

import Document from '../models/Document.js';

/**
 * Add a document to the separate collection
 */
export const addDocument = async (applicationId, applicationType, documentData) => {
  // Get current document count to determine originalIndex
  const existingCount = await Document.countDocuments({
    applicationId,
    isActive: true
  });

  const newDocument = new Document({
    applicationId,
    applicationType,
    requirementName: documentData.requirementName,
    fileName: documentData.fileName,
    fileContent: documentData.fileContent,
    mimeType: documentData.mimeType,
    fileSize: documentData.fileSize,
    uploadedBy: documentData.uploadedBy || 'user',
    originalIndex: existingCount, // Preserve array position
    filePath: documentData.filePath || null
  });

  await newDocument.save();
  return newDocument;
};

/**
 * Replace a document by requirementName (for revisions)
 * Maintains the same originalIndex to preserve array position
 */
export const replaceDocument = async (applicationId, applicationType, requirementName, documentData) => {
  // Find existing document
  const existingDoc = await Document.findOne({
    applicationId,
    requirementName,
    isActive: true
  });

  if (!existingDoc) {
    // If no existing document, add as new
    return addDocument(applicationId, applicationType, {
      ...documentData,
      requirementName
    });
  }

  // Mark old document as inactive (soft delete)
  existingDoc.isActive = false;
  await existingDoc.save();

  // Create new document with SAME originalIndex
  const replacementDoc = new Document({
    applicationId,
    applicationType,
    requirementName,
    fileName: documentData.fileName,
    fileContent: documentData.fileContent,
    mimeType: documentData.mimeType,
    fileSize: documentData.fileSize,
    uploadedBy: documentData.uploadedBy || 'user',
    originalIndex: existingDoc.originalIndex, // PRESERVE INDEX
    filePath: documentData.filePath || null
  });

  await replacementDoc.save();
  return replacementDoc;
};

/**
 * Get document by index (for backward compatibility with index-based access)
 */
export const getDocumentByIndex = async (applicationId, index) => {
  const document = await Document.findOne({
    applicationId,
    originalIndex: index,
    isActive: true
  }).lean();

  return document;
};

/**
 * Get all documents as ordered array
 */
export const getDocumentsAsArray = async (applicationId) => {
  const documents = await Document.find({
    applicationId,
    isActive: true
  })
  .sort({ originalIndex: 1 })
  .lean();

  return documents;
};
