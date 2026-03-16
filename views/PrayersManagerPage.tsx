"use client";
import { useNavigate, useSearchParams } from '../utils/router';


import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { GuidedPrayer } from '../types';
import {
    Plus, Edit2, Trash2, ArrowLeft, Loader2, Save,
    HandHeart, Globe, Church, Heart, Share2, Bot, User, ListFilter
} from 'lucide-react';
import { useHeader } from '../contexts/HeaderContext';
import { useSettings } from '../contexts/SettingsContext';
import SEO from '../components/SEO';
import ConfirmationModal from '../components/ConfirmationModal';

const PrayersManagerPage: React.FC = () => {
    const { currentUser, userProfile, showNotification } = useAuth();
    const { setTitle: setGlobalTitle, setBreadcrumbs, resetHeader } = useHeader();
    const { setIsFocusMode } = useSettings();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [currentPrayer, setCurrentPrayer] = useState<Partial<GuidedPrayer>>({
        title: '', content: '', category: 'general', isTemplate: true
    });

    useEffect(() => {
        setIsFocusMode(true);
        return () => {
            setIsFocusMode(false);
            resetHeader();
        };
    }, [setIsFocusMode, resetHeader]);

    useEffect(() => {
        const titleText = currentPrayer.title || 'Editor de Oração';
        setGlobalTitle(titleText);
        setBreadcrumbs([
            { label: 'Workspace', path: '/workspace-pastoral' },
            { label: titleText }
        ]);
    }, [currentPrayer.title, setGlobalTitle, setBreadcrumbs]);

    useEffect(() => {
        loadData();
    }, [currentUser, searchParams]);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await dbService.getPastorPrayers(currentUser.uid);
            const idToEdit = searchParams.get('id');

            if (idToEdit) {
                const prayer = data.find(p => p.id === idToEdit);
                if (prayer) {
                    setCurrentPrayer(prayer);
                }
            } else {
                setCurrentPrayer({ title: '', content: '', category: 'general', isTemplate: true });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!currentPrayer.title || !currentPrayer.content || !currentUser) return;

        try {
            const prayerData: any = {
                ...currentPrayer,
                authorId: currentUser.uid,
                authorName: userProfile?.displayName || 'Pastor',
                churchId: userProfile?.churchData?.churchId || null,
                generatedBy: currentPrayer.generatedBy || 'pastor', // Setar como pastor por padrão se não definido
                createdAt: new Date().toISOString()
            };

            // Remove o id e campos undefined do payload pro Firestore não quebrar
            delete prayerData.id;
            Object.keys(prayerData).forEach(key => prayerData[key] === undefined && delete prayerData[key]);

            if (currentPrayer.id) {
                await dbService.updateGuidedPrayer(currentPrayer.id, prayerData);
            } else {
                await dbService.createGuidedPrayer(prayerData);
            }

            showNotification("Oração salva com sucesso!", "success");
            navigate('/workspace-pastoral');
        } catch (e) {
            showNotification("Erro ao salvar oração.", "error");
        }
    };

    return (
        <div className="h-full bg-bible-paper dark:bg-black overflow-y-auto flex flex-col">
            <SEO title="Editor de Oração" />

            {/* HEADER NOVO PADRÃO */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-2 flex flex-col md:flex-row justify-between items-center shadow-sm gap-2 h-auto md:h-20 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-bible-gold transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Editor de Oração</span>
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] leading-tight">{currentPrayer.title || 'Nova Oração'}</h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleSave} className="px-5 py-2.5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl shadow-sm active:scale-95 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-105">
                        <Save size={16} /> Salvar Oração
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">

                <div className="space-y-4">
                    <input
                        type="text"
                        value={currentPrayer.title}
                        onChange={e => setCurrentPrayer({ ...currentPrayer, title: e.target.value })}
                        placeholder="Título da Oração"
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 font-bold"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <select
                            value={currentPrayer.category}
                            onChange={e => setCurrentPrayer({ ...currentPrayer, category: e.target.value as any })}
                            className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                        >
                            <option value="general">Geral</option>
                            <option value="morning">Manhã</option>
                            <option value="night">Noite</option>
                            <option value="anxiety">Ansiedade</option>
                            <option value="family">Família</option>
                            <option value="warfare">Batalha Espiritual</option>
                        </select>

                        <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                            <input
                                type="checkbox"
                                checked={currentPrayer.isTemplate}
                                onChange={e => setCurrentPrayer({ ...currentPrayer, isTemplate: e.target.checked })}
                                className="w-5 h-5 accent-bible-gold"
                            />
                            <label className="text-sm font-bold">Modelo (Template)</label>
                        </div>
                    </div>

                    <textarea
                        value={currentPrayer.content}
                        onChange={e => setCurrentPrayer({ ...currentPrayer, content: e.target.value })}
                        placeholder="Escreva o texto da oração..."
                        className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 resize-none font-serif text-lg leading-relaxed"
                    />

                    <div className="flex justify-end">
                        <button onClick={handleSave} className="px-8 py-3 bg-bible-gold text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:opacity-90">
                            <Save size={18} /> Salvar Oração
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrayersManagerPage;
