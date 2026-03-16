
import React from 'react';
import { X, Sparkles, Zap, Award, ArrowUp } from 'lucide-react';

interface ManaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManaGuideModal: React.FC<ManaGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 relative flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-3xl">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Manual do Maná</h2>
                    <p className="text-xs text-gray-500">Entenda a gamificação</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* O que é */}
            <section>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Zap size={18} className="text-yellow-500" /> O que é Maná (XP)?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                    O Maná é a representação da sua constância espiritual no aplicativo. Ele não é uma moeda gastável, mas sim uma pontuação acumulativa que demonstra seu progresso e dedicação na leitura da Palavra. Quanto mais Maná, maior seu Nível e Ranking.
                </p>
            </section>

            {/* Tabela de Pontos */}
            <section>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ArrowUp size={18} className="text-green-500" /> Como Ganhar Pontos
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-4 py-3 font-bold">Ação</th>
                                <th className="px-4 py-3 font-bold text-right">Maná</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                            <tr><td className="px-4 py-3">Meta Diária (Plano Completo)</td><td className="px-4 py-3 text-right font-bold text-green-600">+50</td></tr>
                            <tr><td className="px-4 py-3">Criar Sermão/Esboço</td><td className="px-4 py-3 text-right font-bold text-green-600">+40</td></tr>
                            <tr><td className="px-4 py-3">Estudo Profundo (IA)</td><td className="px-4 py-3 text-right font-bold text-green-600">+30</td></tr>
                            <tr><td className="px-4 py-3">Ler Capítulo da Bíblia</td><td className="px-4 py-3 text-right font-bold text-green-600">+20</td></tr>
                            <tr><td className="px-4 py-3">Ler Devocional</td><td className="px-4 py-3 text-right font-bold text-green-600">+15</td></tr>
                            <tr><td className="px-4 py-3">Gerar Imagem com IA</td><td className="px-4 py-3 text-right font-bold text-green-600">+10</td></tr>
                            <tr><td className="px-4 py-3">Compartilhar Conteúdo</td><td className="px-4 py-3 text-right font-bold text-green-600">+10</td></tr>
                            <tr><td className="px-4 py-3">Marcar Versículo Lido</td><td className="px-4 py-3 text-right font-bold text-green-600">+2</td></tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Níveis */}
            <section>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Award size={18} className="text-bible-gold" /> Níveis de Jornada
                </h3>
                <div className="space-y-2">
                    {[
                        { lvl: 'Iniciante', xp: '0 - 499', icon: '🌱' },
                        { lvl: 'Peregrino', xp: '500 - 1.999', icon: '🌿' },
                        { lvl: 'Discípulo', xp: '2.000 - 4.999', icon: '📜' },
                        { lvl: 'Guerreiro', xp: '5.000 - 9.999', icon: '⚔️' },
                        { lvl: 'Mestre', xp: '10.000+', icon: '👑' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{item.lvl}</span>
                            </div>
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-black px-2 py-1 rounded">{item.xp}</span>
                        </div>
                    ))}
                </div>
            </section>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                <strong>Dica:</strong> A cada 100 de Maná acumulado, você ganha moedas de bônus! A leitura honesta e constante é o caminho para a sabedoria.
            </div>

        </div>
      </div>
    </div>
  );
};

export default ManaGuideModal;
