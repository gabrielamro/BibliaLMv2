import { dbService } from './supabase';
import { Post, PostReportReason } from '../types';

export const postInteractionService = {
  async setLiked(post: Post, userId: string, liked: boolean): Promise<Post> {
    const result = await dbService.togglePostLike(post.id, userId, liked);
    return { ...post, likedBy: result.likedBy, likesCount: result.likesCount, likes: result.likesCount };
  },

  async setSaved(post: Post, saved: boolean): Promise<Post> {
    const persisted = await dbService.setPostSaved(post.id, saved);
    return { ...post, saved: persisted };
  },

  async hide(postId: string, userId: string): Promise<void> {
    await dbService.hidePost(postId, userId);
  },

  async report(postId: string, userId: string, reason: PostReportReason, details?: string): Promise<void> {
    await dbService.reportPost(postId, userId, reason, details);
  },
};
