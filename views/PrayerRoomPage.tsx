"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { generateSuggestedPrayer } from '../services/pastorAgent';
import { PrayerRequest } from '../types';
import { 
  ArrowLeft, HandHeart, Send, Sparkles, Heart, 
  Loader2, Globe, Users, Church, Copy, Check
} from 'lucide-react';
import SEO from '../components/SEO';
import SocialNavigation from '../components/SocialNavigation';

const PrayerRoomPage: React.FC = () => {
  const { currentUser, userProfile, earnMana, showNotification } = useAuth();
  const { setTitle, setBreadcrumbs, resetHeader } = useHeader();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState<'global' | 'church' | 'cell'>('global');
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Prayer State
  const [newRequest, setNewRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // --- HEADER MANAGEMENT ---
  useEffect(() => {
      setTitle('Sala de Oração');
      setBreadcrumbs([
          { label: 'Comunidade', path: '/social' },
          { label: 'Sala de Oração' }
      ]);
      return () => resetHeader();
  }, [setTitle, setBreadcrumbs, resetHeader]);

  useEffect(() => {
      loadPrayers();
  }, [activeFilter, currentUser]);

  const loadPrayers = async () => {
      setLoading(true);
      try {
          let data: PrayerRequest[] = [];
          
          if (activeFilter === 'global') {
              // Fetch from dedicated prayer wall
              data = await dbService.getPrayerRequests('global', 'global_wall'); 
          } else if (activeFilter === 'church' && userProfile?.churchData?.churchId) {
               data = await dbService.getPrayerRequests('church', userProfile.churchData.churchId);
          } else if (activeFilter === 'cell' && userProfile?.churchData?.groupId) {
               data = await dbService.getPrayerRequests('cell', userProfile.churchData.groupId);
          }
          
          setPrayers(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleAiSuggest = async () => {
      if (!newRequest.trim()) return;
      setIsGeneratingAi(true);
      try {
          const suggestion = await generateSuggestedPrayer(newRequest);
          setAiSuggestion(suggestion);
      } catch (e) {
          showNotification("Erro ao gerar oração.", "error");
      } finally {
          setIsGeneratingAi(false);
      }
  };

  const handleSubmit = async () => {
      if (!currentUser || !newRequest.trim()) return;
      setIsSubmitting(true);
      try {
          const targetId = activeFilter === 'global' ? 'global_wall' : 
                           activeFilter === 'church' ? userProfile?.churchData?.churchId :
                           userProfile?.churchData?.groupId;
          
          if (!targetId) throw new Error("Destino inválido");

          await dbService.addPrayerRequest(activeFilter, targetId, {
              userId: currentUser.uid,
              userName: userProfile?.displayName,
              userPhotoURL: userProfile?.photoURL,
              content: newRequest,
              targetType: activeFilter,
              targetId: targetId,
              createdAt: new Date().toISOString(),
              intercessorsCount: 0,
              intercessors: []
          });
          
          setNewRequest('');
          setAiSuggestion(null);
          showNotification("Pedido enviado ao mural.", "success");
          loadPrayers();
      } catch (e) {
          showNotification("Erro ao enviar.", "error");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleIntercede = async (prayer: PrayerRequest) => {
      if (!currentUser) return;
      const isInterceding = prayer.intercessors?.includes(currentUser.uid);
      
      // Optimistic Update
      setPrayers(prev => prev.map(p => {
          if (p.id === prayer.id) {
              return {
                  ...p,
                  intercessorsCount: isInterceding ? p.intercessorsCount - 1 : p.intercessorsCount + 1,
                  intercessors: isInterceding ? p.intercessors.filter(u => u !== currentUser.uid) : [...p.intercessors, currentUser.uid]
              };
          }
          return p;
      }));

      try {
          await dbService.togglePrayerIntercession(prayer.id, currentUser.uid, !!isInterceding);
          if (!isInterceding) await earnMana('prayer_wall');
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto flex flex-col">
        <SEO title="Sala de Oração" />
        
        {/* Header (Removido para usar o global) */}
        <div className="bg-bible-leather dark:bg-black text-white p-8 pb-16 relative overflow-hidden shrink-0">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
             <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md text-bible-gold">
                     <HandHeart size={32} />
                 </div>
                 <p className="text-white/80 text-sm max-w-md">"Orai uns pelos outros, para que sareis." (Tiago 5:16)</p>
             </div>
        </div>

        <div className="flex-1 -mt-8 px-4 md:px-8 pb-24 max-w-4xl mx-auto w-full">
            
            {/* Input Box */}
            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 mb-8">
                <textarea 
                    value={newRequest}
                    onChange={e => setNewRequest(e.target.value)}
                    placeholder="Deixe seu pedido ou gratidão aqui..."
                    className="w-full bg-transparent outline-none text-gray-700 dark:text-gray-200 resize-none h-24 placeholder-gray-400"
                />
                
                {aiSuggestion && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles size={12}/> Sugestão Pastoral
                            </span>
                            <button onClick={() => { setNewRequest(aiSuggestion); setAiSuggestion(null); }} className="text-purple-600 hover:text-purple-800 text-xs font-bold flex items-center gap-1">
                                <Copy size={12}/> Usar
                            </button>
                        </div>
                        <p className="text-sm text-purple-800 dark:text-purple-200 italic">"{aiSuggestion}"</p>
                    </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={handleAiSuggest} 
                        disabled={!newRequest.trim() || isGeneratingAi}
                        className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGeneratingAi ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} Ajuda Pastoral
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!newRequest.trim() || isSubmitting}
                        className="bg-bible-gold text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Orar
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveFilter('global')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFilter === 'global' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
                    <Globe size={14}/> Global
                </button>
                {userProfile?.churchData?.churchId && (
                    <button onClick={() => setActiveFilter('church')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFilter === 'church' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
                        <Church size={14}/> Minha Igreja
                    </button>
                )}
                {userProfile?.churchData?.groupId && (
                    <button onClick={() => setActiveFilter('cell')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeFilter === 'cell' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
                        <Users size={14}/> Minha Célula
                    </button>
                )}
            </div>

            {/* Prayer List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-bible-gold" size={32}/></div>
            ) : prayers.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-sm">Nenhum pedido de oração neste mural.</p>
                    <p className="text-xs mt-1">Seja o primeiro a compartilhar.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {prayers.map(prayer => (
                        <div key={prayer.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    {prayer.userPhotoURL ? <img src={prayer.userPhotoURL} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xs">{prayer.userName?.substring(0,1)}</div>}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{prayer.userName}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(prayer.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                                {prayer.content}
                            </p>
                            <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-3">
                                <button 
                                    onClick={() => handleIntercede(prayer)}
                                    className={`flex items-center gap-2 text-xs font-bold transition-all ${prayer.intercessors?.includes(currentUser?.uid || '') ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                >
                                    <Heart size={16} fill={prayer.intercessors?.includes(currentUser?.uid || '') ? "currentColor" : "none"} />
                                    {prayer.intercessorsCount} Intercessores
                                </button>
                                <span className="text-[10px] font-black uppercase text-gray-300">
                                    {prayer.targetType === 'global' ? 'Mural Global' : 'Comunidade'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
        <SocialNavigation activeTab="feed" />
    </div>
  );
};

export default PrayerRoomPage;