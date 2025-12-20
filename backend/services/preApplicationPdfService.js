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

  // Field mapping for HLURB Locational Clearance template
  // Maps our database field names to actual PDF form field names
  const mapping = {
    // Administrative fields
    application_no: 'application_no',
    date_of_receipt: 'date_of_receipt',
    or_no: 'or_no',
    or_date_issued: 'or_date_issued',
    or_amount_paid: 'or_amount_paid',
    
    // Applicant details
    applicant_name: 'applicant_name',
    corporation_name: 'corporation_name',
    applicant_address: 'applicant_address',
    corporation_address: 'corporation_address',
    authorized_rep_name: 'authorized_rep_name',
    authorized_rep_address: 'authorized_rep_address',
    
    // Project details
    project_type: 'project_type',
    project_nature_new: 'project_nature_new',
    project_nature_existing: 'project_nature_existing',
    project_nature_other: 'project_nature_other',
    project_location: 'project_location',
    project_tenure_permanent: 'project_tenure_permanent',
    project_tenure_temporary: 'project_tenure_temporary',
    
    // Land rights
    right_owner: 'right_owner',
    right_lessee: 'right_lessee',
    right_other: 'right_other',
    
    // Areas
    lot_area_sqm: 'lot_area_sqm',
    building_area: 'building_area',
    
    // Land use classifications
    land_use_residential: 'land_use_residential',
    land_use_institutional: 'land_use_institutional',
    land_use_commercial: 'land_use_commercial',
    land_use_industrial: 'land_use_industrial',
    land_use_vacant: 'land_use_vacant',
    land_use_agricultural: 'land_use_agricultural',
    
    // Administrative processes
    notice_date: 'notice_date',
    applied_other_yes: 'applied_other_yes',
    applied_other_no: 'applied_other_no',
    other_application_date: 'other_application_date',
    other_application_action: 'other_application_action',
    
    // Signatures
    rep_signature_name: 'rep_signature_name',
    applicant_signature_name: 'applicant_signature_name'
  };

  for (const [key, fieldName] of Object.entries(mapping)) {
    const value = landUseData?.[key];
    if (!value) continue;
    
    try {
      // Handle checkbox fields (marked as 'checked')
      if (value === 'checked') {
        try {
          form.getCheckBox(fieldName).check();
        } catch (_) {
          // Fallback to text field if checkbox doesn't exist
          form.getTextField(fieldName).setText('✓');
        }
      } else {
        // Regular text field
        form.getTextField(fieldName).setText(toStr(value));
      }
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
