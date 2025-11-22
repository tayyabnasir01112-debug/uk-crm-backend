// API configuration for frontend
// Uses environment variable for backend URL in production
// Falls back to relative URLs in development

const getApiBaseUrl = () => {
  // In production (Netlify), use environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Remove trailing slash if present
    return apiUrl.replace(/\/$/, '');
  }
  
  // In development, use relative URL (same origin)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build full API URLs
export const apiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (API_BASE_URL) {
    // Remove trailing slash from base URL if present
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    // Ensure no double slashes
    return `${base}/${cleanPath}`;
  }
  
  // Relative URL for development
  return `/${cleanPath}`;
};

// Debug helper
if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
  console.log('API Base URL:', API_BASE_URL || '(relative)');
  console.log('VITE_API_URL env:', import.meta.env.VITE_API_URL || '(not set)');
}

