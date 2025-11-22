// API configuration for frontend
// Uses environment variable for backend URL in production
// Falls back to relative URLs in development

const getApiBaseUrl = () => {
  // Try multiple sources for the API URL (runtime and build-time)
  // 1. Vite env var (set at build time)
  // 2. Window global (can be set at runtime)
  // 3. Default to Render backend
  
  const viteUrl = import.meta.env.VITE_API_URL;
  const windowUrl = typeof window !== 'undefined' ? (window as any).__API_URL__ : undefined;
  const defaultUrl = 'https://uk-crm-backend.onrender.com';
  
  // Always use default if nothing else is set (production fallback)
  // This ensures we always have a valid URL
  const apiUrl = viteUrl || windowUrl || defaultUrl;
  
  if (apiUrl) {
    // Remove trailing slash if present
    const cleaned = apiUrl.replace(/\/$/, '');
    return cleaned;
  }
  
  // Fallback (should never reach here with defaultUrl)
  return defaultUrl;
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

// Debug helper - always log in production to help troubleshoot
console.log('API Base URL:', API_BASE_URL || '(relative)');
console.log('VITE_API_URL env:', import.meta.env.VITE_API_URL || '(not set)');
console.log('Window API URL:', (window as any).__API_URL__ || '(not set)');

