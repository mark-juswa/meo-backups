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
// (We keep it explicit so frontend can highlight low-confidence fields.)
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

  // Anchors vary per LGU. We include common terms used in PH forms.
  const fields = {
    applicantName: firstMatch(text, [
      /Applicant\s*Name\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /Name\s*of\s*(?:Owner|Applicant)\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /Owner\s*\/\s*Applicant\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i
    ]),

    projectLocation: firstMatch(text, [
      /Project\s*Location\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /Location\s*of\s*Project\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i,
      /Address\s*\(Location\)\s*[:\-]?\s*([A-Z0-9#.,'\-\/ ]{5,})/i
    ]),

    barangay: firstMatch(text, [
      /Barangay\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /Brgy\.?\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i
    ]),

    cityMunicipality: firstMatch(text, [
      /(City|Municipality)\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i,
      /City\s*\/\s*Municipality\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i
    ]),

    lotNumber: firstMatch(text, [
      /Lot\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9\-]{1,})/i,
      /Lot\s*#\s*[:\-]?\s*([A-Z0-9\-]{1,})/i
    ]),

    blockNumber: firstMatch(text, [
      /Block\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9\-]{1,})/i,
      /Blk\.?\s*[:\-]?\s*([A-Z0-9\-]{1,})/i
    ]),

    existingLandUse: firstMatch(text, [
      /Existing\s*Land\s*Use\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i,
      /Present\s*Land\s*Use\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i
    ]),

    zoningClassification: firstMatch(text, [
      /Zoning\s*Classification\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{2,})/i,
      /Zone\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{2,})/i,
      /Land\s*Use\s*Classification\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{2,})/i
    ]),

    projectTypeNature: firstMatch(text, [
      /Project\s*Type\s*\/\s*Nature\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i,
      /Nature\s*of\s*Project\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i,
      /Proposed\s*Use\s*[:\-]?\s*([A-Z0-9 .,'\-\/]{3,})/i
    ]),

    lotArea: firstMatch(text, [
      /Lot\s*Area\s*[:\-]?\s*([0-9,\.]{1,}(?:\s*(?:sq\.?m\.?|sqm|m2))?)/i,
      /Area\s*of\s*Lot\s*[:\-]?\s*([0-9,\.]{1,}(?:\s*(?:sq\.?m\.?|sqm|m2))?)/i
    ]),

    projectCost: firstMatch(text, [
      /Project\s*Cost\s*[:\-]?\s*(PHP\s*)?([0-9,\.]{2,})/i,
      /Estimated\s*Cost\s*[:\-]?\s*(PHP\s*)?([0-9,\.]{2,})/i
    ])
  };

  // Fix cityMunicipality match when regex has 2 capture groups
  // (if it captured "City" or "Municipality" in group 1)
  if (fields.cityMunicipality && /^(city|municipality)$/i.test(fields.cityMunicipality)) {
    // Try alternative: look for "City/Municipality: <value>"
    fields.cityMunicipality = firstMatch(text, [
      /City\s*\/\s*Municipality\s*[:\-]?\s*([A-Z0-9 .,'\-]{3,})/i
    ]);
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
