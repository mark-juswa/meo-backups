// helpers/documentVisibility.js
// Centralized document visibility filtering rules.
// NOTE: Does not modify schemas or delete documents.

/**
 * @param {Array} documents - array of Document-like objects (either from Document model or mapped/enriched docs)
 * @param {string|null|undefined} requesterRole - app role string: 'meoadmin'|'bfpadmin'|'mayoradmin'|'user'|undefined
 * @param {string|null|undefined} applicationStatus
 * @returns {Array}
 */
export function filterDocumentsForRequester(documents = [], requesterRole, applicationStatus) {
  const docs = Array.isArray(documents) ? documents : [];

  const isAdmin = ['meoadmin', 'bfpadmin', 'mayoradmin'].includes(requesterRole);

  // Public/client rules:
  // - Before approval, admin documents are hidden.
  // - After Approved/Permit Issued, show everything.
  if (!isAdmin) {
    const canSeeAdminDocs = ['Approved', 'Permit Issued'].includes(applicationStatus);
    if (canSeeAdminDocs) return docs;
    return docs.filter(d => d?.uploadedBy !== 'admin');
  }

  // Admin rules:
  // 1) MEO: can see all
  if (requesterRole === 'meoadmin') return docs;

  // Helper predicates
  const isClient = (d) => d?.uploadedBy === 'user';
  const isSystem = (d) => d?.uploadedBy === 'system';
  const isAdminDoc = (d) => d?.uploadedBy === 'admin';

  // 2) BFP: client + system + MEO admin docs + BFP admin docs; never Mayor
  if (requesterRole === 'bfpadmin') {
    return docs.filter(d =>
      isClient(d) ||
      isSystem(d) ||
      (isAdminDoc(d) && ['MEO', 'BFP'].includes(d?.uploadedByRole))
    );
  }

  // 3) MAYOR: client + system + MEO/BFP forwarded docs + Mayor docs; never MEO-only? (Mayor must not act on unreviewed docs)
  // Interpreted as: Mayor sees admin docs from MEO and BFP plus their own.
  if (requesterRole === 'mayoradmin') {
    return docs.filter(d =>
      isClient(d) ||
      isSystem(d) ||
      (isAdminDoc(d) && ['MEO', 'BFP', 'MAYOR'].includes(d?.uploadedByRole))
    );
  }

  return docs;
}
