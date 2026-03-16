"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { generateThematicModule } from '../services/geminiService';
import { 
  Sparkles, Search, Plus, Play, Clock, 
  ChevronRight, Brain, Loader2, BookMarked,
  LayoutTemplate, Compass
} from 'lucide-react';
import SEO from '../components/SEO';
import { StudyModule } from '../types';

const SUGGESTED_THEMES = [
    { title: 'Superando a Ansiedade', icon: '🍃', desc: 'Encontre descanso na paz de Cristo.' },
    { title: 'Mordomia Financeira', icon: '💰', desc: 'Princípios bíblicos para lidar com o dinheiro.' },
    { title: 'O Poder da Oração', icon: '🙏', desc: 'Fortalecendo sua intimidade com o Pai.' },
    { title: 'Liderança Cristã', icon: '👑', desc: 'Servindo como Jesus serviu.' },
    { title: 'Amor no Casamento', icon: '💍', desc: 'Refletindo o amor de Deus na união.' },
    { title: 'Criação de Filhos', icon: '👪', desc: 'Educando no caminho em que deve andar.' },
];

const ThematicStudiesPage: React.FC = () => {
  const { currentUser, earnMana, showNotification } = useAuth();
  const navigate = useNavigate();

  const [activeModules, setActiveModules] = useState<StudyModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [customTheme, setCustomTheme] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
        if (!currentUser) return;
        try {
            const data = await dbService.getAll(currentUser.uid, 'study_modules');
            setActiveModules(data as StudyModule[]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    fetchModules();
  }, [currentUser]);

  const handleStartModule = async (theme: string) => {
    if (!currentUser) return;
    setIsCreating(true);
    try {
        const moduleStructure = await generateThematicModule(theme);
        
        if (moduleStructure && Array.isArray(moduleStructure.days) && moduleStructure.days.length > 0) {
            const newModule: Omit<StudyModule, 'id'> = {
                title: moduleStructure.title || `Estudo sobre ${theme}`,
                description: moduleStructure.description || 'Trilha de sabedoria gerada por IA',
                theme: theme,
                durationDays: moduleStructure.days.length,
                icon: moduleStructure.icon || '📖',
                days: moduleStructure.days,
                currentDay: 1,
                createdAt: new Date().toISOString(),
                status: 'in_progress'
            };
            const docRef = await dbService.add(currentUser.uid, 'study_modules', newModule);
            await earnMana('start_module');
            showNotification("Estudo temático iniciado!", "success");
            navigate(`/estudo/modulo/${docRef.id}`);
        } else {
            showNotification("Não foi possível gerar o roteiro. Tente novamente.", "error");
        }
    } catch (e) {
        console.error(e);
        showNotification("Erro ao criar estudo.", "error");
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
        <SEO title="Estudos Temáticos IA" />
        <div className="max-w-6xl mx-auto space-y-10 pb-24">
            
            {/* AI Generator Bar */}
            <div className="bg-white dark:bg-bible-darkPaper p-3 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex gap-2">
                <div className="flex-1 relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                    <input 
                        type="text" 
                        value={customTheme}
                        onChange={e => setCustomTheme(e.target.value)}
                        placeholder="Sobre o que você quer estudar hoje? (ex: Paciência)" 
                        className="w-full pl-12 p-4 bg-transparent outline-none font-bold text-sm" 
                    />
                </div>
                <button 
                    onClick={() => handleStartModule(customTheme)}
                    disabled={!customTheme.trim() || isCreating}
                    className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-8 py-4 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isCreating ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>} Criar Estudo
                </button>
            </div>

            {/* Active Modules */}
            {activeModules.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                        <Clock size={12} /> Meus Estudos em Andamento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeModules.map(mod => (
                            <div key={mod.id} onClick={() => navigate(`/estudo/modulo/${mod.id}`)} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border-2 border-transparent hover:border-bible-gold transition-all cursor-pointer shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner">{mod.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-bible-gold transition-colors">{mod.title}</h4>
                                        <p className="text-xs text-gray-500">Dia {mod.currentDay} de {mod.durationDays}</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-bible-gold transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions */}
            <div className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                    <Compass size={12} /> Sugestões da IA
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SUGGESTED_THEMES.map(theme => (
                        <div key={theme.title} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
                            <div>
                                <span className="text-4xl mb-4 block">{theme.icon}</span>
                                <h4 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2">{theme.title}</h4>
                                <p className="text-sm text-gray-500 mb-8 leading-relaxed">{theme.desc}</p>
                            </div>
                            <button 
                                onClick={() => handleStartModule(theme.title)}
                                disabled={isCreating}
                                className="w-full py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-bible-gold hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isCreating ? <Loader2 className="animate-spin" size={12}/> : <Play size={12} fill="currentColor" />} Iniciar Estudo
                            </button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    </div>
  );
};

export default ThematicStudiesPage;