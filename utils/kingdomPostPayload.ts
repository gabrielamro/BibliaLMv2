type KingdomPostInput = {
  userId: string;
  userDisplayName?: string | null;
  userUsername?: string | null;
  userPhotoURL?: string | null;
  content?: string | null;
  type?: string | null;
  destination?: string | null;
  churchId?: string | null;
  cellId?: string | null;
  image?: string | null;
  imageUrl?: string | null;
};

const stripUndefined = <T extends Record<string, unknown>>(payload: T): T =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as T;

export const buildPostInsertPayloads = (data: KingdomPostInput, createdAt = new Date().toISOString()) => {
  const basePayload = {
    user_id: data.userId,
    content: data.content ?? '',
    type: data.type ?? 'reflection',
    image_url: data.imageUrl || data.image || null,
    likes_count: 0,
    comments_count: 0,
    church_id: data.churchId ?? null,
    created_at: createdAt,
  };

  const fullPayload = stripUndefined({
    ...basePayload,
    user_display_name: data.userDisplayName ?? null,
    user_username: data.userUsername ?? null,
    user_photo_url: data.userPhotoURL ?? null,
    destination: data.destination ?? 'global',
    cell_id: data.cellId ?? null,
    shares_count: 0,
    liked_by: [],
  });

  const legacyPayload = stripUndefined(basePayload);

  return [fullPayload, legacyPayload];
};

export const dropPostInsertColumn = <T extends Record<string, unknown>>(payload: T, column: string): T => {
  const next = { ...payload };
  delete next[column];
  return next;
};
