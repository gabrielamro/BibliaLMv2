import type { ChatMessage } from '../types';
import { supabase } from './supabase';

export const sendMessageToAiChat = async (
  history: ChatMessage[],
  onChunk: (text: string) => void,
  context?: string,
) => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('Entre na sua conta para usar o Obreiro IA.');

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages: history, context }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || 'Não foi possível consultar o Obreiro IA.');

  const text = String(payload?.text ?? '');
  if (!text) throw new Error('A IA retornou uma resposta vazia.');
  onChunk(text);
};
