
// Substitua 'G-XXXXXXXXXX' pelo seu ID real do GA4
const GA_MEASUREMENT_ID = 'G-Z8EQKX66TN';

export const initGA = () => {
  // Inicialização agora é feita via tag no index.html para melhor performance
  if (typeof window !== 'undefined' && !window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(...args: any[]) {
          window.dataLayer.push(args);
      }
  }
};

export const logEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// Typescript fix for window
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
