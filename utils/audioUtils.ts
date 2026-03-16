
// Auxiliares de áudio PCM e WAV

/**
 * Decodifica uma string base64 para um Uint8Array.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converte dados PCM brutos (do Gemini) para um Blob WAV com cabeçalho correto.
 * Isso resolve problemas de reprodução no Safari/iOS.
 */
export function pcmToWav(
  pcmData: Uint8Array, 
  sampleRate: number = 24000, 
  numChannels: number = 1
): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const dataSize = pcmData.length;

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  return new Blob([header, pcmData as any], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Decodifica Audio Buffer (mantido para compatibilidade com outros hooks se necessário)
 */
export async function decodeAudioData(
  base64Audio: string,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const data = decodeBase64(base64Audio);
  
  // Create WAV blob first to use browser's native decoder which is more robust
  const wavBlob = pcmToWav(data, sampleRate, numChannels);
  const arrayBuffer = await wavBlob.arrayBuffer();
  
  return await ctx.decodeAudioData(arrayBuffer);
}
