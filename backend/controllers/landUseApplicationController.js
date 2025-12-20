import LandUseApplication from '../models/LandUseApplication.js';
import { generateZoningFilledPdfBytes } from '../services/preApplicationPdfService.js';

const assertOwner = (doc, userId) => {
  if (doc.applicant.toString() !== userId) {
    const err = new Error('Unauthorized access');
    err.statusCode = 403;
    throw err;
  }
};

// POST /api/pre-application/land-use
// Creates a Draft record. Does NOT submit any permit.
export const createLandUseDraft = async (req, res) => {
  try {
    const applicantId = req.user.userId;
    const { data, ocr } = req.body || {};

    const doc = await LandUseApplication.create({
      applicant: applicantId,
      status: 'Draft',
      data: {
        applicantName: data?.applicantName || '',
        projectLocation: data?.projectLocation || '',
        barangay: data?.barangay || '',
        cityMunicipality: data?.cityMunicipality || '',
        lotNumber: data?.lotNumber || '',
        blockNumber: data?.blockNumber || '',
        existingLandUse: data?.existingLandUse || '',
        zoningClassification: data?.zoningClassification || '',
        projectTypeNature: data?.projectTypeNature || '',
        lotArea: data?.lotArea || '',
        projectCost: data?.projectCost || ''
      },
      ocr: ocr
        ? {
            rawText: ocr.rawText || '',
            confidence: typeof ocr.confidence === 'number' ? ocr.confidence : null,
            warnings: ocr.warnings || [],
            uploadedFileName: ocr.uploadedFileName || null,
            uploadedMimeType: ocr.uploadedMimeType || null,
            extractedAt: ocr.extractedAt || new Date()
          }
        : null
    });

    return res.status(201).json({ landUseApplication: doc });
  } catch (error) {
    console.error('createLandUseDraft error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// GET /api/pre-application/land-use/my
export const listMyLandUse = async (req, res) => {
  try {
    const applicantId = req.user.userId;
    const docs = await LandUseApplication.find({ applicant: applicantId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ landUseApplications: docs });
  } catch (error) {
    console.error('listMyLandUse error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/pre-application/land-use/:id
export const getLandUseById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await LandUseApplication.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    assertOwner(doc, req.user.userId);
    return res.status(200).json({ landUseApplication: doc });
  } catch (error) {
    console.error('getLandUseById error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// PUT /api/pre-application/land-use/:id
// Updates fields while Draft/Verified. (We allow edits even after Verified if you want stricter rules later.)
export const updateLandUse = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};

    const doc = await LandUseApplication.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    assertOwner(doc, req.user.userId);

    doc.data = {
      ...doc.data,
      ...Object.fromEntries(
        Object.entries(data || {}).filter(([k]) => k in doc.data)
      )
    };

    await doc.save();
    return res.status(200).json({ landUseApplication: doc });
  } catch (error) {
    console.error('updateLandUse error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// POST /api/pre-application/land-use/:id/confirm
// Explicit user confirmation step.
export const confirmLandUse = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};

    const doc = await LandUseApplication.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    assertOwner(doc, req.user.userId);

    // Apply last-second edits from UI
    if (data) {
      doc.data = {
        ...doc.data,
        ...Object.fromEntries(Object.entries(data).filter(([k]) => k in doc.data))
      };
    }

    doc.status = 'Verified';

    await doc.save();
    return res.status(200).json({ landUseApplication: doc });
  } catch (error) {
    console.error('confirmLandUse error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// POST /api/pre-application/land-use/:id/generate-pdf
// Generates a filled PDF using pdf-lib and stores it in this pre-application record.
export const generateLandUsePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await LandUseApplication.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    assertOwner(doc, req.user.userId);

    if (doc.status !== 'Verified') {
      return res.status(400).json({
        message: 'You must confirm (verify) the extracted/entered data before generating the filled PDF.'
      });
    }

    const pdfBytes = await generateZoningFilledPdfBytes(doc.data);
    const base64 = Buffer.from(pdfBytes).toString('base64');

    doc.generatedPdf = {
      fileName: `Zoning_LandUse_${doc._id}.pdf`,
      fileContent: base64,
      mimeType: 'application/pdf',
      generatedAt: new Date()
    };

    await doc.save();

    return res.status(200).json({
      message: 'PDF generated',
      landUseApplication: doc
    });
  } catch (error) {
    console.error('generateLandUsePdf error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error', details: error.details });
  }
};

// GET /api/pre-application/land-use/:id/pdf
export const serveLandUsePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await LandUseApplication.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    assertOwner(doc, req.user.userId);

    if (!doc.generatedPdf?.fileContent) {
      return res.status(404).json({ message: 'No generated PDF available for this record.' });
    }

    const buffer = Buffer.from(doc.generatedPdf.fileContent, 'base64');
    res.setHeader('Content-Type', doc.generatedPdf.mimeType || 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${doc.generatedPdf.fileName || 'zoning.pdf'}"`);
    return res.send(buffer);
  } catch (error) {
    console.error('serveLandUsePdf error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};
