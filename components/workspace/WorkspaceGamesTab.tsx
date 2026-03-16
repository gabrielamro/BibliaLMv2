"use client";
import { useNavigate } from '../../utils/router';

import React, { useState } from 'react';

import { Plus, Dices, Share2, Trash2, Play } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import QuizBuilderModal from '../QuizBuilderModal';

const WorkspaceGamesTab: React.FC = () => {
  const navigate = useNavigate();
  const { quizzes, loading, saveQuiz, deleteQuiz } = useWorkspace();
  const { showNotification } = useAuth();
  
  const [showQuizModal, setShowQuizModal] = useState(false);

  const handleShareQuiz = (quizId: string) => {
    const url = `${window.location.origin}/#/quiz?id=${quizId}`;
    navigator.clipboard.writeText(url);
    showNotification("Link do jogo copiado!", "success");
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este jogo?")) return;
    await deleteQuiz(id);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-bible-darkPaper h-48 rounded-[2rem] border border-gray-100 dark:border-gray-800"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => setShowQuizModal(true)} 
          className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center cursor-pointer hover:border-bible-gold hover:bg-bible-gold/5 transition-all group min-h-[200px]"
        >
          <div className="w-16 h-16 bg-bible-gold/10 rounded-full flex items-center justify-center mb-4 text-bible-gold group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">Criar Novo Jogo</h3>
          <p className="text-xs text-gray-500 mt-1">Quiz interativo para sua audiência</p>
        </div>

        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none -mr-2 -mt-2">
              <Dices size={80} />
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${quiz.type === 'ai_generated' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                {quiz.type === 'ai_generated' ? 'IA' : 'Manual'}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleShareQuiz(quiz.id)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-bible-gold"><Share2 size={14}/></button>
                <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">{quiz.title}</h3>
            <p className="text-xs text-gray-500 mb-6 line-clamp-2 min-h-[2.5em]">{quiz.description || "Sem descrição."}</p>
            
            <button 
              onClick={() => navigate(`/quiz?id=${quiz.id}`)} 
              className="w-full py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-bible-gold hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Play size={14} fill="currentColor"/> Jogar
            </button>
          </div>
        ))}
      </div>

      <QuizBuilderModal 
        isOpen={showQuizModal} 
        onClose={() => setShowQuizModal(false)} 
        onSave={async (data: any) => {
          await saveQuiz(data);
          setShowQuizModal(false);
        }} 
      />
    </div>
  );
};

export default WorkspaceGamesTab;
