
import React from 'react';
import { X, Sparkles, Trophy, ArrowUp, AlertCircle, Share2, BookOpen, Coffee, CalendarRange } from 'lucide-react';
import { UserProfile } from '../types';
import { BADGES } from '../constants';

interface LevelProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

const LevelProgressModal: React.FC<LevelProgressModalProps> = ({ isOpen, onClose, userProfile }) => {
  if (!isOpen) return null;

  const currentXp = userProfile.lifetimeXp || 0;
  
  // Obter todos os níveis ordenados
  const levels = BADGES.filter(b => b.category === 'level').sort((a, b) => (a.requirement || 0) - (b.requirement || 0));
  
  // Encontrar próximo nível
  const nextLevelIndex = levels.findIndex(l => (l.requirement || 0) > currentXp);
  const currentLevelBadge = nextLevelIndex > 0 ? levels[nextLevelIndex - 1] : null;
  const nextLevelBadge = nextLevelIndex !== -1 ? levels[nextLevelIndex] : null;

  // Cálculos de Progresso
  let progress = 0;
  let missingXp = 0;
  let prevReq = 0;
  let nextReq = 100; // Default fallback

  if (nextLevelBadge) {
      prevReq = currentLevelBadge ? (currentLevelBadge.requirement || 0) : 0;
      nextReq = nextLevelBadge.requirement || 0;
      missingXp = nextReq - currentXp;
      
      const totalRange = nextReq - prevReq;
      const currentInRage = currentXp - prevReq;
      progress = Math.min(100, Math.max(0, (currentInRage / totalRange) * 100));
  } else {
      progress = 100; // Nível máximo
  }

  const handleShare = async () => {
    const levelName = currentLevelBadge?.name || 'Iniciante';
    const text = `Estou no nível ${levelName} no App @biblialm! 🚀 Já acumulei ${currentXp} de Maná na minha jornada espiritual. Venha estudar a Bíblia com Inteligência Artificial!`;
    
    // Fallback seguro para URL de perfil
    let baseUrl = 'https://biblialm.com.br';
    if (window.location.protocol !== 'blob:' && window.location.hostname !== 'localhost') {
        baseUrl = window.location.origin;
    }
    const profileUrl = `${baseUrl}/${userProfile.username || ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Progresso no BíbliaLM',
          text: text,
          url: profileUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text + " " + profileUrl);
      alert("Texto copiado! Compartilhe no Instagram e marque @biblialm");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10">
                <X size={24} />
            </button>

            <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-purple-600 dark:text-purple-400">
                    <Trophy size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Seu Progresso</h2>
                <p className="text-sm text-gray-500">Jornada Espiritual</p>
            </div>

            {/* Life Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col items-center text-center">
                  <div className="p-1.5 bg-white dark:bg-blue-900 rounded-lg mb-1 shadow-sm text-blue-600 dark:text-blue-300">
                     <BookOpen size={16} />
                  </div>
                  <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{userProfile.stats?.totalChaptersRead || 0}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Leituras</span>
               </div>
               
               <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800 flex flex-col items-center text-center">
                  <div className="p-1.5 bg-white dark:bg-green-900 rounded-lg mb-1 shadow-sm text-green-600 dark:text-green-300">
                     <CalendarRange size={16} />
                  </div>
                  <span className="text-lg font-black text-gray-900 dark:text-white leading-none">
                     {userProfile.readingPlan?.completedDays?.length || 0}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Dias Meta</span>
               </div>

               <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 flex flex-col items-center text-center">
                  <div className="p-1.5 bg-white dark:bg-orange-900 rounded-lg mb-1 shadow-sm text-orange-600 dark:text-orange-300">
                     <Coffee size={16} />
                  </div>
                  <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{userProfile.stats?.totalDevotionalsRead || 0}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Devocionais</span>
               </div>
            </div>

            {/* Current Status */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 mb-6 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Nível Atual</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                        <Sparkles size={14} /> {currentLevelBadge?.name || 'Peregrino'}
                    </span>
                </div>
                
                <div className="flex items-end gap-1 mb-4">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{currentXp}</span>
                    <span className="text-sm font-medium text-gray-500 mb-1">Maná</span>
                </div>

                {/* Progress Bar */}
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div className="text-right">
                            <span className="text-[10px] font-semibold inline-block text-purple-600 dark:text-purple-400">
                                {Math.round(progress)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-purple-200 dark:bg-purple-900/30">
                        <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600 transition-all duration-1000 ease-out"></div>
                    </div>
                </div>

                {/* Next Level Info */}
                {nextLevelBadge ? (
                    <div className="flex items-start gap-3 bg-white dark:bg-black/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/20">
                        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full mt-0.5">
                            <AlertCircle size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Próxima Conquista: {nextLevelBadge.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Faltam <span className="font-bold text-orange-600 dark:text-orange-400">{missingXp} Maná</span> para subir de nível.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-sm text-green-600 font-bold p-2">
                        Você alcançou o nível máximo! 
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Como ganhar mais?</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <ArrowUp size={14} className="text-green-500" /> Leitura (+5)
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <ArrowUp size={14} className="text-green-500" /> Devocional (+10)
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <ArrowUp size={14} className="text-green-500" /> Criar Estudo (+15)
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <ArrowUp size={14} className="text-green-500" /> Meta Diária (+25)
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={handleShare}
                        className="w-full py-3 bg-gradient-to-r from-bible-gold to-yellow-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity transform active:scale-[0.98]"
                    >
                        <Share2 size={20} /> Compartilhar Progresso
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-2">
                        Marque @biblialm para ser repostado!
                    </p>
                </div>
            </div>

        </div>
    </div>
  );
};

export default LevelProgressModal;
