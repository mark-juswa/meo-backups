// Deterministic, rule-based extraction for PH Zoning / Locational Clearance forms.
// This is NOT AI. It uses keyword anchors + regex heuristics.

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const cleanValue = (v) =>
  (v || '')
    .replace(/^[\s:.-]+/, '')
    .replace(/[\s.]+$/, '')
    .replace(/[ ]{2,}/g, ' ')
    .trim();

const firstMatch = (text, patterns) => {
  for (const p of patterns) {
    const m = text.match(p);
    if (!m) continue;

    // Prefer the last non-empty capturing group (patterns often include optional prefix groups).
    // Fall back to whole match.
    const capturedGroups = m.slice(1).filter((g) => typeof g === 'string' && g.trim());
    const best = capturedGroups.length ? capturedGroups[capturedGroups.length - 1] : (m[0] || '');
    const cleaned = cleanValue(best);
    if (cleaned) return cleaned;
  }
  return '';
};

// A very lightweight scoring: 1 if extracted non-empty, else 0.
// (Frontend uses this as a confidence indicator per field, not as a probability.)
const score = (v) => (v ? 1 : 0);

export function parseZoningClearanceText(rawText) {
  const warnings = [];
  const text = normalizeText(rawText);

  if (!text) {
    return {
      fields: {},
      fieldScores: {},
      parseQuality: 'empty',
      warnings: ['OCR returned no text. Please upload a clearer scan or enter data manually.']
    };
  }

  // Extract fields based on the actual HLURB Locational Clearance template layout
  // Principle: never invent values; only return what can be anchored/detected from text.
  const fields = {
    // Administrative fields
    application_no: firstMatch(text, [
      /Application\s*No\.?\s*[:\-]?\s*([A-Z0-9\-]{1,})/i,
      /App\.?\s*No\.?\s*[:\-]?\s*([A-Z0-9\-]{1,})/i
    ]),

    date_of_receipt: firstMatch(text, [
      /Date\s*of\s*Receipt\s*[:\-]?\s*([0-9\/\-\.]{8,})/i,
      /Receipt\s*Date\s*[:\-]?\s*([0-9\/\-\.]{8,})/i
    ]),

    or_no: firstMatch(text, [
      /O\.?R\.?\s*No\.?\s*[:\-]?\s*([A-Z0-9\-]{1,})/i,
      /Official\s*Receipt\s*No\.?\s*[:\-]?\s*([A-Z0-9\-]{1,})/i
    ]),

    or_date_issued: firstMatch(text, [
      /Date\s*of\s*Issued\s*[:\-]?\s*([0-9\/\-\.]{8,})/i,
      /O\.?R\.?\s*Date\s*[:\-]?\s*([0-9\/\-\.]{8,})/i
    ]),

    or_amount_paid: firstMatch(text, [
      /Amount\s*Paid\s*[:\-]?\s*(PHP?\s*)?([0-9,\.]{1,})/i,
      /Payment\s*Amount\s*[:\-]?\s*(PHP?\s*)?([0-9,\.]{1,})/i
    ]),

    // Applicant details - based on template fields 1-6
    applicant_name: firstMatch(text, [
      /Name\s*of\s*Applicant\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /Applicant\s*Name\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /1\.\s*Name\s*of\s*Applicant\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i
    ]),

    corporation_name: firstMatch(text, [
      /Name\s*of\s*Corporation\s*[:\-]?\s*([A-Z0-9 .,'\-&]{3,})/i,
      /Corporation\s*Name\s*[:\-]?\s*([A-Z0-9 .,'\-&]{3,})/i,
      /2\.\s*Name\s*of\s*Corporation\s*[:\-]?\s*([A-Z0-9 .,'\-&]{3,})/i
    ]),

    applicant_address: firstMatch(text, [
      /Address\s*of\s*Applicant\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /Applicant\s*Address\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /3\.\s*Address\s*of\s*Applicant\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i
    ]),

    corporation_address: firstMatch(text, [
      /Address\s*of\s*Corporation\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /Corporation\s*Address\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /4\.\s*Address\s*of\s*Corporation\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i
    ]),

    authorized_rep_name: firstMatch(text, [
      /Name\s*of\s*Authorized\s*Representative\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /Authorized\s*Representative\s*Name\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /5\.\s*Name\s*of\s*Authorized\s*Representative\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i
    ]),

    authorized_rep_address: firstMatch(text, [
      /Address\s*of\s*Authorized\s*Representative\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /Authorized\s*Representative\s*Address\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /6\.\s*Address\s*of\s*Authorized\s*Representative\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i
    ]),

    // Project details - fields 7-10
    project_type: firstMatch(text, [
      /Project\s*Type\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i,
      /7\.\s*Project\s*Type\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i
    ]),

    project_nature_new: firstMatch(text, [
      /New\s*Development/i,
      /Project\s*Nature.*New\s*Development/i
    ]),

    project_nature_existing: firstMatch(text, [
      /Existing/i,
      /Project\s*Nature.*Existing/i
    ]),

    project_nature_other: firstMatch(text, [
      /Others\s*\(\s*specify\s*\)\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i,
      /Project\s*Nature.*Others.*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i
    ]),

    project_location: firstMatch(text, [
      /Project\s*Location\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /9\.\s*Project\s*Location\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i
    ]),

    project_tenure_permanent: firstMatch(text, [
      /Permanent/i,
      /Project\s*Tenure.*Permanent/i
    ]),

    project_tenure_temporary: firstMatch(text, [
      /Temporary\s*\(\s*specify\s*\)\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i,
      /Project\s*Tenure.*Temporary.*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i
    ]),

    // Land rights - field 11
    right_owner: firstMatch(text, [
      /Owner/i,
      /Right\s*over\s*land.*Owner/i
    ]),

    right_lessee: firstMatch(text, [
      /Lessee/i,
      /Right\s*over\s*land.*Lessee/i
    ]),

    right_other: firstMatch(text, [
      /Right\s*over\s*land.*Others\s*\(\s*specify\s*\)\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i,
      /Others\s*\(\s*specify\s*\).*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i
    ]),

    // Areas - field 12
    lot_area_sqm: firstMatch(text, [
      /Lot\s*[:\-]?\s*([0-9,\.]{1,})/i,
      /Project\s*Area.*Lot\s*[:\-]?\s*([0-9,\.]{1,})/i,
      /12\.\s*Project\s*Area.*Lot\s*[:\-]?\s*([0-9,\.]{1,})/i
    ]),

    building_area: firstMatch(text, [
      /Building\s*\/?\s*Improvement\s*[:\-]?\s*([0-9,\.]{1,})/i,
      /Building\s*Area\s*[:\-]?\s*([0-9,\.]{1,})/i
    ]),

    // Land use classifications - field 13
    land_use_residential: firstMatch(text, [
      /Residential/i,
      /Existing\s*land\s*use.*Residential/i
    ]),

    land_use_institutional: firstMatch(text, [
      /Institutional/i,
      /Existing\s*land\s*use.*Institutional/i
    ]),

    land_use_commercial: firstMatch(text, [
      /Commercial/i,
      /Existing\s*land\s*use.*Commercial/i
    ]),

    land_use_industrial: firstMatch(text, [
      /Industrial/i,
      /Existing\s*land\s*use.*Industrial/i
    ]),

    land_use_vacant: firstMatch(text, [
      /Vacant\s*\/?\s*Idle/i,
      /Existing\s*land\s*use.*Vacant/i
    ]),

    land_use_agricultural: firstMatch(text, [
      /Agricultural\s*\(\s*specify\s*crops\s*\)\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i,
      /Agricultural.*crops.*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i
    ]),

    // Administrative processes - fields 15-16
    notice_date: firstMatch(text, [
      /Date\s*of\s*notice\/s\s*[:\-]?\s*([0-9\/\-\.]{8,})/i,
      /Notice\s*Date\s*[:\-]?\s*([0-9\/\-\.]{8,})/i
    ]),

    applied_other_yes: firstMatch(text, [
      /subject\s*of\s*similar\s*application.*Yes/i,
      /similar\s*application.*Yes/i
    ]),

    applied_other_no: firstMatch(text, [
      /subject\s*of\s*similar\s*application.*No/i,
      /similar\s*application.*No/i
    ]),

    other_application_date: firstMatch(text, [
      /Date\s*filed\s*[:\-]?\s*([0-9\/\-\.]{8,})/i,
      /Application\s*Date\s*[:\-]?\s*([0-9\/\-\.]{8,})/i
    ]),

    other_application_action: firstMatch(text, [
      /Action\s*Taken\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{5,})/i,
      /Action.*[:\-]?\s*([A-Z0-9 .,'\-\/]{5,})/i
    ]),

    // Signatures
    rep_signature_name: firstMatch(text, [
      /Name\s*in\s*Print\s*&\s*Signature\s*of\s*Authorized\s*Representative\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /Authorized\s*Representative.*Name.*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i
    ]),

    applicant_signature_name: firstMatch(text, [
      /Name\s*in\s*Print\s*&\s*Signature\s*of\s*Applicant\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /Applicant.*Name.*Signature.*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i
    ])
  };

  // Post-processing: handle checkbox-like fields where we detect presence
  // Convert boolean-ish detections to proper values
  if (fields.project_nature_new && /new/i.test(fields.project_nature_new)) {
    fields.project_nature_new = 'checked';
  }
  if (fields.project_nature_existing && /existing/i.test(fields.project_nature_existing)) {
    fields.project_nature_existing = 'checked';
  }
  if (fields.project_tenure_permanent && /permanent/i.test(fields.project_tenure_permanent)) {
    fields.project_tenure_permanent = 'checked';
  }
  if (fields.right_owner && /owner/i.test(fields.right_owner)) {
    fields.right_owner = 'checked';
  }
  if (fields.right_lessee && /lessee/i.test(fields.right_lessee)) {
    fields.right_lessee = 'checked';
  }
  if (fields.land_use_residential && /residential/i.test(fields.land_use_residential)) {
    fields.land_use_residential = 'checked';
  }
  if (fields.land_use_institutional && /institutional/i.test(fields.land_use_institutional)) {
    fields.land_use_institutional = 'checked';
  }
  if (fields.land_use_commercial && /commercial/i.test(fields.land_use_commercial)) {
    fields.land_use_commercial = 'checked';
  }
  if (fields.land_use_industrial && /industrial/i.test(fields.land_use_industrial)) {
    fields.land_use_industrial = 'checked';
  }
  if (fields.land_use_vacant && /vacant/i.test(fields.land_use_vacant)) {
    fields.land_use_vacant = 'checked';
  }
  if (fields.applied_other_yes && /yes/i.test(fields.applied_other_yes)) {
    fields.applied_other_yes = 'checked';
  }
  if (fields.applied_other_no && /no/i.test(fields.applied_other_no)) {
    fields.applied_other_no = 'checked';
  }

  const fieldScores = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, score(v)]));

  const extractedCount = Object.values(fieldScores).reduce((a, b) => a + b, 0);
  const parseQuality = extractedCount === 0 ? 'failed' : extractedCount < 4 ? 'partial' : 'ok';

  if (parseQuality !== 'ok') {
    warnings.push(
      'Some fields could not be confidently detected from the scanned form. Please review and fill missing items manually.'
    );
  }

  return { fields, fieldScores, parseQuality, warnings };
}
