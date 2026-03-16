"use client";


import React, { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical' | 'autorelaxed';
  layout?: string; // data-ad-layout
  layoutKey?: string; // data-ad-layout-key
  label?: string; // Label visual (ex: Publicidade)
  className?: string;
  style?: React.CSSProperties;
}

const AdUnit: React.FC<AdUnitProps> = ({ 
  slot, 
  format = 'auto', 
  layout, 
  layoutKey, 
  label, 
  className = '',
  style 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  // Reset state when slot changes to allow re-rendering new ads
  useEffect(() => {
    setAdLoaded(false);
  }, [slot]);

  useEffect(() => {
    // If already loaded or server-side, skip
    if (adLoaded || typeof window === 'undefined') return;

    let intervalId: any;
    let attempts = 0;
    const maxAttempts = 50; // Try for 5 seconds (50 * 100ms)

    const pushAd = () => {
      // CRITICAL: Only push if the container has actual width
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        // Fluid/In-Article ads require min-width 250px
        const isFluid = layout === 'in-article' || format === 'fluid';
        if (isFluid && containerRef.current.offsetWidth < 250) {
            console.warn(`AdSense: Container width (${containerRef.current.offsetWidth}px) too small for fluid ad. Skipping push.`);
            setAdLoaded(true); // Mark as loaded to stop retry
            return true;
        }

        try {
          // @ts-ignore
          const adsbygoogle = window.adsbygoogle || [];
          // @ts-ignore
          window.adsbygoogle = adsbygoogle;
          
          adsbygoogle.push({});
          setAdLoaded(true);
          return true; // Success
        } catch (e) {
          console.error("AdSense Push Error:", e);
          // Even if error, mark as loaded to stop trying
          setAdLoaded(true); 
          return true;
        }
      }
      return false; // Not ready yet
    };

    // Attempt 1: Immediate
    if (!pushAd()) {
      // Attempt 2+: Polling every 100ms until width is available
      intervalId = setInterval(() => {
        attempts++;
        if (pushAd() || attempts >= maxAttempts) {
          clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [slot, adLoaded, layout, format]);

  // Check dev environment for placeholder
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center justify-center my-6 min-h-[100px] ${className}`}>
      {label && (
        <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block text-center w-full">
          {label}
        </span>
      )}
      
      <div className="w-full bg-gray-50/50 dark:bg-black/20 rounded-xl overflow-hidden relative text-center min-h-[100px] flex items-center justify-center border border-transparent dark:border-gray-800">
        {isDev && (
           <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 m-1 rounded-lg text-center p-1 pointer-events-none z-10">
             AdSense Slot: {slot}<br/>(Visível em Produção)
           </div>
        )}
        
        <ins 
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '100px', ...style }}
            data-ad-client="ca-pub-7481812422261627"
            data-ad-slot={slot}
            data-ad-format={layout ? 'fluid' : format} // Use fluid for in-article/feed
            data-full-width-responsive="true"
            data-ad-layout={layout}
            data-ad-layout-key={layoutKey}
        ></ins>
      </div>
    </div>
  );
};

export default AdUnit;
