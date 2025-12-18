// Centralized normalization of outgoing status values to match backend enums
// Do NOT modify backend. Map frontend-desired statuses to model-allowed values per app type.

const OCCUPANCY_ALLOWED = new Set([
  'Submitted',
  'Pending MEO',
  'Payment Submitted',
  'Pending BFP',
  'Pending Mayor',
  'Approved',
  'Rejected',
  'Permit Issued',
]);

// Common frontend statuses that may appear but are not in Occupancy enum
const OCCUPANCY_REMAP = Object.freeze({
  'Payment Pending': 'Pending MEO',
  'For Review': 'Pending MEO',
  'Returned': 'Pending MEO',
  'Payment Verified': 'Pending BFP', // adjust if your flow differs
});

export function normalizeStatusForApp(app, desiredStatus) {
  try {
    if (!app) return desiredStatus;
    const isOccupancy = app.applicationType === 'Occupancy' || !app.box1; // box1 often implies Building
    if (!isOccupancy) return desiredStatus; // Building passes through

    const mapped = OCCUPANCY_REMAP[desiredStatus] || desiredStatus;
    if (OCCUPANCY_ALLOWED.has(mapped)) return mapped;

    // Fallback to a safe default for Occupancy
    return 'Pending MEO';
  } catch (e) {
    return desiredStatus;
  }
}

export default normalizeStatusForApp;
