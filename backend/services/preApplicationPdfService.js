import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toStr = (v) => (v === null || v === undefined ? '' : String(v));

// Uses a zoning/locational clearance template placed in frontend/public.
// The template should be an AcroForm (fillable) PDF for best results.
export async function generateZoningFilledPdfBytes(landUseData) {
  const templatePath = path.join(
    __dirname,
    '../../frontend/public/zoning_locational_clearance_template.pdf'
  );

  if (!fs.existsSync(templatePath)) {
    const err = new Error(
      'Zoning/Locational Clearance PDF template not found. Expected frontend/public/zoning_locational_clearance_template.pdf'
    );
    err.statusCode = 500;
    throw err;
  }

  const bytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(bytes);

  // If template has form fields, fill them.
  const form = pdfDoc.getForm();

  // These field names must match the PDF template form field names.
  // You can adjust mapping once the exact LGU template is chosen.
  const mapping = {
    applicantName: 'applicant_name',
    projectLocation: 'project_location',
    barangay: 'barangay',
    cityMunicipality: 'city_municipality',
    lotNumber: 'lot_no',
    blockNumber: 'block_no',
    existingLandUse: 'existing_land_use',
    zoningClassification: 'zoning_classification',
    projectTypeNature: 'project_type_nature',
    lotArea: 'lot_area',
    projectCost: 'project_cost'
  };

  for (const [key, fieldName] of Object.entries(mapping)) {
    try {
      form.getTextField(fieldName).setText(toStr(landUseData?.[key]));
    } catch (_) {
      // Template may not contain the field; ignore to stay robust.
    }
  }

  // Embed a font to avoid missing glyphs in some PDF viewers (optional).
  try {
    await pdfDoc.embedFont(StandardFonts.Helvetica);
  } catch (_) {}

  form.flatten();
  return await pdfDoc.save();
}
