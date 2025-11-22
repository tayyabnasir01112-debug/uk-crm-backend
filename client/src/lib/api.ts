// API configuration for frontend
// Hardcoded backend URL - always works, no env var needed
const BACKEND_URL = 'https://uk-crm-backend.onrender.com';

// Simple getter that always returns the backend URL
export const getAPIBaseURL = (): string => {
  return BACKEND_URL;
};

// Export constant for backward compatibility
export const API_BASE_URL = BACKEND_URL;

// Helper function to build full API URLs
export const apiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Always use the hardcoded backend URL
  const base = BACKEND_URL.replace(/\/$/, ''); // Remove trailing slash
  return `${base}/${cleanPath}`;
};

// Debug helper
console.log('🌐 API Base URL:', API_BASE_URL);

