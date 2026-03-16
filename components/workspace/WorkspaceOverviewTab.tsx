import React from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Users, BookOpen, Target, Dices, TrendingUp, ArrowUpRight } from 'lucide-react';
import RecentEngagementWidget from './RecentEngagementWidget';

const WorkspaceOverviewTab: React.FC = () => {
  const { plans, teams, quizzes, loading } = useWorkspace();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-bible-darkPaper h-32 rounded-2xl border border-gray-100 dark:border-gray-800"></div>
        ))}
      </div>
    );
  }

  const activePlans = plans.filter(p => p.status === 'published').length;
  const totalSubscribers = plans.reduce((acc, plan) => acc + (plan.subscribersCount || 0), 0);
  const totalQuizzes = quizzes.length;
  const totalTeams = teams.length;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <Users size={20} />
            </div>
            <span className="flex items-center text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
              <TrendingUp size={12} className="mr-1" /> +12%
            </span>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{totalSubscribers}</h4>
            <p className="text-sm text-gray-500 font-medium">Alunos Ativos</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
              <BookOpen size={20} />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{activePlans}</h4>
            <p className="text-sm text-gray-500 font-medium">Salas Ativas</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
              <Target size={20} />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{totalTeams}</h4>
            <p className="text-sm text-gray-500 font-medium">Equipes na Gincana</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
              <Dices size={20} />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{totalQuizzes}</h4>
            <p className="text-sm text-gray-500 font-medium">Jogos Criados</p>
          </div>
        </div>

      </div>

      {/* Recent Activity or Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-bible-gold"/> Engajamento Recente
          </h3>
          <RecentEngagementWidget plans={plans} />
        </div>
        
        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Dicas Pastorais</h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="mt-1 bg-bible-gold/10 p-1.5 rounded-full text-bible-gold h-fit">
                <ArrowUpRight size={14} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-gray-900 dark:text-white">Crie um Quiz Semanal</h5>
                <p className="text-xs text-gray-500 mt-1">Jogos aumentam a retenção do estudo em até 40%.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 bg-bible-gold/10 p-1.5 rounded-full text-bible-gold h-fit">
                <ArrowUpRight size={14} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-gray-900 dark:text-white">Divida em Equipes</h5>
                <p className="text-xs text-gray-500 mt-1">A gamificação por equipes incentiva a leitura diária.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceOverviewTab;
