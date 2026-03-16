"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SEOProps {
  title?: string;
  description?: string;
  name?: string;
  type?: string;
  image?: string;
  url?: string;
  jsonLd?: Record<string, any>;
  keywords?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  name = "BíbliaLM",
  type = "website",
  image = "https://biblialm.com/og-image.jpg",
  url = typeof window !== 'undefined' ? window.location.href : '',
  jsonLd,
  keywords
}) => {
  // Use settings from Context if available
  const { systemSettings } = useAuth();
  const defaultSeo = systemSettings?.seo;

  const metaTitle = title ? `${title} | ${name}` : defaultSeo?.defaultTitle || "BíbliaLM";
  const metaDescription = description || defaultSeo?.defaultDescription || "Uma experiência de estudo bíblico profundo com IA.";
  const metaKeywords = keywords || defaultSeo?.defaultKeywords || "bíblia, estudo, ia, jesus";

  useEffect(() => {
    // 1. Atualizar Título
    document.title = metaTitle;

    // 2. Função auxiliar para atualizar ou criar meta tags
    const updateMeta = (selectorAttr: string, selectorValue: string, content: string) => {
      let element = document.querySelector(`meta[${selectorAttr}="${selectorValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(selectorAttr, selectorValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Metadata
    updateMeta('name', 'description', metaDescription);
    updateMeta('name', 'keywords', metaKeywords);
    
    // Canonical Tag
    let canonical = document.querySelector(`link[rel="canonical"]`);
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    // Remove query params for canonical unless necessary (adjust as needed)
    const cleanUrl = url.split('?')[0];
    canonical.setAttribute('href', cleanUrl);

    // Open Graph / Facebook
    updateMeta('property', 'og:type', type);
    updateMeta('property', 'og:title', metaTitle);
    updateMeta('property', 'og:description', metaDescription);
    updateMeta('property', 'og:image', image);
    updateMeta('property', 'og:url', url);
    updateMeta('property', 'og:site_name', name);

    // Twitter
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:creator', defaultSeo?.twitterHandle || '@biblialm');
    updateMeta('name', 'twitter:title', metaTitle);
    updateMeta('name', 'twitter:description', metaDescription);
    updateMeta('name', 'twitter:image', image);

    // 3. Handle JSON-LD (Dados Estruturados)
    const scriptId = 'seo-json-ld';
    let script = document.getElementById(scriptId);
    
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

  }, [metaTitle, metaDescription, metaKeywords, name, type, image, url, jsonLd, defaultSeo]);

  return null;
};

export default SEO;