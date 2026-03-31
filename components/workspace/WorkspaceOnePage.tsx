"use client";
import { useNavigate } from '../../utils/router';

import React, { useState } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { dbService } from '../../services/supabase';
import { Users, BookOpen, Target, Dices, TrendingUp, Plus, ArrowRight, Shield, Trophy, Medal, MoreVertical, LayoutGrid, Map, HandHeart, X } from 'lucide-react';

import QuizBuilderModal from '../QuizBuilderModal';

const WorkspaceOnePage: React.FC = () => {
  const { plans, teams, quizzes, tracks, prayers, loading, saveQuiz, createTeam } = useWorkspace();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedTeamRanking, setSelectedTeamRanking] = useState<string | null>(null);
  const [showAllPrayers, setShowAllPrayers] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);

  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#ef4444'); // Default red

  const TEAM_COLORS = [
    { label: 'Vermelho', value: '#ef4444' },
    { label: 'Azul', value: '#3b82f6' },
    { label: 'Verde', value: '#22c55e' },
    { label: 'Amarelo', value: '#eab308' },
    { label: 'Roxo', value: '#a855f7' },
    { label: 'Laranja', value: '#f97316' },
    { label: 'Rosa', value: '#ec4899' },
    { label: 'Preto', value: '#111827' }
  ];

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await createTeam(newTeamName, newTeamColor);
    setIsCreatingTeam(false);
    setNewTeamName('');
  };

  const handleAction = async (type: 'plan' | 'track' | 'prayer' | 'quiz', id: string, action: 'edit' | 'delete' | 'toggle_status') => {
    if (!currentUser) return;
    setActiveMenuId(null);
    const tableName = type === 'plan' ? 'custom_plans' : type === 'track' ? 'reading_tracks' : type === 'prayer' ? 'guided_prayers' : 'custom_quizzes';

    try {
      if (action === 'edit') {
        if (type === 'plan') navigate(`/criador-jornada?id=${id}`);
        else if (type === 'track') navigate(`/trilhas/gerenciar?id=${id}`);
        else if (type === 'prayer') navigate(`/oracoes/gerenciar?id=${id}`);
      } else if (action === 'delete') {
        if (window.confirm("Tem certeza que deseja excluir?")) {
          await dbService.delete(currentUser.uid, tableName, id);
          window.location.reload();
        }
      } else if (action === 'toggle_status') {
        const updateData = type === 'plan'
          ? { status: 'draft', is_public: false }
          : { status: 'draft' }; // For safety, if any other type ever tries to use this
        await dbService.update(currentUser.uid, tableName, id, updateData);
        window.location.reload();
      }
    } catch (e: any) {
      console.error('Erro na ação:', JSON.stringify(e, null, 2), e?.message, e?.details);
      // Evita o erro [object Object] extraindo a mensagem se for um erro do supabase
      const errorMsg = e?.message || e?.details || "Ocorreu um erro ao processar a ação.";
      alert(`Erro: ${errorMsg}`);
    }
  };

  const ActionMenu = ({ id, type, currentStatus }: { id: string, type: 'plan' | 'track' | 'prayer' | 'quiz', currentStatus?: string }) => (
    <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95">
      <button onClick={() => handleAction(type, id, 'edit')} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-50 dark:border-gray-700">
        <Plus size={14} className="rotate-45" /> Editar
      </button>
      {currentStatus === 'published' && (
        <button onClick={() => handleAction(type, id, 'toggle_status')} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-50 dark:border-gray-700">
          <Shield size={14} /> Ocultar (Rascunho)
        </button>
      )}
      <button onClick={() => handleAction(type, id, 'delete')} className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
        <X size={14} /> Excluir
      </button>
    </div>
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch (e) { return ''; }
  };

  const displayedPrayers = showAllPrayers ? prayers : prayers.slice(0, 3);
  const displayedGames = showAllGames ? quizzes : quizzes.slice(0, 3);
  const displayedPlans = showAllPlans ? plans : plans.slice(0, 3);


  if (loading) {
    return <div className="animate-pulse p-8">Carregando workspace...</div>;
  }

  const activePlans = plans.filter(p => p.status === 'published');
  const totalSubscribers = plans.reduce((acc, plan) => acc + (plan.subscribersCount || 0), 0);

  // Mock members for now, since we don't have a real members list in context
  const members = [
    { id: '1', name: 'João Silva', teamId: teams[0]?.id, xp: 1500 },
    { id: '2', name: 'Maria Souza', teamId: teams[0]?.id, xp: 1200 },
    { id: '3', name: 'Pedro Santos', teamId: teams[1]?.id, xp: 1800 },
    { id: '4', name: 'Ana Costa', teamId: null, xp: 500 },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">

      {/* Visão Geral */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="text-bible-gold" /> Visão Geral
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl w-fit mb-4"><Users size={20} /></div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{totalSubscribers}</h4>
            <p className="text-sm text-gray-500 font-medium">Alunos Ativos</p>
          </div>
          <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl w-fit mb-4"><BookOpen size={20} /></div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{activePlans.length}</h4>
            <p className="text-sm text-gray-500 font-medium">Salas Ativas</p>
          </div>
          <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl w-fit mb-4"><Target size={20} /></div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{teams.length}</h4>
            <p className="text-sm text-gray-500 font-medium">Equipes</p>
          </div>
          <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl w-fit mb-4"><Dices size={20} /></div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{quizzes.length}</h4>
            <p className="text-sm text-gray-500 font-medium">Jogos Criados</p>
          </div>
        </div>
      </section>

      {/* Planos & Salas */}
      <section className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-bible-gold" /> Planos & Salas
          </h2>
          {plans.length > 3 && (
            <button onClick={() => setShowAllPlans(!showAllPlans)} className="text-sm font-bold text-bible-gold hover:underline flex items-center gap-1">
              {showAllPlans ? 'Ver Menos' : 'Ver Todos'} <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/criador-jornada?type=sala')}
            className="bg-gradient-to-br from-bible-gold/5 to-transparent p-6 rounded-[1.5rem] border-2 border-dashed border-bible-gold/30 flex flex-col items-start justify-center cursor-pointer hover:border-bible-gold hover:bg-bible-gold/10 transition-all min-h-[200px] group"
          >
            <div className="w-12 h-12 bg-bible-gold/20 rounded-xl flex items-center justify-center mb-4 text-bible-gold group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Nova Sala</h3>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
              Crie uma sala nova exclusiva para sua igreja.
            </p>
          </div>

          {displayedPlans.map(plan => (
            <div
              key={plan.id}
              onClick={(e) => {
                // Prevent routing if the action menu or button was clicked
                if ((e.target as HTMLElement).closest('button')) return;
                navigate(`/jornada/${plan.id}`);
              }}
              className="bg-white dark:bg-bible-darkPaper rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer hover:border-bible-gold group h-full"
            >
              <div className="h-28 bg-gray-100 dark:bg-gray-800 relative overflow-hidden shrink-0">
                {plan.coverUrl ? (
                  <img src={plan.coverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={plan.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-bible-gold/5">
                    <BookOpen className="text-bible-gold/20" size={32} />
                  </div>
                )}
                
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-sm text-white ${plan.status === 'published' ? 'bg-green-500' : 'bg-gray-500'}`}>
                    {plan.status === 'published' ? 'Ativa' : 'Rascunho'}
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                   <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === plan.id ? null : plan.id); }} className="text-white bg-black/20 hover:bg-black/40 backdrop-blur-md p-1 rounded-lg transition-colors"><MoreVertical size={14} /></button>
                   {activeMenuId === plan.id && <div className="absolute top-full right-0 mt-1"><ActionMenu id={plan.id} type="plan" currentStatus={plan.status} /></div>}
                </div>
              </div>

              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight mb-2 group-hover:text-bible-gold transition-colors">
                    {plan.title}
                  </h3>

                  <div className="flex flex-col gap-1.5 mt-3">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <Users size={14} className="mr-1.5 opacity-70" />
                      {plan.subscribersCount || 0} alunos inscritos
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <BookOpen size={14} className="mr-1.5 opacity-70" />
                      {plan.weeks?.length || 0} módulos selecionados
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800/50 flex justify-between items-center">
                  <button
                    className="bg-gray-50 dark:bg-gray-800 group-hover:bg-bible-gold group-hover:text-white text-gray-700 dark:text-gray-300 font-bold px-3 py-1.5 text-xs rounded-lg flex items-center transition-colors w-full justify-center"
                  >
                    Gerenciar Sala <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Jogos */}
      <section className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Dices className="text-bible-gold" /> Jogos
          </h2>
          {quizzes.length > 3 && (
            <button onClick={() => setShowAllGames(!showAllGames)} className="text-sm font-bold text-bible-gold hover:underline flex items-center gap-1">
              {showAllGames ? 'Ver Menos' : 'Ver Todos'} <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={() => setShowQuizModal(true)}
            className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[1.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center cursor-pointer hover:border-bible-gold hover:bg-bible-gold/5 transition-all min-h-[160px]"
          >
            <div className="w-12 h-12 bg-bible-gold/10 rounded-full flex items-center justify-center mb-3 text-bible-gold">
              <Plus size={24} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Criar Novo Jogo</h3>
          </div>

          {displayedGames.map(quiz => (
            <div key={quiz.id} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start mb-3 relative">
                <div className="flex flex-col gap-1">
                  <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 w-fit">
                    {quiz.type === 'ai_generated' ? 'IA' : 'Manual'}
                  </span>
                  {quiz.createdAt && <span className="text-[9px] text-gray-400 font-bold ml-1">Criação: {formatDate(quiz.createdAt)}</span>}
                </div>
                <button onClick={() => setActiveMenuId(activeMenuId === quiz.id ? null : quiz.id)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg"><MoreVertical size={16} /></button>
                {activeMenuId === quiz.id && <ActionMenu id={quiz.id} type="quiz" />}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{quiz.title}</h3>
              <button onClick={() => navigate(`/quiz?id=${quiz.id}`)} className="mt-4 text-xs font-bold text-bible-gold flex items-center gap-1 hover:underline">
                Jogar <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Trilhas de Estudo (DESATIVADO)
      {tracks.length > 0 && (
        <section className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="text-bible-gold" /> Trilhas de Estudo
            </h2>
            {tracks.length > 3 && (
              <button onClick={() => setShowAllTracks(!showAllTracks)} className="text-sm font-bold text-bible-gold hover:underline flex items-center gap-1">
                {showAllTracks ? 'Ver Menos' : 'Ver Todas'} <ArrowRight size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              onClick={() => navigate('/trilhas/gerenciar?action=new')}
              className="bg-gradient-to-br from-bible-gold/5 to-transparent p-6 rounded-[1.5rem] border-2 border-dashed border-bible-gold/30 flex flex-col items-start justify-center cursor-pointer hover:border-bible-gold hover:bg-bible-gold/10 transition-all min-h-[200px] group"
            >
              <div className="w-12 h-12 bg-bible-gold/20 rounded-xl flex items-center justify-center mb-4 text-bible-gold group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Nova Trilha de Estudo</h3>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                Crie uma trilha com base em aulas e conteúdos organizados.
              </p>
            </div>

            {displayedTracks.map(track => (
              <div key={track.id} className="bg-white dark:bg-bible-darkPaper p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between min-h-[200px] hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-3 relative">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider w-fit ${track.isPublic ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {track.isPublic ? 'Público' : 'Rascunho'}
                      </span>
                      {track.createdAt && <span className="text-[9px] text-gray-400 font-bold ml-1">Criação: {formatDate(track.createdAt)}</span>}
                    </div>
                    <button onClick={() => setActiveMenuId(activeMenuId === track.id ? null : track.id)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg"><MoreVertical size={16} /></button>
                    {activeMenuId === track.id && <ActionMenu id={track.id} type="track" />}
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight mb-2">
                    {track.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {track.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800/50 flex justify-between items-center">
                  <button
                    onClick={() => navigate(`/trilhas/gerenciar?id=${track.id}`)}
                    className="bg-gray-50 dark:bg-gray-800 hover:bg-bible-gold hover:text-white text-gray-700 dark:text-gray-300 font-bold px-3 py-1.5 text-xs rounded-lg flex items-center transition-colors w-full justify-center group"
                  >
                    Gerenciar Trilha <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      */}

      {/* Orações Guiadas */}
      <section className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HandHeart className="text-bible-gold" /> Orações Guiadas
          </h2>
          {prayers.length > 3 && (
            <button onClick={() => setShowAllPrayers(!showAllPrayers)} className="text-sm font-bold text-bible-gold hover:underline flex items-center gap-1">
              {showAllPrayers ? 'Ver Menos' : 'Ver Todas'} <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/oracoes/gerenciar?action=new')}
            className="bg-gradient-to-br from-bible-gold/5 to-transparent p-6 rounded-[1.5rem] border-2 border-dashed border-bible-gold/30 flex flex-col items-start justify-center cursor-pointer hover:border-bible-gold hover:bg-bible-gold/10 transition-all min-h-[200px] group"
          >
            <div className="w-12 h-12 bg-bible-gold/20 rounded-xl flex items-center justify-center mb-4 text-bible-gold group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Nova Oração Guiada</h3>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
              Crie propósitos de oração guiados e meditações de fé.
            </p>
          </div>

          {displayedPrayers.map(prayer => (
            <div key={prayer.id} className="bg-white dark:bg-bible-darkPaper p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between min-h-[200px] hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-3 relative">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider w-fit ${prayer.isTemplate ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                      {prayer.isTemplate ? 'Template Público' : 'Pessoal'}
                    </span>
                    {prayer.createdAt && <span className="text-[9px] text-gray-400 font-bold ml-1">Criação: {formatDate(prayer.createdAt)}</span>}
                  </div>
                  <button onClick={() => setActiveMenuId(activeMenuId === prayer.id ? null : prayer.id)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg"><MoreVertical size={16} /></button>
                  {activeMenuId === prayer.id && <ActionMenu id={prayer.id} type="prayer" />}
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight mb-2">
                  {prayer.title}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800/50 flex justify-between items-center">
                <button
                  onClick={() => navigate(`/oracoes/gerenciar?id=${prayer.id}`)}
                  className="bg-gray-50 dark:bg-gray-800 hover:bg-bible-gold hover:text-white text-gray-700 dark:text-gray-300 font-bold px-3 py-1.5 text-xs rounded-lg flex items-center transition-colors w-full justify-center group"
                >
                  Gerenciar Oração <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Admin Pastoral: Membros e Equipes */}
      <section className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="text-bible-gold" /> Admin Pastoral (Membros e Equipes)
          </h2>
          {!isCreatingTeam && (
            <button
              onClick={() => setIsCreatingTeam(true)}
              className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Plus size={14} /> Criar Time
            </button>
          )}
        </div>

        {isCreatingTeam && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 animate-in slide-in-from-top-2">
            <h4 className="font-bold text-sm mb-3">Criar Nova Equipe</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nome da Equipe (ex: Tribo de Judá)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm outline-none focus:border-bible-gold"
              />
              <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-1">
                {TEAM_COLORS.map(c => (
                  <button
                    key={c.label}
                    onClick={() => setNewTeamColor(c.value)}
                    className={`w-8 h-8 rounded-full ring-2 ring-offset-2 dark:ring-offset-gray-900 transition-all ${newTeamColor === c.value ? 'ring-gray-400 scale-110' : 'ring-transparent opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsCreatingTeam(false)} className="px-4 py-2 text-gray-500 font-bold text-xs hover:text-gray-700">Cancelar</button>
              <button onClick={handleCreateTeam} className="px-6 py-2 bg-bible-gold text-white rounded-lg font-bold text-xs shadow-md hover:scale-105 transition-transform">Criar</button>
            </div>
          </div>
        )}

        {/* CTAs de Times */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setSelectedTeamRanking(null)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${!selectedTeamRanking ? 'bg-bible-gold text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
          >
            <Trophy size={16} className="inline mr-2" /> Ranking Geral
          </button>
          {teams.map(team => {
            const teamMembersCount = members.filter(m => m.teamId === team.id).length;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamRanking(team.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${selectedTeamRanking === team.id ? 'bg-bible-gold text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                style={{
                  borderLeft: `4px solid ${team.color}`,
                  boxShadow: selectedTeamRanking === team.id ? `0 4px 14px 0 ${team.color}40` : 'none'
                }}
              >
                {team.name} <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded-md ml-1">{teamMembersCount}</span>
              </button>
            )
          })}
        </div>

        {/* Lista de Membros Filtrada */}
        <div className="space-y-2">
          {members
            .filter(m => selectedTeamRanking ? m.teamId === selectedTeamRanking : true)
            .map((member, index) => (
              <div key={member.id} className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 group hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${index === 0 ? 'bg-yellow-500 scale-110' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                    {index < 3 ? <Medal size={16} /> : index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-black overflow-hidden flex items-center justify-center font-bold text-gray-500 shadow-sm border border-gray-100 dark:border-gray-800">
                    {member.name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{member.name}</h4>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {member.teamId && teams.find(t => t.id === member.teamId)?.name}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="font-black text-lg text-bible-gold">{member.xp}</span>
                  <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">XP</span>
                </div>
              </div>
            ))}
        </div>
      </section>

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

export default WorkspaceOnePage;
