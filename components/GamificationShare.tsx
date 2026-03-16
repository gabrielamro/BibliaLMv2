
import React from 'react';
import { X, Share2, Flame, Sparkles, BookOpen, Crown, Gem } from 'lucide-react';
import { UserProfile } from '../types';
import { LogoIcon } from './LogoIcon';

interface GamificationShareProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  streak: number;
}

const getLevel = (xp: number) => {
    if (xp < 500) return { title: 'Iniciante', icon: '🌱' };
    if (xp < 2000) return { title: 'Discípulo', icon: '🌿' };
    if (xp < 5000) return { title: 'Missionário', icon: '🔥' };
    return { title: 'Apóstolo', icon: '👑' };
};

const GamificationShare: React.FC<GamificationShareProps> = ({ isOpen, onClose, userProfile, streak }) => {
  if (!isOpen) return null;

  const level = getLevel(userProfile.lifetimeXp || 0);
  const nextLevelXp = userProfile.lifetimeXp! < 500 ? 500 : userProfile.lifetimeXp! < 2000 ? 2000 : 5000;
  const progress = Math.min(100, ((userProfile.lifetimeXp || 0) / nextLevelXp) * 100);

  const handleShare = async () => {
      const text = `Estou no nível ${level.title} no BíbliaLM! 🔥 ${streak} dias seguidos. Baixe agora e estude comigo.`;
      const url = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://biblialm.com.br';
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Minha Jornada Bíblica',
                  text: text,
                  url: url
              });
          } catch (e) { console.log(e); }
      } else {
          alert("Tire um print da tela para compartilhar no Instagram!");
      }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white p-2">
            <X size={24} />
        </button>

        <div className="flex flex-col items-center gap-6">
            {/* The Card - 9:16 Aspect Ratio Look */}
            <div className="w-[320px] aspect-[9/16] bg-gradient-to-br from-bible-leather to-[#3d2b25] rounded-[2rem] shadow-2xl overflow-hidden relative border-4 border-bible-gold/30 flex flex-col items-center text-center p-8 text-white">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #c5a059 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {/* Header */}
                <div className="relative z-10 flex items-center gap-2 mb-8 opacity-80">
                    <LogoIcon className="w-5 h-5" />
                    <span className="text-xs font-serif tracking-[0.2em] uppercase">BíbliaLM</span>
                </div>

                {/* Avatar */}
                <div className="relative z-10 mb-4">
                    <div className="w-24 h-24 rounded-full border-4 border-bible-gold shadow-lg overflow-hidden bg-gray-800">
                        {userProfile.photoURL ? (
                            <img src={userProfile.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold">{userProfile.displayName?.substring(0,2)}</div>
                        )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-bible-gold text-bible-ink px-3 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap flex items-center gap-1">
                        {level.icon} {level.title}
                    </div>
                </div>

                <h2 className="relative z-10 text-xl font-bold font-serif mb-1">{userProfile.displayName}</h2>
                <p className="relative z-10 text-white/60 text-xs mb-8">@{userProfile.username || 'membro'}</p>

                {/* Stats Grid */}
                <div className="relative z-10 grid grid-cols-2 gap-3 w-full mb-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center border border-white/10">
                        <Flame className="text-orange-500 mb-1" size={24} fill="currentColor" />
                        <span className="text-2xl font-bold">{streak}</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-60">Dias Seq.</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center border border-white/10">
                        <Sparkles className="text-purple-400 mb-1" size={24} />
                        <span className="text-2xl font-bold">{userProfile.lifetimeXp || 0}</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-60">Maná Total</span>
                    </div>
                </div>

                {/* Level Progress */}
                <div className="relative z-10 w-full mb-auto">
                    <div className="flex justify-between text-[10px] uppercase font-bold opacity-60 mb-1">
                        <span>Nível Atual</span>
                        <span>Próximo</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-bible-gold to-yellow-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 mt-4 pt-4 border-t border-white/10 w-full">
                    <p className="font-serif italic text-sm opacity-90">"Lâmpada para os meus pés é a tua palavra."</p>
                </div>

            </div>

            <div className="flex gap-4">
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                >
                    <Share2 size={20} /> Compartilhar
                </button>
            </div>
            <p className="text-white/50 text-xs max-w-xs text-center">
                Dica: Tire um print do card acima para postar nos Stories!
            </p>
        </div>
    </div>
  );
};

export default GamificationShare;
