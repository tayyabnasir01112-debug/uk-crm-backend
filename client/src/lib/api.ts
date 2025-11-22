// API configuration for frontend
// Uses environment variable for backend URL in production
// Falls back to relative URLs in development

// Lazy getter - resolves URL when actually needed (after window.__API_URL__ is set)
const getApiBaseUrl = (): string => {
  // Try multiple sources for the API URL (runtime and build-time)
  // 1. Vite env var (set at build time)
  // 2. Window global (can be set at runtime via script tag)
  // 3. Default to Render backend (always available)
  
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

// Use a getter function instead of a constant to resolve lazily
let _apiBaseUrl: string | null = null;
export const getAPIBaseURL = (): string => {
  if (!_apiBaseUrl) {
    _apiBaseUrl = getApiBaseUrl();
  }
  return _apiBaseUrl;
};

// For backward compatibility, but use getter internally
export const API_BASE_URL = getAPIBaseURL();

// Helper function to build full API URLs
export const apiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Use getter to ensure URL is resolved when needed
  const base = getAPIBaseURL();
  
  if (base) {
    // Remove trailing slash from base URL if present
    const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
    // Ensure no double slashes
    return `${baseUrl}/${cleanPath}`;
  }
  
  // Relative URL for development
  return `/${cleanPath}`;
};

// Debug helper - log after a short delay to ensure window.__API_URL__ is set
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const resolved = getAPIBaseURL();
    console.log('🌐 API Configuration:');
    console.log('  - Resolved API Base URL:', resolved);
    console.log('  - VITE_API_URL env:', import.meta.env.VITE_API_URL || '(not set)');
    console.log('  - Window API URL:', (window as any).__API_URL__ || '(not set)');
  }, 100);
}

