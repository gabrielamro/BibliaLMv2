
/**
 * Opções de customização para a composição da imagem
 */
export interface CompositionOptions {
  textColor: string;
  fontSizeScale: number; // 0.8 a 1.5 (multiplicador)
  verticalPosition: number; // 0 a 100 (porcentagem da altura)
  fontFamily: string; // 'Lora', 'Great Vibes', 'Oswald', 'Cinzel', etc.
  alignment: 'center' | 'left' | 'right';
  filter: 'none' | 'bw' | 'sepia' | 'darken' | 'blur' | 'warm' | 'cool'; // Novos filtros
  overlayOpacity: number; // 0.0 a 0.9
  aspectRatio?: 'feed' | 'story'; // Novo
  textX?: number; // 0 a 100
  textY?: number; // 0 a 100
  bgX?: number; // 0 a 100 (Offset do fundo)
  bgY?: number; // 0 a 100 (Offset do fundo)
  bgScale?: number; // 1 a 3 (Zoom do fundo)
  shadowColor?: string; // Cor da sombra customizável
}

/**
 * Compõe uma imagem final com texto bíblico, referência e marca d'água.
 * Combina a arte de fundo (IA) com tipografia legível e customizável.
 */
export const composeImageWithText = (
    base64Image: string,
    text: string,
    reference: string,
    options: CompositionOptions = {
        textColor: '#ffffff',
        fontSizeScale: 1,
        verticalPosition: 50,
        alignment: 'center',
        fontFamily: 'Lora',
        filter: 'none',
        overlayOpacity: 0.4,
        aspectRatio: 'feed',
        textX: 50,
        textY: 50,
        bgX: 50,
        bgY: 50,
        bgScale: 1,
        shadowColor: 'rgba(0,0,0,0.8)'
    }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      let finalSrc = base64Image;
      
      // Só aplica crossOrigin para URLs externas para evitar problemas com Data URLs
      if (base64Image.startsWith('http')) {
          img.crossOrigin = "anonymous";
          // Bypass cache to prevent CORS errors when the image was already loaded in a normal <img> tag
          const cacheBuster = `cb=${new Date().getTime()}`;
          finalSrc = base64Image.includes('?') ? `${base64Image}&${cacheBuster}` : `${base64Image}?${cacheBuster}`;
      }
      
      const timer = setTimeout(() => {
          reject(new Error("Tempo limite de processamento de imagem excedido."));
      }, 10000); // Aumentado para 10s para redes lentas
  
      img.onload = () => {
        clearTimeout(timer);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Não foi possível criar contexto 2d'));
              return;
            }
      
            // Resolução Dinâmica baseada no Aspect Ratio
            // Feed: 1080x1080 | Story: 1080x1920
            const width = 1080;
            const height = options.aspectRatio === 'story' ? 1920 : 1080;
            canvas.width = width;
            canvas.height = height;
      
            // 1. Aplicar Filtros na Imagem de Fundo
            ctx.save(); // Salva o estado antes do filtro para não afetar o texto
            
            let filterString = 'none';
            switch (options.filter) {
                case 'bw': filterString = 'grayscale(100%)'; break;
                case 'sepia': filterString = 'sepia(80%)'; break;
                case 'darken': filterString = 'brightness(60%)'; break;
                case 'blur': filterString = 'blur(4px)'; break;
                case 'warm': filterString = 'sepia(30%) saturate(140%) hue-rotate(-10deg)'; break;
                case 'cool': filterString = 'saturate(80%) hue-rotate(20deg) contrast(110%)'; break;
            }
            ctx.filter = filterString;

            // Desenhar Imagem com Transformações (Canva-style)
            const baseScale = Math.max(width / img.width, height / img.height);
            const finalScale = baseScale * (options.bgScale ?? 1);
            
            // Centraliza o ponto de zoom e aplica o offset do usuário
            const offsetX = (options.bgX ?? 50) / 100;
            const offsetY = (options.bgY ?? 50) / 100;
            
            const drawW = img.width * finalScale;
            const drawH = img.height * finalScale;
            
            const dx = (width / 2) - (drawW * offsetX);
            const dy = (height / 2) - (drawH * offsetY);
            
            ctx.drawImage(img, dx, dy, drawW, drawH);
            
            ctx.restore(); // Restaura para remover o filtro do contexto (texto não deve ter blur/grayscale)
      
            // 2. Adicionar Overlay Escuro (Gradiente Controlável)
            const opacity = options.overlayOpacity ?? 0.4;
            const isDarkText = options.textColor === '#000000';
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            
            if (isDarkText) {
                // Overlay branco para texto preto
                gradient.addColorStop(0, `rgba(255, 255, 255, ${Math.max(0, opacity - 0.2)})`);
                gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${Math.min(1, opacity + 0.2)})`);
            } else {
                // Overlay preto para texto branco/dourado
                gradient.addColorStop(0, `rgba(0, 0, 0, ${Math.max(0, opacity - 0.3)})`); 
                gradient.addColorStop(0.4, `rgba(0, 0, 0, ${opacity})`); 
                gradient.addColorStop(1, `rgba(0, 0, 0, ${Math.min(1, opacity + 0.4)})`);   
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
      
            // 3. Configurar Tipografia
            ctx.textAlign = options.alignment || 'center';
            ctx.textBaseline = 'middle';
            
            // --- Texto do Versículo ---
            const baseFontSize = 56;
            const finalFontSize = baseFontSize * options.fontSizeScale;
            
            // Define o peso da fonte baseado na família escolhida
            let fontWeight = 'bold';
            if (options.fontFamily === 'Great Vibes') fontWeight = '400';
            if (options.fontFamily === 'Oswald') fontWeight = '700';
            if (options.fontFamily === 'Cinzel') fontWeight = '700';

            // Fallback para fontes padrão se o Google Fonts falhar
            const fontStack = `"${options.fontFamily}", "Lora", serif`;
            ctx.font = `${fontWeight} ${finalFontSize}px ${fontStack}`; 
            ctx.fillStyle = options.textColor;
            
            // Sombra suave para contraste (apenas se texto for claro)
            if (!isDarkText) {
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                ctx.shadowBlur = 25;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 4;
            }
      
            // Quebra de linha do texto (Wrap Text)
            const maxWidth = width * 0.80; 
            const words = text.split(' ');
            let line = '';
            const lines = [];
            // Ajusta entrelinha dependendo da fonte (cursivas precisam de mais espaço)
            const lineHeightMultiplier = options.fontFamily === 'Great Vibes' ? 1.8 : 1.5;
            const lineHeight = finalFontSize * lineHeightMultiplier;
      
            // Aspas de Abertura
            lines.push('“');
      
            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;
              if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
              } else {
                line = testLine;
              }
            }
            lines.push(line.trim());
            lines[lines.length-1] += '”';
      
            // Calcular Altura Total do Bloco de Texto
            const textBlockHeight = lines.length * lineHeight;

            // Calcular Posição Dinâmica (0 a 100%)
            const finalX = (options.textX ?? 50) / 100 * width;
            const finalY = (options.textY ?? options.verticalPosition ?? 50) / 100 * height;
            
            const startY = finalY - (textBlockHeight / 2);
            const textX = finalX;
      
            lines.forEach((l, i) => {
              ctx.fillText(l, textX, startY + (i * lineHeight));
            });
      
            // --- Referência Bíblica ---
            const refFontSize = 32 * options.fontSizeScale;
            // Referência sempre usa uma fonte legível (Inter/Oswald) para contraste com a artística
            const refFontStack = options.fontFamily === 'Cinzel' ? '"Cinzel", serif' : '"Inter", sans-serif';
            ctx.font = `900 ${refFontSize}px ${refFontStack}`; 
            ctx.fillStyle = '#c5a059'; // Bible Gold
            const refY = startY + textBlockHeight + 40;
            
            const refWidth = ctx.measureText(reference.toUpperCase()).width;
            
            let refX = textX;
            if (options.alignment === 'left') refX = 100;
            if (options.alignment === 'right') refX = width - 100;

            ctx.fillText(reference.toUpperCase(), refX, refY);
            
            // Linhas decorativas (apenas se centralizado)
            if (options.alignment === 'center') {
                ctx.strokeStyle = 'rgba(197, 160, 89, 0.6)'; 
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo((width / 2) - (refWidth / 2) - 50, refY);
                ctx.lineTo((width / 2) - (refWidth / 2) - 15, refY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo((width / 2) + (refWidth / 2) + 15, refY);
                ctx.lineTo((width / 2) + (refWidth / 2) + 50, refY);
                ctx.stroke();
            }
      
            // --- Rodapé (Branding) ---
            ctx.shadowBlur = 0; 
            ctx.shadowOffsetY = 0;
            ctx.font = '500 24px "Inter", sans-serif';
            ctx.fillStyle = isDarkText ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center'; 
            ctx.fillText("BíbliaLM App", width / 2, height - 60);
      
            resolve(canvas.toDataURL('image/webp', 0.85));
        } catch (e) {
            reject(e);
        }
      };
  
      img.onerror = (err) => {
          console.error("Erro ao carregar imagem no compositor:", base64Image.substring(0, 100) + "...", err);
          clearTimeout(timer);
          reject(new Error("Falha ao carregar a imagem base para composição."));
      };

      img.src = finalSrc;
    });
  };
