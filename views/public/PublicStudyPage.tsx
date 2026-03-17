"use client";
import { useNavigate, useParams } from '../../utils/router';


import React, { useEffect, useState } from 'react';

import Link from "next/link";
import { dbService } from '../../services/supabase';
import { SavedStudy } from '../../types';
import { Loader2, Brain, Quote, Sparkles, User, MessageSquareHeart, Crown, Zap, ArrowRight } from 'lucide-react';
import SEO from '../../components/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import StandardHeader from '../../components/ui/StandardHeader';
import SmartText from '../../components/reader/SmartText';

const PublicStudyPage: React.FC = () => {
    const { studyId } = useParams<{ studyId: string }>();
    const navigate = useNavigate();
    const { userProfile, openLogin } = useAuth();
    const { setTitle, setBreadcrumbs, resetHeader } = useHeader();
    const [study, setStudy] = useState<SavedStudy | null>(null);
    const [loading, setLoading] = useState(true);

    // --- HEADER MANAGEMENT ---
    useEffect(() => {
        if (study) {
            setTitle(study.title);
            setBreadcrumbs([
                { label: 'Comunidade', path: '/social' },
                { label: study.title }
            ]);
        }
        return () => resetHeader();
    }, [study, setTitle, setBreadcrumbs, resetHeader]);

    useEffect(() => {
        const load = async () => {
            if (!studyId) return;
            try {
                const data = await dbService.getPublicStudy(studyId);
                setStudy(data);
                // Telemetria
                dbService.incrementMetric('public_studies', studyId, 'views').catch(console.error);
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        load();
    }, [studyId]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-bible-gold" size={48} /></div>;
    if (!study) return <div>Estudo não encontrado</div>;

    const isHtmlContent = /<\/?[a-z][\s\S]*>/i.test(study.analysis);

    return (
        <div className="h-full bg-white dark:bg-bible-darkPaper flex flex-col selection:bg-bible-gold selection:text-black overflow-y-auto">
            <SEO title={study.title} description={study.analysis.substring(0, 160)} />

            <StandardHeader 
                title={study.title}
                subtitle={study.sourceText}
                authorName={study.userName}
                authorPhoto={study.userPhoto}
                coverUrl={study.coverUrl}
                badges={[{ label: 'Estudo Público', icon: <Sparkles size={14} /> }]}
                hideTitle={true}
                hideNav={true}
                hideBackButton={true}
                actions={
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => {
                                const url = window.location.href;
                                if(navigator.share) navigator.share({title: study.title, url});
                                else { navigator.clipboard.writeText(url); }
                                dbService.incrementMetric('public_studies', studyId!, 'shares');
                            }}
                            className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                        >
                            <ArrowRight size={18} className="-rotate-45" />
                        </button>
                        <button onClick={() => navigate('/login')} className="px-4 py-2 bg-bible-gold text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-all">
                            Criar Conta
                        </button>
                    </div>
                }
            />

            <main className="max-w-4xl mx-auto w-full px-6 py-12 space-y-16">
                
                {(!isHtmlContent && study.sourceText) && (
                    <section className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <h2 className="text-[11px] font-black text-bible-gold uppercase tracking-[0.3em]">O Alicerce Bíblico</h2>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-10 md:p-16 rounded-[3rem] text-center relative border border-gray-100 dark:border-gray-800 shadow-inner group">
                            <Quote className="absolute top-8 left-8 text-bible-gold/10" size={80} />
                            <div className="text-xl md:text-3xl font-serif italic text-gray-700 dark:text-gray-300 leading-relaxed mb-6 relative z-10">
                                <SmartText text={study.sourceText.split(':')[1]?.trim() || study.sourceText} enabled={true} />
                            </div>
                            <div className="inline-block px-6 py-2 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-full shadow-lg">
                                {study.sourceText.split(':')[0] || 'Escrituras Sagradas'}
                            </div>
                        </div>
                    </section>
                )}

                <section className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-[1rem] border border-purple-100 dark:border-purple-800"><Brain size={24} /></div>
                        <h2 className="text-2xl md:text-3xl font-serif font-black text-gray-900 dark:text-white">Exposição Teológica</h2>
                    </div>

                    <div className="prose dark:prose-invert prose-lg max-w-none font-sans text-gray-700 dark:text-gray-300 leading-relaxed">
                        {isHtmlContent ? (
                            <div dangerouslySetInnerHTML={{ __html: study.analysis }} className="editor-content" />
                        ) : (
                            <div className="whitespace-pre-wrap text-justify space-y-6">
                                {study.analysis.split('\n').map((line, i) => {
                                    if (line.startsWith('###')) return <h3 key={i} className="text-xl md:text-2xl font-serif font-bold mt-12 mb-6 text-bible-leather dark:text-bible-gold border-l-4 border-bible-gold pl-6">{line.replace('###', '')}</h3>;
                                    if (line.trim() === '') return null;
                                    return <p key={i} className="mb-4"><SmartText text={line} enabled={true} /></p>;
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {study.userThoughts && (
                    <section className="bg-amber-50 dark:bg-yellow-900/10 p-10 md:p-14 rounded-[2.5rem] border-l-[8px] border-bible-gold shadow-sm relative overflow-hidden">
                        <h3 className="font-serif font-bold text-xl text-bible-leather dark:text-bible-gold mb-4 flex items-center gap-3">
                            <MessageSquareHeart size={24} /> Insight Pessoal
                        </h3>
                        <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed italic relative z-10">
                            "<SmartText text={study.userThoughts} enabled={true} />"
                        </p>
                    </section>
                )}

                <section className="pt-12">
                    <div className="bg-gradient-to-br from-bible-leather to-[#2c1d1a] dark:from-bible-darkPaper dark:to-black rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl border border-white/5">
                        <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 pointer-events-none"><Crown size={200} /></div>
                        <div className="relative z-10 max-w-xl mx-auto space-y-8">
                            <div className="w-20 h-20 bg-bible-gold text-bible-leather rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
                                <Zap size={40} fill="currentColor" />
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight">Mergulhe mais fundo na Palavra</h2>
                                <p className="text-gray-400 text-lg leading-relaxed">Junte-se a nós no BíbliaLM. Utilize Inteligência Artificial para enriquecer sua jornada espiritual.</p>
                            </div>
                            <button onClick={() => navigate('/login')} className="px-10 py-4 bg-bible-gold text-bible-leather font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto">
                                Começar Grátis <ArrowRight size={18}/>
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default PublicStudyPage;
