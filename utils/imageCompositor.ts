import { getResponsiveTextLayout } from '../app/criar-arte-sacra/editorLayout';

/**
 * Opcoes de customizacao para a composicao da imagem.
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
  shadowColor?: string; // Cor da sombra customizavel
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    if (ctx.measureText(word).width > maxWidth) {
      if (line) {
        lines.push(line);
        line = '';
      }
      let chunk = '';
      for (const char of word) {
        const nextChunk = `${chunk}${char}`;
        if (ctx.measureText(nextChunk).width > maxWidth && chunk) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk = nextChunk;
        }
      }
      line = chunk;
      return;
    }

    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) lines.push(line);
  return lines;
};

interface FitTextLinesInput {
  text: string;
  maxWidth: number;
  maxHeight: number;
  initialFontSize: number;
  minFontSize: number;
  lineHeightMultiplier: number;
  applyFontSize: (fontSize: number) => void;
}

export const fitTextLinesToBox = (
  ctx: CanvasRenderingContext2D,
  {
    text,
    maxWidth,
    maxHeight,
    initialFontSize,
    minFontSize,
    lineHeightMultiplier,
    applyFontSize,
  }: FitTextLinesInput
) => {
  let fontSize = initialFontSize;
  let lines: string[] = [];
  let lineHeight = fontSize * lineHeightMultiplier;
  let blockHeight = 0;

  while (fontSize >= minFontSize) {
    applyFontSize(fontSize);
    lines = wrapCanvasText(ctx, text, maxWidth);
    lineHeight = fontSize * lineHeightMultiplier;
    blockHeight = lines.length * lineHeight;

    if (blockHeight <= maxHeight && lines.every((line) => ctx.measureText(line).width <= maxWidth)) {
      break;
    }

    fontSize -= 2;
  }

  fontSize = Math.max(fontSize, minFontSize);
  applyFontSize(fontSize);
  lines = wrapCanvasText(ctx, text, maxWidth);
  lineHeight = fontSize * lineHeightMultiplier;
  blockHeight = lines.length * lineHeight;
  return { lines, fontSize, lineHeight, blockHeight };
};

/**
 * Compoe uma imagem final com texto biblico, referencia e marca d'agua.
 * Combina a arte de fundo (IA) com tipografia legivel e customizavel.
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
      
      // So aplica crossOrigin para URLs externas para evitar problemas com Data URLs
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
              reject(new Error('Nao foi possivel criar contexto 2d'));
              return;
            }
      
            // Resolucao dinamica baseada no Aspect Ratio
            // Feed: 1080x1080 | Story: 1080x1920
            const width = 1080;
            const height = options.aspectRatio === 'story' ? 1920 : 1080;
            canvas.width = width;
            canvas.height = height;
      
            // 1. Aplicar Filtros na Imagem de Fundo
            ctx.save(); // Salva o estado antes do filtro para nao afetar o texto
            
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

            // Desenhar imagem com transformacoes (Canva-style)
            const baseScale = Math.max(width / img.width, height / img.height);
            const finalScale = baseScale * (options.bgScale ?? 1);
            
            // Centraliza o ponto de zoom e aplica o offset do usuario
            const drawW = img.width * finalScale;
            const drawH = img.height * finalScale;
            
            const dx = (width * (options.bgX ?? 50) / 100) - (drawW / 2);
            const dy = (height * (options.bgY ?? 50) / 100) - (drawH / 2);
            
            ctx.drawImage(img, dx, dy, drawW, drawH);
            
            ctx.restore(); // Restaura para remover o filtro do contexto (texto nao deve ter blur/grayscale)
      
            // 2. Adicionar overlay escuro (gradiente controlavel)
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
            
            // --- Texto do versiculo ---
            // Mantem o arquivo exportado sincronizado com a escala da previa Konva.
            const textLayout = getResponsiveTextLayout({
              aspectRatio: options.aspectRatio ?? 'feed',
              containerWidth: width,
              containerHeight: height,
              fontSizeScale: options.fontSizeScale,
            });
            const finalFontSize = textLayout.verseFontSizePx;
            
            // Define o peso da fonte baseado na familia escolhida
            let fontWeight = 'bold';
            if (options.fontFamily === 'Great Vibes') fontWeight = '400';
            if (options.fontFamily === 'Oswald') fontWeight = '700';
            if (options.fontFamily === 'Cinzel') fontWeight = '700';

            // Fallback para fontes padrao se o Google Fonts falhar
            const fontStack = `"${options.fontFamily}", "Lora", serif`;
            ctx.fillStyle = options.textColor;
            
            // Sombra suave para contraste (apenas se texto for claro)
            if (!isDarkText) {
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                ctx.shadowBlur = 25;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 4;
            }
      
            // Quebra de linha do texto (Wrap Text)
            const maxWidth = width * (textLayout.contentWidthPercent / 100);
            // Ajusta entrelinha dependendo da fonte, mantendo o padrao do editor.
            const lineHeightMultiplier = options.fontFamily === 'Great Vibes' ? 1.42 : textLayout.verseLineHeight;
            const maxTextBlockHeight = height * (textLayout.maxTextBlockHeightPercent / 100);
            const fittedText = fitTextLinesToBox(ctx, {
              text: `"${text}"`,
              maxWidth,
              maxHeight: maxTextBlockHeight,
              initialFontSize: finalFontSize,
              minFontSize: 12,
              lineHeightMultiplier,
              applyFontSize: (fontSize) => {
                ctx.font = `${fontWeight} ${fontSize}px ${fontStack}`;
              },
            });
            const { lines, lineHeight } = fittedText;
      
      
            // Calcular Altura Total do Bloco de Texto
            const textBlockHeight = fittedText.blockHeight;

            // Calcular posicao dinamica (0 a 100%)
            const finalX = (options.textX ?? 50) / 100 * width;
            const finalY = (options.textY ?? options.verticalPosition ?? 50) / 100 * height;
            
            const startY = finalY - (textBlockHeight / 2);
            const textX = finalX;
      
            lines.forEach((l, i) => {
              ctx.fillText(l, textX, startY + (i * lineHeight) + (lineHeight / 2));
            });
      
            // --- Referencia biblica ---
            const refFontSize = clamp(fittedText.fontSize * 0.42, 18, 42);
            // Referencia usa fonte legivel para contrastar com a fonte artistica.
            const refFontStack = options.fontFamily === 'Cinzel' ? '"Cinzel", serif' : '"Inter", sans-serif';
            ctx.font = `900 ${refFontSize}px ${refFontStack}`; 
            ctx.fillStyle = '#c5a059'; // Bible Gold
            const refY = startY + textBlockHeight + Math.max(18, fittedText.fontSize * 0.55);
            
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
      
            // --- Rodape (branding) ---
            ctx.shadowBlur = 0; 
            ctx.shadowOffsetY = 0;
            ctx.font = '500 24px "Inter", sans-serif';
            ctx.fillStyle = isDarkText ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center'; 
            ctx.fillText("Culto+", width / 2, height - 60);
      
            resolve(canvas.toDataURL('image/webp', 0.85));
        } catch (e) {
            reject(e);
        }
      };
  
      img.onerror = (err) => {
          console.error("Erro ao carregar imagem no compositor:", base64Image.substring(0, 100) + "...", err);
          clearTimeout(timer);
          reject(new Error("Falha ao carregar a imagem base para composicao."));
      };

      img.src = finalSrc;
    });
  };
