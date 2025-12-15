
export const convertIdToString = (id) => {
  if (!id) {
    console.error('ID is undefined or null');
    return null;
  }

  // Already a string
  if (typeof id === 'string') {
    return id;
  }

  // MongoDB ObjectId with $oid property
  if (id.$oid) {
    return id.$oid;
  }

  // Object with toString method
  if (typeof id.toString === 'function') {
    const strId = id.toString();
    // Verify it's not the default [object Object]
    if (strId !== '[object Object]') {
      return strId;
    }
  }

  // Last resort - try JSON stringify to see what we have
  console.error('Unable to convert ID to string. Type:', typeof id, 'Value:', JSON.stringify(id));
  return null;
};


export const getAppIdString = (app) => {
  if (!app || !app._id) {
    throw new Error('Application or application ID is missing');
  }

  const idString = convertIdToString(app._id);
  
  if (!idString) {
    throw new Error('Invalid application ID format');
  }

  // Validate MongoDB ObjectId format (24 hex characters)
  if (idString.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(idString)) {
    console.warn('ID does not match MongoDB ObjectId format:', idString);
  }

  return idString;
};
