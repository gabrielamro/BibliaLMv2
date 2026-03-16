"use client";
import { useNavigate } from '../utils/router';


import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { GuidedPrayer } from '../types';
import { generateSpecificPrayer } from '../services/geminiService';
import { 
  HandHeart, Sparkles, Heart, Mic2, Loader2, 
  Search, Church, Plus, Copy, Globe, Volume2, StopCircle
} from 'lucide-react';
import SEO from '../components/SEO';
import StandardCard from '../components/ui/StandardCard';
import useAudioNarration from '../hooks/useAudioNarration';
import SmartText from '../components/reader/SmartText';
import { STATIC_PRAYERS } from '../constants'; // Importando orações estáticas

const PRAYER_CATEGORIES = [
    { id: 'morning', label: 'Manhã', icon: '☀️' },
    { id: 'night', label: 'Noite', icon: '🌙' },
    { id: 'anxiety', label: 'Ansiedade', icon: '😰' },
    { id: 'gratitude', label: 'Gratidão', icon: '🙏' },
    { id: 'family', label: 'Família', icon: '👨‍👩‍👧' },
    { id: 'warfare', label: 'Batalha', icon: '⚔️' }
];

const GuidedPrayersPage: React.FC = () => {
    const { currentUser, userProfile, checkFeatureAccess, openSubscription } = useAuth();
    const { setTitle, setIcon, resetHeader } = useHeader();
    const [prayers, setPrayers] = useState<GuidedPrayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState<string>('all');
    
    useEffect(() => {
        setTitle('Orações Guiadas');
        setIcon(<HandHeart size={20} />);
        return () => resetHeader();
    }, [setTitle, setIcon, resetHeader]);
    
    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPrayer, setGeneratedPrayer] = useState<{title: string, content: string} | null>(null);

    const [playingPrayerId, setPlayingPrayerId] = useState<string | null>(null);
    const { isPlaying, togglePlayPause, stopAudio } = useAudioNarration(
        playingPrayerId 
            ? (prayers.find(p => p.id === playingPrayerId)?.content || generatedPrayer?.content || '') 
            : ''
    );

    useEffect(() => {
        loadPrayers();
    }, [currentUser]);

    const loadPrayers = async () => {
        setLoading(true);
        try {
            const churchId = userProfile?.churchData?.churchId;
            const dbPrayers = await dbService.getGuidedPrayers(churchId);
            
            // Mescla as orações estáticas com as do banco de dados para garantir conteúdo sempre
            // Usamos um Map para remover duplicatas por ID se houver colisão (raro com Firestore IDs)
            const combinedPrayers = [...STATIC_PRAYERS, ...dbPrayers];
            // Remove duplicatas baseadas no ID (caso STATIC_PRAYERS sejam salvas no banco futuramente)
            const uniquePrayers = Array.from(new Map(combinedPrayers.map(item => [item.id, item])).values());
            
            setPrayers(uniquePrayers);
        } catch (e) { 
            console.error(e);
            // Fallback para estáticas se der erro
            setPrayers(STATIC_PRAYERS);
        } finally { 
            setLoading(false); 
        }
    };

    const handleGenerate = async () => {
        if (!aiTopic.trim()) return;
        if (currentUser && !checkFeatureAccess('aiChatAccess')) {
            openSubscription();
            return;
        }

        setIsGenerating(true);
        try {
            // Gera a oração
            const result = await generateSpecificPrayer(aiTopic, "Reverente e Esperançoso");
            setGeneratedPrayer(result);

            // AUTO-SAVE: Salva no banco para criar a "massa" de orações
            // Salva como template do sistema (ou do usuário se quisermos tracking, aqui usamos system-ai para ser global)
            if (result && result.content) {
                const newPrayerData = {
                    title: result.title,
                    content: result.content,
                    category: determineCategory(aiTopic), // Tenta inferir categoria simples
                    authorId: 'system-ai', // Marca como gerada por IA para o sistema
                    authorName: 'Obreiro IA',
                    isTemplate: true,
                    createdAt: new Date().toISOString()
                };
                
                await dbService.createGuidedPrayer(newPrayerData);
                // Recarrega para incluir a nova (opcional, ou apenas adiciona ao state local)
                // setPrayers(prev => [newPrayerData as any, ...prev]);
            }

        } catch(e) { console.error(e); }
        finally { setIsGenerating(false); }
    };
    
    // Função auxiliar simples para categorizar baseado no texto
    const determineCategory = (text: string): string => {
        const lower = text.toLowerCase();
        if (lower.includes('manhã') || lower.includes('dia') || lower.includes('acordar')) return 'morning';
        if (lower.includes('noite') || lower.includes('dormir') || lower.includes('sono')) return 'night';
        if (lower.includes('ansiedade') || lower.includes('medo') || lower.includes('preocupação')) return 'anxiety';
        if (lower.includes('família') || lower.includes('filhos') || lower.includes('casamento')) return 'family';
        if (lower.includes('guerra') || lower.includes('batalha') || lower.includes('inimigo')) return 'warfare';
        if (lower.includes('obrigado') || lower.includes('gratidão') || lower.includes('agradecer')) return 'gratitude';
        return 'general';
    };
    
    const handlePlayAudio = (prayerId: string) => {
        if (playingPrayerId === prayerId && isPlaying) {
            togglePlayPause();
        } else {
            if (playingPrayerId) stopAudio(true);
            setPlayingPrayerId(prayerId);
            setTimeout(() => togglePlayPause(), 100);
        }
    };

    const filteredPrayers = activeCat === 'all' 
        ? prayers 
        : prayers.filter(p => p.category === activeCat);

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
            <SEO title="Orações Guiadas" />
            <div className="max-w-6xl mx-auto space-y-8 pb-24">
                
                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2.5rem] shadow-sm border border-purple-100 dark:border-purple-900/30">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Sparkles size={20}/> Gerar Oração Personalizada
                    </h2>
                    
                    {!generatedPrayer ? (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={aiTopic}
                                onChange={e => setAiTopic(e.target.value)}
                                placeholder="Pelo que você quer orar? (Ex: Entrevista de emprego)"
                                className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-purple-500/50"
                            />
                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating || !aiTopic}
                                className="bg-purple-600 text-white px-6 rounded-2xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="animate-spin"/> : <Plus />}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-[#f8f4ff] dark:bg-purple-900/10 p-6 rounded-3xl border border-purple-100 dark:border-purple-800 animate-in fade-in">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-serif font-bold text-2xl text-purple-900 dark:text-purple-100">{generatedPrayer.title}</h3>
                                <button onClick={() => handlePlayAudio('generated')} className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                                    {isPlaying && playingPrayerId === 'generated' ? <StopCircle size={20}/> : <Volume2 size={20}/>}
                                </button>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 italic mb-6 leading-relaxed whitespace-pre-wrap text-lg font-serif">
                                "<SmartText text={generatedPrayer.content} enabled={true} />"
                            </p>
                            <div className="flex gap-4 items-center">
                                <button onClick={() => { setGeneratedPrayer(null); setAiTopic(''); stopAudio(true); }} className="text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors">Nova Oração</button>
                                <button onClick={() => navigator.clipboard.writeText(generatedPrayer.content)} className="text-sm font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700 transition-colors"><Copy size={16}/> Copiar</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    <button onClick={() => setActiveCat('all')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeCat === 'all' ? 'bg-bible-gold text-white shadow-md' : 'bg-white dark:bg-bible-darkPaper text-gray-500'}`}>Tudo</button>
                    {PRAYER_CATEGORIES.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setActiveCat(cat.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${activeCat === cat.id ? 'bg-bible-gold text-white shadow-md' : 'bg-white dark:bg-bible-darkPaper text-gray-500'}`}
                        >
                            <span>{cat.icon}</span> {cat.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-bible-gold" size={40}/></div>
                ) : filteredPrayers.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">Nenhuma oração encontrada nesta categoria.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPrayers.map(prayer => (
                             <div key={prayer.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all group">
                                 <div className="flex justify-between items-start mb-3">
                                     <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">{prayer.title}</h3>
                                     <div className="flex gap-2">
                                         <button onClick={(e) => { e.stopPropagation(); handlePlayAudio(prayer.id); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 hover:text-bible-gold transition-colors">
                                             {isPlaying && playingPrayerId === prayer.id ? <StopCircle size={16}/> : <Volume2 size={16}/>}
                                         </button>
                                         <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400">
                                             {prayer.churchId ? <Church size={16}/> : <Globe size={16}/>}
                                         </div>
                                     </div>
                                 </div>
                                 <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 italic">
                                     "<SmartText text={prayer.content} enabled={true} />"
                                 </p>
                                 <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                                     <span>{prayer.authorName}</span>
                                     <button className="text-bible-gold hover:underline" onClick={() => { setGeneratedPrayer({ title: prayer.title, content: prayer.content }); window.scrollTo(0,0); }}>Ler Completa</button>
                                 </div>
                             </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default GuidedPrayersPage;
