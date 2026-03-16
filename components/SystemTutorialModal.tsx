"use client";


import React, { useState } from 'react';
import { X, ChevronRight, BookOpen, MessageCircle, Church, ArrowRight, CheckCircle2, Sparkles, Wand2, Heart, Share2 } from 'lucide-react';

interface SystemTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- MOCK COMPONENTS (Miniaturas da Interface Real) ---

const MockReader = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-lg w-full max-w-[280px] mx-auto relative overflow-hidden">
    <div className="h-2 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="space-y-2">
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
      <div className="h-2 w-5/6 bg-gray-100 dark:bg-gray-800 rounded"></div>
      <div className="relative group cursor-pointer">
        <div className="absolute -inset-2 bg-bible-gold/10 rounded-lg border border-bible-gold/30"></div>
        <div className="h-2 w-full bg-bible-gold/40 rounded relative z-10"></div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black text-white text-[8px] px-2 py-1 rounded shadow-xl whitespace-nowrap animate-bounce">
            Toque para interagir
        </div>
      </div>
      <div className="h-2 w-4/5 bg-gray-100 dark:bg-gray-800 rounded"></div>
    </div>
  </div>
);

const MockChat = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-lg w-full max-w-[280px] mx-auto flex flex-col gap-3">
    <div className="self-end bg-bible-leather text-white p-3 rounded-2xl rounded-tr-none text-[10px] max-w-[80%] shadow-md">
       Explique este versículo...
    </div>
    <div className="self-start bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-3 rounded-2xl rounded-tl-none text-[10px] max-w-[90%] border border-gray-200 dark:border-gray-700 flex gap-2">
       <Sparkles size={12} className="text-bible-gold shrink-0" />
       <div>
         No contexto histórico, isso significa...
       </div>
    </div>
  </div>
);

const MockStudio = () => (
  <div className="bg-gray-900 rounded-2xl border border-gray-800 p-0 shadow-lg w-full max-w-[280px] mx-auto overflow-hidden relative aspect-video flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 opacity-50"></div>
      <div className="relative z-10 text-center p-4">
          <p className="font-serif text-white text-xs italic opacity-90 mb-2">"O Senhor é o meu pastor"</p>
          <span className="text-[8px] font-black text-bible-gold uppercase tracking-widest">Salmos 23</span>
      </div>
      <div className="absolute bottom-2 right-2 p-1.5 bg-white/20 backdrop-blur-md rounded-full">
          <Wand2 size={12} className="text-white" />
      </div>
  </div>
);

const MockCommunity = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-lg w-full max-w-[280px] mx-auto">
      <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 p-3 mb-3">
          <p className="text-[8px] text-blue-800 dark:text-blue-300 leading-relaxed">
             Peço oração pela minha família hoje.
          </p>
      </div>
      <div className="flex gap-2">
          <div className="flex-1 h-6 bg-bible-gold/10 rounded-lg flex items-center justify-center gap-1 text-[8px] font-bold text-bible-gold">
              <Heart size={10} fill="currentColor" /> Amém
          </div>
          <div className="w-8 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
              <Share2 size={10} />
          </div>
      </div>
  </div>
);

const steps = [
  {
    title: "Leitura Profunda",
    desc: "Toque em qualquer versículo para abrir o menu secreto. Marque como lido, crie notas ou peça uma explicação teológica instantânea.",
    component: <MockReader />,
    color: "bg-blue-500"
  },
  {
    title: "Seu Teólogo IA",
    desc: "Dúvidas difíceis? O 'Conselheiro' usa inteligência artificial para explicar contextos históricos e culturais como um professor.",
    component: <MockChat />,
    color: "bg-purple-500"
  },
  {
    title: "Estúdio Criativo",
    desc: "Transforme a Palavra em arte. Crie imagens sacras e podcasts automáticos a partir de qualquer capítulo para compartilhar.",
    component: <MockStudio />,
    color: "bg-pink-500"
  },
  {
    title: "Comunhão Real",
    desc: "Conecte-se à sua igreja. Participe do ranking de leitura, interceda por pedidos de oração e fortaleça sua célula.",
    component: <MockCommunity />,
    color: "bg-yellow-500"
  }
];

const SystemTutorialModal: React.FC<SystemTutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
      setTimeout(() => setCurrentStep(0), 300);
    }
  };

  const stepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-sm rounded-[2.5rem] p-0 shadow-2xl border border-gray-100 dark:border-gray-800 relative flex flex-col overflow-hidden">
        
        {/* Background Ambient Light */}
        <div className={`absolute top-0 left-0 right-0 h-40 ${stepData.color} opacity-10 blur-[60px] transition-colors duration-500`}></div>

        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-50 p-2 bg-white/50 dark:bg-black/20 rounded-full backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        {/* Content Area */}
        <div className="p-8 pb-0 flex-1 flex flex-col justify-center min-h-[300px]">
            {/* Animated Scene */}
            <div key={currentStep} className="animate-in zoom-in-95 fade-in duration-500 mb-8">
                {stepData.component}
            </div>

            <div key={`text-${currentStep}`} className="text-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                    {stepData.title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {stepData.desc}
                </p>
            </div>
        </div>

        {/* Footer Controls */}
        <div className="p-8 pt-6">
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-bible-gold' : 'w-1.5 bg-gray-200 dark:bg-gray-800'}`} 
                />
            ))}
            </div>

            <button 
                onClick={handleNext}
                className="w-full py-4 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl text-xs"
            >
                {currentStep === steps.length - 1 ? 'Começar Jornada' : 'Próximo'} 
                {currentStep === steps.length - 1 ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
            </button>
        </div>

      </div>
    </div>
  );
};

export default SystemTutorialModal;
    