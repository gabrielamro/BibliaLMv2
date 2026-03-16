
/**
 * Utilitários para sistema de compartilhamento Otimizado.
 * Prioriza links curtos (/p/ID) para conteúdo persistente.
 */

export type SharedContentType = 'verse' | 'devotional' | 'study' | 'podcast' | 'post';

interface ShareData {
  type: SharedContentType;
  params: Record<string, any>;
}

const DOMAIN = 'https://biblialm.com.br';

/**
 * Gera uma URL de compartilhamento.
 * - Se for um POST existente, gera link curto direto: domain.com/p/{id}
 * - Se for conteúdo efêmero (versículo, gerador), usa token base64.
 */
export const generateShareLink = (type: SharedContentType, params: Record<string, any>): string => {
  // OTIMIZAÇÃO: Links Curtos para Recursos Persistentes
  if (type === 'post' && params.postId) {
      return `${DOMAIN}/p/${params.postId}`;
  }

  // Fallback para Deep Links (Conteúdo Efêmero/Gerado na hora)
  const data: ShareData = { type, params };
  const jsonStr = JSON.stringify(data);
  
  // Codificação base64 segura para URL
  const token = btoa(unescape(encodeURIComponent(jsonStr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    
  return `${DOMAIN}/s/${token}`;
};

/**
 * Decodifica o token da URL
 */
export const decodeShareToken = (token: string): ShareData | null => {
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Falha ao decodificar token", e);
    return null;
  }
};
