let initialized = false;
let measurementId: string | undefined;

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (initialized) return;

  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!id) return;

  measurementId = id;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: any[]) {
    window.dataLayer.push(args);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", id, {
    anonymize_ip: true,
  });
}

export function trackPageview(path: string) {
  if (!initialized || !measurementId || typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
  });
}

