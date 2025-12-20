import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import Tesseract from 'tesseract.js';

// NOTE: Parsing is added in a separate module so OCR stays independent.
import { parseZoningClearanceText } from '../utils/preApplicationZoningParser.js';

const MAX_PDF_PAGES = 5; // safety limit; can be tuned

const findBinary = (binName) => {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const out = spawnSync(cmd, [binName], { encoding: 'utf8' });
  if (out.status === 0 && out.stdout?.trim()) return out.stdout.trim().split(/\r?\n/)[0];
  return null;
};

const safeUnlink = (p) => {
  try { fs.unlinkSync(p); } catch (_) {}
};

const safeRmDir = (p) => {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch (_) {}
};

async function recognizeImageBuffer(imageBuffer) {
  const result = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: () => {}
  });

  const text = result?.data?.text || '';
  const confidence = typeof result?.data?.confidence === 'number' ? result.data.confidence : null;
  return { text, confidence };
}

function convertPdfToPngFiles({ pdfPath, outDir, prefix }) {
  const pdftoppmPath = findBinary('pdftoppm');
  if (!pdftoppmPath) {
    const err = new Error(
      'PDF upload received, but PDF-to-image conversion is not available on this server (missing pdftoppm). Please upload a scanned image (JPG/PNG) instead.'
    );
    err.statusCode = 400;
    err.details = { requiredBinary: 'pdftoppm' };
    throw err;
  }

  // Convert only first N pages for safety
  // pdftoppm syntax: pdftoppm -png -f 1 -l N input.pdf outPrefix
  const args = ['-png', '-f', '1', '-l', String(MAX_PDF_PAGES), pdfPath, path.join(outDir, prefix)];
  const out = spawnSync(pdftoppmPath, args, { encoding: 'utf8' });
  if (out.status !== 0) {
    const err = new Error('Failed to convert PDF to images for OCR');
    err.statusCode = 400;
    err.details = { stderr: out.stderr, stdout: out.stdout };
    throw err;
  }

  // pdftoppm outputs: prefix-1.png, prefix-2.png, ...
  const files = fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith(prefix + '-') && f.endsWith('.png'))
    .map((f) => path.join(outDir, f))
    .sort((a, b) => {
      const pa = parseInt(path.basename(a).match(/-(\d+)\.png$/)?.[1] || '0', 10);
      const pb = parseInt(path.basename(b).match(/-(\d+)\.png$/)?.[1] || '0', 10);
      return pa - pb;
    });

  if (!files.length) {
    const err = new Error('PDF conversion produced no images');
    err.statusCode = 400;
    throw err;
  }

  return files;
}

const REQUIRED_ZONING_FIELDS = [
  // Administrative fields
  'application_no',
  'date_of_receipt',
  'or_no',
  'or_date_issued',
  'or_amount_paid',
  
  // Applicant details
  'applicant_name',
  'corporation_name',
  'applicant_address', 
  'corporation_address',
  'authorized_rep_name',
  'authorized_rep_address',
  
  // Project details
  'project_type',
  'project_nature_new',
  'project_nature_existing',
  'project_nature_other',
  'project_location',
  'project_tenure_permanent',
  'project_tenure_temporary',
  
  // Land rights
  'right_owner',
  'right_lessee', 
  'right_other',
  
  // Areas
  'lot_area_sqm',
  'building_area',
  
  // Land use classifications
  'land_use_residential',
  'land_use_institutional',
  'land_use_commercial',
  'land_use_industrial',
  'land_use_vacant',
  'land_use_agricultural',
  
  // Administrative processes
  'notice_date',
  'applied_other_yes',
  'applied_other_no', 
  'other_application_date',
  'other_application_action',
  
  // Signatures
  'rep_signature_name',
  'applicant_signature_name'
];

const detectDocumentType = (rawText, originalName = '') => {
  const t = String(rawText || '').toLowerCase();
  const n = String(originalName || '').toLowerCase();

  const hasCore =
    /\bzoning\b/.test(t) ||
    /\blocational\b/.test(t) ||
    /\bland\s*use\b/.test(t) ||
    /\bzoning\b/.test(n) ||
    /\blocational\b/.test(n) ||
    /\bland\s*use\b/.test(n);

  const hasClearance = /\bclearance\b/.test(t) || /\bclearance\b/.test(n) || /\bapplication\b/.test(t);

  if (hasCore && hasClearance) {
    if (t.includes('locational')) return 'Locational Clearance';
    if (t.includes('land use')) return 'Land Use Clearance';
    return 'Zoning Clearance';
  }

  return 'Unknown';
};

export async function runOcrOnUpload(file) {
  const warnings = [];

  const mimeType = file.mimetype;
  const isPdf = mimeType === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf');
  const isImage = /^image\//i.test(mimeType);

  if (!isPdf && !isImage) {
    const err = new Error('Unsupported file type. Please upload a PDF or image (JPG/PNG).');
    err.statusCode = 400;
    err.details = { mimeType };
    throw err;
  }

  let rawText = '';
  let confidence = null;

  // OCR phase should be resilient: if OCR fails, return partial data (warnings + missing fields)
  try {
    if (isImage) {
      const r = await recognizeImageBuffer(file.buffer);
      rawText = r.text;
      confidence = r.confidence;
    } else {
      // PDF: write to temp file, convert pages to PNGs, OCR each page
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tmp_rovodev_preapp_pdf_'));
      const tmpPdfPath = path.join(tmpDir, 'upload.pdf');

      try {
        fs.writeFileSync(tmpPdfPath, file.buffer);

        const pngFiles = convertPdfToPngFiles({ pdfPath: tmpPdfPath, outDir: tmpDir, prefix: 'page' });
        const pageResults = [];

        for (const pngPath of pngFiles) {
          const buf = fs.readFileSync(pngPath);
          // eslint-disable-next-line no-await-in-loop
          pageResults.push(await recognizeImageBuffer(buf));
        }

        rawText = pageResults.map((p) => p.text).join('\n\n');
        const confidences = pageResults.map((p) => p.confidence).filter((c) => typeof c === 'number');
        confidence = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null;

        if (pngFiles.length >= MAX_PDF_PAGES) {
          warnings.push(`PDF has multiple pages. Only first ${MAX_PDF_PAGES} page(s) were processed for OCR.`);
        }
      } finally {
        safeUnlink(tmpPdfPath);
        safeRmDir(tmpDir);
      }
    }
  } catch (err) {
    warnings.push(`OCR failed to read the uploaded document. ${err?.message || ''}`.trim());
  }

  const documentType = detectDocumentType(rawText, file.originalname);

  const parsed = parseZoningClearanceText(rawText);

  // Basic low-confidence warning (tesseract confidence is 0-100)
  if (typeof confidence === 'number' && confidence < 60) {
    warnings.push('Low OCR confidence detected. Please carefully review all fields.');
  }

  // Merge parser warnings
  if (parsed.warnings?.length) warnings.push(...parsed.warnings);

  const detectedFields = parsed.fields || {};
  const confidenceScores = parsed.fieldScores || {};
  const missingFields = REQUIRED_ZONING_FIELDS.filter((k) => {
    const v = detectedFields?.[k];
    return !v || (typeof v === 'string' && !v.trim());
  });

  // Validate document requirement (Land Use / Zoning / Locational Clearance)
  if (documentType === 'Unknown') {
    const err = new Error(
      'Uploaded document does not appear to be a Land Use / Zoning / Locational Clearance. Please upload the correct clearance document.'
    );
    err.statusCode = 400;
    err.partialResult = {
      rawText,
      detectedFields,
      missingFields,
      confidenceScores,
      warnings: [...warnings, 'Document type check failed.']
    };
    throw err;
  }

  return {
    documentType,
    rawText,
    detectedFields,
    missingFields,
    confidenceScores,
    warnings,
    // keep legacy fields for backward-compat (can be removed later)
    confidence
  };
}
