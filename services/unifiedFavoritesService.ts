import { supabase } from './supabase';
import type { FavoriteContentType, UserContentFavorite } from '../types';

/**
 * Adiciona um item aos Favoritos Unificados
 */
export async function addUnifiedFavorite(
  userId: string,
  contentType: FavoriteContentType,
  contentId: string,
  title: string,
  snapshot: {
    reference?: string;
    textSnippet?: string;
    originUrl?: string;
    authorName?: string;
    metadata?: Record<string, any>;
  },
): Promise<UserContentFavorite | null> {
  const payload = {
    user_id: userId,
    content_type: contentType,
    content_id: contentId,
    title,
    snapshot,
  };

  const { data, error } = await supabase
    .from('user_content_favorites')
    .upsert(payload, { onConflict: 'user_id,content_type,content_id' })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao adicionar favorito unificado:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    contentType: data.content_type as FavoriteContentType,
    contentId: data.content_id,
    title: data.title,
    snapshot: data.snapshot,
    createdAt: data.created_at,
  };
}

/**
 * Remove um item dos Favoritos Unificados
 */
export async function removeUnifiedFavorite(
  userId: string,
  contentType: FavoriteContentType,
  contentId: string,
): Promise<boolean> {

  const { error } = await supabase
    .from('user_content_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  if (error) {
    console.error('Erro ao remover favorito unificado:', error);
    return false;
  }

  return true;
}

/**
 * Consulta todos os Favoritos Unificados do Usuário (incluindo posts salvos no Reino)
 */
export async function getUserUnifiedFavorites(
  userId: string,
  filterType?: FavoriteContentType | 'all',
): Promise<UserContentFavorite[]> {
  const results: UserContentFavorite[] = [];

  try {
    // 1. Favoritos da tabela user_content_favorites
    let query = supabase
      .from('user_content_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filterType && filterType !== 'all' && filterType !== 'post') {
      query = query.eq('content_type', filterType);
    }

    const { data: dbFavs } = await query;

    if (dbFavs) {
      dbFavs.forEach((item: any) => {
        results.push({
          id: item.id,
          userId: item.user_id,
          contentType: item.content_type as FavoriteContentType,
          contentId: item.content_id,
          title: item.title,
          snapshot: item.snapshot || {},
          createdAt: item.created_at,
        });
      });
    }

    // 2. Posts salvos no Reino (post_saves)
    if (!filterType || filterType === 'all' || filterType === 'post') {
      const { data: savedPosts } = await supabase
        .from('post_saves')
        .select('*, post:posts(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savedPosts) {
        savedPosts.forEach((save: any) => {
          results.push({
            id: `post-save-${save.id}`,
            userId: save.user_id,
            contentType: 'post',
            contentId: save.post_id,
            title: save.post?.title || 'Publicação do Reino',
            snapshot: {
              textSnippet: save.post?.content ? `${save.post.content.slice(0, 140)}...` : undefined,
              originUrl: `/p/${save.post_id}`,
              authorName: save.post?.author_name || 'Comunidade',
            },
            createdAt: save.created_at,
          });
        });
      }
    }
  } catch (error) {
    console.warn('Erro ao consultar favoritos unificados:', error);
  }

  // Ordenar combinação por data mais recente
  return results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
