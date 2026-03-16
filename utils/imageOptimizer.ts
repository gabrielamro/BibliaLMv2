
/**
 * Otimiza uma imagem (File ou Base64 String) para padrões web mobile.
 * Alvo: Max 1080px (largura ou altura), Formato WebP, Qualidade 0.85.
 */
export const optimizeImage = (source: File | string): Promise<{ blob: Blob, base64: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isFile = source instanceof File;

    // Timeout de segurança: 10 segundos
    const timer = setTimeout(() => {
        reject(new Error("Timeout na otimização da imagem. O arquivo pode ser muito grande ou corrompido."));
    }, 10000);

    img.onload = () => {
      clearTimeout(timer);
      try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIMENSION = 1080; // Padrão Instagram/Feed de Alta Qualidade
    
          // Redimensionamento proporcional (Manter Aspect Ratio)
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }
    
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Falha ao criar contexto de canvas"));
            return;
          }
    
          // Melhor qualidade de interpolação
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
    
          // Exportar para WebP (Melhor compressão que JPEG/PNG)
          const mimeType = 'image/webp';
          const quality = 0.85; // 85% de qualidade é o sweet spot
    
          const base64 = canvas.toDataURL(mimeType, quality);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({ blob, base64 });
            } else {
              reject(new Error("Falha na compressão da imagem"));
            }
          }, mimeType, quality);
      } catch (e) {
          reject(e);
      } finally {
          if (isFile) URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = (err) => {
        clearTimeout(timer);
        reject(new Error("Erro ao carregar imagem para otimização."));
    };

    img.src = isFile ? URL.createObjectURL(source) : source;
  });
};

/**
 * Converte uma string Base64 DataURI diretamente para Blob de forma estável.
 * Evita o uso de fetch(base64) que pode falhar em conteúdos muito grandes.
 */
export const base64ToBlob = async (base64: string): Promise<Blob> => {
  try {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  } catch (e) {
    console.warn("Fallback base64 to blob conversion", e);
    // Fallback para o método fetch se a conversão manual falhar por algum motivo de encoding
    const response = await fetch(base64);
    return await response.blob();
  }
};
