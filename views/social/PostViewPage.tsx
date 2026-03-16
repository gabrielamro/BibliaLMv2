"use client";
import { useNavigate, useParams } from '../../utils/router';


import React, { useEffect, useState } from 'react';

import Link from "next/link";
import { dbService } from '../../services/supabase';
import { Post } from '../../types';
import { Loader2, Heart, MessageCircle, Share2, Church, Repeat, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/SEO';
import SocialNavigation from '../../components/SocialNavigation';

const PostViewPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
        if (!postId) return;
        try {
            const postRef = await dbService.getGlobalFeed(100); 
            const found = postRef.find(p => p.id === postId);
            if (found) {
                setPost(found);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchPost();
  }, [postId]);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-bible-gold" /></div>;

  if (!post) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Postagem não encontrada</h2>
              <p className="text-gray-500 mb-6">Este conteúdo pode ter sido removido.</p>
              <button onClick={() => navigate('/')} className="bg-bible-gold text-white px-6 py-2 rounded-xl font-bold">Ir para o Feed</button>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black">
        <SEO title={`${post.userDisplayName} no BíbliaLM`} description={post.content.substring(0, 150)} image={post.imageUrl} />
        
        <div className="flex-1 overflow-y-auto flex flex-col items-center p-4 pb-20">
            <div className="w-full max-w-md bg-white dark:bg-bible-darkPaper rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 my-4">
                <div className="p-0">
                    <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100 dark:border-gray-700">
                            {post.userPhotoURL ? <img src={post.userPhotoURL} className="w-full h-full object-cover" alt={post.userDisplayName}/> : <Church className="p-2 w-full h-full text-gray-500 bg-gray-100"/>}
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{post.userDisplayName}</p>
                            
                            {post.isRepost && post.originalPost ? (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Repeat size={12} className="text-green-500" />
                                    <span>repost de <Link href={`/${post.originalPost.userUsername.replace('@', '')}`} className="font-bold text-green-600 hover:underline">{post.originalPost.userUsername.startsWith('@') ? post.originalPost.userUsername : `@${post.originalPost.userUsername}`}</Link></span>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">{post.userUsername.startsWith('@') ? post.userUsername : `@${post.userUsername}`}</p>
                            )}
                        </div>
                    </div>

                    {post.imageUrl && (
                        <div className="w-full aspect-[4/5] bg-gray-100 relative">
                            <img src={post.imageUrl} className="w-full h-full object-cover" alt="Post" />
                        </div>
                    )}

                    <div className="p-6">
                        <div className="flex gap-4 mb-4 text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1 text-xs font-bold"><Heart size={18} /> {post.likesCount}</span>
                            <span className="flex items-center gap-1 text-xs font-bold"><MessageCircle size={18} /> {post.commentsCount}</span>
                            <span className="flex items-center gap-1 text-xs font-bold"><Share2 size={18} /> {post.shares || 0}</span>
                        </div>
                        
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-serif">
                            {post.content}
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            {post.location && <span><MapPin size={12} className="inline mr-1"/>{post.location}</span>}
                        </div>
                    </div>
                </div>

                {!currentUser && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-xs text-gray-500 mb-3">Gostou? Junte-se à comunidade!</p>
                        <button onClick={() => navigate('/login')} className="w-full py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-xl shadow-lg">
                            Entrar no App
                        </button>
                    </div>
                )}
            </div>
        </div>
        <SocialNavigation activeTab="feed" />
    </div>
  );
};

export default PostViewPage;
