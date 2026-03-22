'use client';
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, Filter, Grid, List, ChevronRight, Lock, Globe, 
  Users, Building2, Calendar, Clock, Star, TrendingUp, Bookmark, Crown,
  Sparkles, GraduationCap, MapPin, Cross, Heart, Play, Pause, MoreVertical,
  FolderOpen, FileText, Video, Mic, Image as ImageIcon, Wand2, Share2, 
  Trash2, Edit, Eye, EyeOff
} from 'lucide-react';
import SEO from '../../components/SEO';
import SocialNavigation from '../../components/SocialNavigation';
import { useNavigate } from '../../utils/router';

interface SalaItem {
  id: string;
  title: string;
  description: string;
  type: 'plan' | 'study' | 'cell' | 'church' | 'devotional' | 'track';
  visibility: 'public' | 'church' | 'cell' | 'private';
  coverImage?: string;
  creator: {
    name: string;
    photo?: string;
    role?: 'pastor' | 'admin' | 'user' | 'church' | 'cell';
  };
  stats: {
    participants?: number;
    views?: number;
    chapters?: number;
    completed?: number;
  };
  progress?: number;
  lastAccess?: string;
  createdAt: string;
  tags: string[];
  isOwner?: boolean;
}

const mockSalas: SalaItem[] = [
  // Planos/Jornadas públicas
  {
    id: '1',
    title: 'Jornada de Natal 2024',
    description: 'Descubra o verdadeiro significado do Natal através de 25 dias de reflexão e oração.',
    type: 'plan',
    visibility: 'public',
    coverImage: 'https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=800',
    creator: { name: 'Igreja Batista Central', role: 'church' },
    stats: { participants: 234, chapters: 25, completed: 12 },
    progress: 48,
    lastAccess: '2h atrás',
    createdAt: '2024-11-01',
    tags: ['Natal', 'Advento', 'Reflexão']
  },
  {
    id: '2',
    title: 'Estudos nas Epístolas de Paulo',
    description: 'Um mergulho profundo nas cartas do apóstolo Paulo aos primitivos cristãos.',
    type: 'plan',
    visibility: 'public',
    coverImage: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800',
    creator: { name: 'Pr. João Santos', role: 'pastor' },
    stats: { participants: 567, chapters: 48, completed: 15 },
    progress: 31,
    lastAccess: '5h atrás',
    createdAt: '2024-08-15',
    tags: ['Paulo', 'Cartas', 'Teologia']
  },
  {
    id: '3',
    title: 'Devocional 40 Dias de Oração',
    description: 'Quarenta dias transformadores de intimidade com Deus através da oração.',
    type: 'devotional',
    visibility: 'public',
    coverImage: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800',
    creator: { name: 'Maria Silva', role: 'user' },
    stats: { participants: 89, completed: 18 },
    progress: 45,
    lastAccess: '1d atrás',
    createdAt: '2024-10-20',
    tags: ['Oração', 'Devocional', 'Transformação']
  },

  // Estudos
  {
    id: '4',
    title: 'Estudo sobre a Graça',
    description: 'Uma análise profunda do conceito de graça nas Escrituras.',
    type: 'study',
    visibility: 'public',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
    creator: { name: 'Ana Oliveira', role: 'user' },
    stats: { views: 1245 },
    createdAt: '2024-09-10',
    tags: ['Graça', 'Teologia', 'Estudo']
  },
  {
    id: '5',
    title: 'O Livro de Apocalipse Explicado',
    description: 'Desvendando os símbolos e mensagens do último livro da Bíblia.',
    type: 'study',
    visibility: 'public',
    coverImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
    creator: { name: 'Pr. Carlos Mendes', role: 'pastor' },
    stats: { views: 3421 },
    createdAt: '2024-07-22',
    tags: ['Apocalipse', 'Profecia', 'Estudo']
  },

  // Minha Igreja
  {
    id: '6',
    title: 'Culto de Domingo - Série Família',
    description: 'Série de pregações sobre os fundamentos da família cristã.',
    type: 'church',
    visibility: 'church',
    coverImage: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800',
    creator: { name: 'Igreja Batista Central', role: 'church' },
    stats: { participants: 245, views: 1890 },
    createdAt: '2024-11-05',
    tags: ['Família', 'Culto', 'Pregação'],
    isOwner: false
  },
  {
    id: '7',
    title: 'Escola Bíblica Dominical - Jovens',
    description: 'Material complementar para a classe de jovens da EBD.',
    type: 'church',
    visibility: 'church',
    coverImage: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800',
    creator: { name: 'Igreja Batista Central', role: 'church' },
    stats: { participants: 45, views: 320 },
    createdAt: '2024-10-01',
    tags: ['EBD', 'Jovens', 'Educação']
  },

  // Células
  {
    id: '8',
    title: 'Célula Jovens - Terça-feira',
    description: 'Encontro semanal de jovens para comunhão e crescimento espiritual.',
    type: 'cell',
    visibility: 'cell',
    coverImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    creator: { name: 'Célula Jovens Fogo do Espírito', role: 'cell' },
    stats: { participants: 18, views: 156 },
    progress: 78,
    lastAccess: '1d atrás',
    createdAt: '2024-06-15',
    tags: ['Jovens', 'Célula', 'Comunhão'],
    isOwner: true
  },
  {
    id: '9',
    title: 'Célula Famílias - Quinta-feira',
    description: 'Estudo bíblico para casais e famílias.',
    type: 'cell',
    visibility: 'cell',
    coverImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
    creator: { name: 'Célula Famílias Unite', role: 'cell' },
    stats: { participants: 12, views: 89 },
    progress: 60,
    lastAccess: '2d atrás',
    createdAt: '2024-08-20',
    tags: ['Família', 'Célula', 'Casais']
  },

  // Privadas (Pastor)
  {
    id: '10',
    title: 'Conselho de Liderança - Notas',
    description: 'Material confidencial para reunião de conselho.',
    type: 'plan',
    visibility: 'private',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    creator: { name: 'Pr. João Santos', role: 'pastor' },
    stats: { participants: 8 },
    createdAt: '2024-11-10',
    tags: ['Liderança', 'Conselho', 'Privado'],
    isOwner: true
  },
  {
    id: '11',
    title: 'Planejamento 2025 - Igreja',
    description: 'Documento estratégico para o ano de 2025.',
    type: 'plan',
    visibility: 'private',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    creator: { name: 'Pr. João Santos', role: 'pastor' },
    stats: { participants: 5 },
    createdAt: '2024-11-08',
    tags: ['Planejamento', 'Igreja', 'Privado'],
    isOwner: true
  },
  {
    id: '12',
    title: 'Sermão de Domingo - Rascunho',
    description: 'Pregação em desenvolvimento para o próximo domingo.',
    type: 'study',
    visibility: 'private',
    coverImage: 'https://images.unsplash.com/photo-1493815793585-d94ccbc86df8?w=800',
    creator: { name: 'Pr. João Santos', role: 'pastor' },
    stats: { views: 1 },
    createdAt: '2024-11-12',
    tags: ['Sermão', 'Rascunho', 'Privado'],
    isOwner: true
  },

  // Tracks
  {
    id: '13',
    title: 'Trilha: Primeiros Passos na Fé',
    description: 'Para novos convertidos e quienes estão começando sua jornada.',
    type: 'track',
    visibility: 'public',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    creator: { name: 'BíbliaLM', role: 'admin' },
    stats: { participants: 1245, chapters: 7, completed: 890 },
    createdAt: '2024-01-01',
    tags: ['Iniciante', 'Trilha', 'Fundamentos']
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  plan: <Sparkles size={16} />,
  study: <FileText size={16} />,
  cell: <Users size={16} />,
  church: <Building2 size={16} />,
  devotional: <Heart size={16} />,
  track: <MapPin size={16} />
};

const typeLabels: Record<string, string> = {
  plan: 'Jornada',
  study: 'Estudo',
  cell: 'Célula',
  church: 'Igreja',
  devotional: 'Devocional',
  track: 'Trilha'
};

const visibilityConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  public: { icon: <Globe size={14} />, label: 'Público', color: 'text-green-600 bg-green-50' },
  church: { icon: <Building2 size={14} />, label: 'Igreja', color: 'text-blue-600 bg-blue-50' },
  cell: { icon: <Users size={14} />, label: 'Célula', color: 'text-purple-600 bg-purple-50' },
  private: { icon: <Lock size={14} />, label: 'Privado', color: 'text-amber-600 bg-amber-50' }
};

const AcervoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'public' | 'church' | 'cell' | 'private'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [isPastor] = useState(true); // Mock - em produção viria do auth

  const filteredSalas = mockSalas.filter(sala => {
    // Filter by tab
    if (activeTab === 'all') return true;
    if (activeTab === 'mine') return sala.isOwner;
    if (activeTab === 'public') return sala.visibility === 'public';
    if (activeTab === 'church') return sala.visibility === 'church';
    if (activeTab === 'cell') return sala.visibility === 'cell';
    if (activeTab === 'private') return sala.visibility === 'private' && sala.isOwner;
    return true;
  }).filter(sala => {
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return sala.title.toLowerCase().includes(query) ||
             sala.description.toLowerCase().includes(query) ||
             sala.tags.some(tag => tag.toLowerCase().includes(query));
    }
    return true;
  }).filter(sala => {
    // Filter by type
    if (filterType === 'all') return true;
    return sala.type === filterType;
  });

  const tabs = [
    { id: 'all', label: 'Todas', count: mockSalas.length },
    { id: 'mine', label: 'Minhas', count: mockSalas.filter(s => s.isOwner).length },
    { id: 'public', label: 'Públicas', count: mockSalas.filter(s => s.visibility === 'public').length },
    { id: 'church', label: 'Igreja', count: mockSalas.filter(s => s.visibility === 'church').length },
    { id: 'cell', label: 'Células', count: mockSalas.filter(s => s.visibility === 'cell').length },
    ...(isPastor ? [{ id: 'private', label: 'Privadas', count: mockSalas.filter(s => s.visibility === 'private' && s.isOwner).length }] : [])
  ];

  const stats = {
    total: mockSalas.length,
    publicas: mockSalas.filter(s => s.visibility === 'public').length,
    igreja: mockSalas.filter(s => s.visibility === 'church').length,
    celulas: mockSalas.filter(s => s.visibility === 'cell').length,
    privadas: mockSalas.filter(s => s.visibility === 'private' && s.isOwner).length,
    emProgresso: mockSalas.filter(s => s.progress && s.progress > 0).length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-bible-darkPaper pb-20">
      <SEO title="Acervo de Salas" />
      <SocialNavigation activeTab="explore" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-bible-darkPaper border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-bible-ink dark:text-white flex items-center gap-2">
                <FolderOpen size={28} className="text-bible-gold" />
                Acervo de Salas
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Explore jornadas, estudos e comunidades
              </p>
            </div>
            <button 
              onClick={() => navigate('/criador-jornada')}
              className="flex items-center gap-2 px-4 py-2 bg-bible-gold text-white font-bold rounded-xl hover:bg-bible-gold/90 transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Criar Sala</span>
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex-shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-xs text-blue-600 dark:text-blue-400">Total</span>
              <p className="font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
            </div>
            <div className="flex-shrink-0 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <span className="text-xs text-green-600 dark:text-green-400">Públicas</span>
              <p className="font-bold text-green-700 dark:text-green-300">{stats.publicas}</p>
            </div>
            <div className="flex-shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-xs text-blue-600 dark:text-blue-400">Igreja</span>
              <p className="font-bold text-blue-700 dark:text-blue-300">{stats.igreja}</p>
            </div>
            <div className="flex-shrink-0 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <span className="text-xs text-purple-600 dark:text-purple-400">Células</span>
              <p className="font-bold text-purple-700 dark:text-purple-300">{stats.celulas}</p>
            </div>
            {isPastor && (
              <div className="flex-shrink-0 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <span className="text-xs text-amber-600 dark:text-amber-400">Privadas</span>
                <p className="font-bold text-amber-700 dark:text-amber-300">{stats.privadas}</p>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar salas, estudos, tags..."
              className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-black/30 border-0 rounded-xl outline-none text-sm transition-all focus:ring-2 focus:ring-bible-gold/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-bible-gold text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs ${activeTab === tab.id ? 'opacity-80' : 'opacity-60'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters & View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-bible-darkPaper border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none"
            >
              <option value="all">Todos os tipos</option>
              <option value="plan">Jornadas</option>
              <option value="study">Estudos</option>
              <option value="devotional">Devocionais</option>
              <option value="track">Trilhas</option>
              <option value="cell">Células</option>
              <option value="church">Igreja</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-bible-darkPaper border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-bible-gold text-white' : 'text-gray-500'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-bible-gold text-white' : 'text-gray-500'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredSalas.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Nenhuma sala encontrada
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Tente ajustar seus filtros ou crie uma nova sala
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSalas.map(sala => (
              <SalaCard key={sala.id} sala={sala} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSalas.map(sala => (
              <SalaListItem key={sala.id} sala={sala} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const SalaCard: React.FC<{ sala: SalaItem }> = ({ sala }) => {
  const navigate = useNavigate();
  const visibility = visibilityConfig[sala.visibility];

  return (
    <button
      onClick={() => navigate(`/jornada/${sala.id}`)}
      className="group bg-white dark:bg-bible-darkPaper rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 text-left"
    >
      {/* Cover */}
      <div className="relative h-40 overflow-hidden">
        <img 
          src={sala.coverImage} 
          alt={sala.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${visibility.color}`}>
            {visibility.icon}
            {visibility.label}
          </span>
        </div>
        
        {/* Type */}
        <div className="absolute bottom-3 left-3">
          <span className="flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-black/70 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200">
            {typeIcons[sala.type]}
            {typeLabels[sala.type]}
          </span>
        </div>

        {/* Progress */}
        {sala.progress !== undefined && (
          <div className="absolute bottom-3 right-3">
            <div className="w-16 h-1.5 bg-white/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-bible-gold rounded-full"
                style={{ width: `${sala.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-bible-ink dark:text-white mb-1 group-hover:text-bible-gold transition-colors line-clamp-1">
          {sala.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {sala.description}
        </p>
        
        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-3">
          {sala.stats.participants && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {sala.stats.participants}
            </span>
          )}
          {sala.stats.views && (
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {sala.stats.views}
            </span>
          )}
          {sala.stats.chapters && (
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {sala.stats.chapters} etapas
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {sala.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};

const SalaListItem: React.FC<{ sala: SalaItem }> = ({ sala }) => {
  const navigate = useNavigate();
  const visibility = visibilityConfig[sala.visibility];

  return (
    <button
      onClick={() => navigate(`/jornada/${sala.id}`)}
      className="group flex items-center gap-4 p-4 bg-white dark:bg-bible-darkPaper rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all text-left w-full"
    >
      {/* Cover */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
        <img src={sala.coverImage} alt={sala.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={20} className="text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${visibility.color}`}>
            {visibility.icon}
            {visibility.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            {typeIcons[sala.type]}
            {typeLabels[sala.type]}
          </span>
        </div>
        <h3 className="font-semibold text-bible-ink dark:text-white group-hover:text-bible-gold transition-colors truncate">
          {sala.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {sala.creator.name}
        </p>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right">
        {sala.progress !== undefined && (
          <div className="mb-2">
            <span className="text-sm font-bold text-bible-gold">{sala.progress}%</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {sala.stats.participants && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {sala.stats.participants}
            </span>
          )}
          {sala.stats.views && (
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {sala.stats.views}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
    </button>
  );
};

export default AcervoPage;
