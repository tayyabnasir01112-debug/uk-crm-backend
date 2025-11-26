// API configuration for frontend.
// Detect the best backend URL based on environment to avoid third-party cookies on mobile.
const DEFAULT_BACKEND_URL = "https://uk-crm-backend.onrender.com";

function detectApiBaseUrl() {
  const envUrl = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocalhost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local");

    // In production (any non-local host), use a same-origin relative path so cookies stay first-party.
    if (!isLocalhost) {
      return "/api";
    }
  }

  return DEFAULT_BACKEND_URL;
}

export const API_BASE_URL = detectApiBaseUrl();

export const getAPIBaseURL = (): string => API_BASE_URL;

const normalizeBase = (base: string) => {
  if (base === "/api" || base === "/") {
    return base;
  }
  return base.replace(/\/$/, "");
};

const normalizePathForBase = (base: string, path: string) => {
  if (base === "/api") {
    if (path === "api") {
      return "";
    }
    if (path.startsWith("api/")) {
      return path.slice(4);
    }
  }
  return path;
};

// Helper function to build full API URLs
export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const base = normalizeBase(API_BASE_URL);
  const normalizedPath = normalizePathForBase(base, cleanPath);

  // When using a relative base ("/api"), keep it relative so requests stay same-origin.
  if (base === "/api") {
    return normalizedPath ? `${base}/${normalizedPath}` : base;
  }

  if (base === "/") {
    return normalizedPath ? `/${normalizedPath}` : "/";
  }

  return normalizedPath ? `${base}/${normalizedPath}` : base;
};

// Debug helper
console.log("🌐 API Base URL:", API_BASE_URL);

