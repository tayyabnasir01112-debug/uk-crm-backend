// API configuration for frontend
// Uses environment variable for backend URL in production
// Falls back to relative URLs in development

const getApiBaseUrl = () => {
  // In production (Netlify), use environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use relative URL (same origin)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build full API URLs
export const apiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
};

