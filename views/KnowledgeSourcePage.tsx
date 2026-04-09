"use client";
import { useNavigate } from '../utils/router';


import React from 'react';

import {
    ArrowLeft, Crown, BookOpen, Users, Mic2, Sparkles,
    Feather, Scroll, Layout, Zap, ChevronRight, GraduationCap,
    CheckCircle2
} from 'lucide-react';
import SEO from '../components/SEO';
import SmartText from '../components/reader/SmartText';
import { useAuth } from '../contexts/AuthContext';

const KnowledgeSourcePage: React.FC = () => {
    const navigate = useNavigate();
    const { openSubscription, userProfile } = useAuth();

    const isPastor = userProfile?.subscriptionTier === 'pastor';

    return (
        <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">
            <SEO title="Fonte de Conhecimento Pastoral" description="Recursos avançados para líderes e pastores." />

            {/* Hero Section */}
            <div className="relative h-[400px] bg-bible-leather dark:bg-black overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#121212] via-transparent to-transparent"></div>

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 bg-bible-gold/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-bible-gold/30">
                        <Crown size={32} className="text-bible-gold" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-4 drop-shadow-xl">
                        Liderança & <span className="text-bible-gold">Sabedoria</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl font-light leading-relaxed">
                        <SmartText text="Ferramentas de inteligência artificial desenhadas para auxiliar Pastores e Líderes na exegese bíblica, preparação de sermões e cuidado do rebanho." enabled={true} />
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20 pb-24 space-y-12">

                {/* Main Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Card 1: Púlpito */}
                    <div onClick={() => navigate('/workspace-pastoral')} className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 group cursor-pointer hover:border-bible-gold transition-all">
                        <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                            <Mic2 size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Púlpito Digital</h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            Crie esboços homiléticos estruturados com ajuda da IA. Do texto base à aplicação prática.
                        </p>
                        <span className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                            Acessar <ChevronRight size={14} />
                        </span>
                    </div>

                    {/* Card 2: Exegese */}
                    <div onClick={() => navigate('/criar-conteudo')} className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 group cursor-pointer hover:border-purple-500 transition-all">
                        <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                            <Scroll size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Exegese Profunda</h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            Análise teológica de versículos, contexto histórico e referências cruzadas instantâneas.
                        </p>
                        <span className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                            Estudar <ChevronRight size={14} />
                        </span>
                    </div>

                    {/* Card 3: Rebanho */}
                    <div onClick={() => navigate('/social/church')} className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 group cursor-pointer hover:border-blue-500 transition-all">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                            <Users size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Gestão de Rebanho</h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            Acompanhe o crescimento espiritual da sua igreja, crie células e gerencie pedidos de oração.
                        </p>
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            Gerenciar <ChevronRight size={14} />
                        </span>
                    </div>
                </div>

                {/* Feature Highlight Section */}
                <div className="bg-white dark:bg-bible-darkPaper rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 relative h-64 md:h-auto">
                        <img
                            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=1000"
                            alt="Pastor estudando"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-8">
                            <div className="text-white">
                                <p className="font-serif italic text-2xl mb-2">"O meu povo foi destruído, porque lhe faltou o conhecimento."</p>
                                <p className="text-bible-gold font-black uppercase text-xs tracking-widest">Oséias 4:6</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                            Capacitação para o <span className="text-bible-gold">Século 21</span>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                            <SmartText text="O Espírito Santo é a fonte, a tecnologia é o canal. Utilize o BíbliaLM para multiplicar seu tempo de preparo e focar no que realmente importa: as almas." enabled={true} />
                        </p>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-1 rounded-full bg-green-100 text-green-600"><CheckCircle2 size={12} /></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Jornadas de Discipulado Automatizadas</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-1 rounded-full bg-green-100 text-green-600"><CheckCircle2 size={12} /></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Visão Geral das Células</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-1 rounded-full bg-green-100 text-green-600"><CheckCircle2 size={12} /></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Artes Sacras para Redes Sociais</span>
                            </div>
                        </div>

                        {!isPastor && (
                            <button
                                onClick={openSubscription}
                                className="w-full py-4 bg-bible-gold text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Crown size={18} /> Ativar Plano Pastor
                            </button>
                        )}
                    </div>
                </div>

                {/* Interactive Concepts Gallery */}
                <div>
                    <h2 className="text-xl font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Conceitos Bíblicos Visuais</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { title: "A Criação", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba" },
                            { title: "O Sacrifício", img: "https://images.unsplash.com/photo-1555618721-ef7fa2021b6e" },
                            { title: "O Pentecostes", img: "https://images.unsplash.com/photo-1472521882609-bc9823df6498" },
                            { title: "A Redenção", img: "https://images.unsplash.com/photo-1507692049790-de58293a4690" }
                        ].map((item, idx) => (
                            <div key={idx} onClick={() => navigate('/?tab=criar')} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group">
                                <img src={`${item.img}?auto=format&fit=crop&q=80&w=400`} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-end p-4">
                                    <span className="text-white font-serif font-bold">{item.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center pt-8">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-bible-gold font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors">
                        <ArrowLeft size={14} /> Voltar ao Início
                    </button>
                </div>

            </div>
        </div>
    );
};

export default KnowledgeSourcePage;
