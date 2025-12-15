export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  applications: `${API_BASE_URL}/applications`,
  documents: `${API_BASE_URL}/documents`
};