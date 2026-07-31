import { Post, PostVisibility } from '../types';
import { dbService } from './supabase';

export type KingdomDestination = 'global' | 'church' | 'cell';

export interface KingdomPublisher {
  userId: string;
  displayName?: string | null;
  username?: string | null;
  photoURL?: string | null;
}

export interface KingdomAudience {
  destination?: KingdomDestination;
  visibility?: PostVisibility;
  churchId?: string | null;
  cellId?: string | null;
  alsoShowOnChurch?: boolean;
}

export interface PublishKingdomPostInput {
  publisher: KingdomPublisher;
  type: Post['type'];
  content: string;
  audience?: KingdomAudience;
  imageUrl?: string | null;
  mood?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  dedupeKey?: string | null;
  metadata?: Record<string, unknown>;
  serviceId?: string | null;
  serviceTitle?: string | null;
}

const resolveAudience = (audience: KingdomAudience = {}) => {
  const destination = audience.destination ?? 'global';
  const visibility = audience.visibility
    ?? (destination === 'church' ? 'church' : destination === 'cell' ? 'group' : 'public');

  if (visibility === 'church' && !audience.churchId) {
    throw new Error('Selecione uma igreja antes de publicar para a igreja.');
  }
  if (visibility === 'group' && !audience.cellId) {
    throw new Error('Selecione um grupo antes de publicar para o grupo.');
  }

  return { destination, visibility };
};

export const kingdomPublishingService = {
  publish: async (input: PublishKingdomPostInput): Promise<Post> => {
    const content = input.content.trim();
    if (!input.publisher.userId) throw new Error('Entre na sua conta para publicar.');
    if (!content && !input.imageUrl) throw new Error('Adicione um conteúdo antes de publicar.');

    const { destination, visibility } = resolveAudience(input.audience);

    return dbService.createPost({
      userId: input.publisher.userId,
      userDisplayName: input.publisher.displayName,
      userUsername: input.publisher.username,
      userPhotoURL: input.publisher.photoURL,
      type: input.type,
      content,
      imageUrl: input.imageUrl,
      mood: input.mood,
      destination,
      visibility,
      churchId: input.audience?.churchId ?? null,
      cellId: input.audience?.cellId ?? null,
      alsoShowOnChurch: input.audience?.alsoShowOnChurch ?? false,
      serviceId: input.serviceId ?? null,
      serviceTitle: input.serviceTitle ?? null,
      sourceType: input.sourceType ?? input.type,
      sourceId: input.sourceId ?? null,
      dedupeKey: input.dedupeKey ?? null,
      metadata: input.metadata ?? {},
    });
  },

  publishQuizResult: async ({
    publisher,
    topic,
    score,
    xp,
    message,
  }: {
    publisher: KingdomPublisher;
    topic: string;
    score: number;
    xp: number;
    message?: string;
  }): Promise<Post> => kingdomPublishingService.publish({
    publisher,
    type: 'quiz',
    content: message?.trim() || `Concluí o desafio “${topic}” com ${score} ponto(s) e ganhei ${xp} de Maná.`,
    sourceType: 'quiz_result',
    sourceId: topic,
    dedupeKey: `quiz:${topic}:${score}:${xp}:${new Date().toISOString().slice(0, 10)}`,
    metadata: { topic, score, xp },
  }),
};
