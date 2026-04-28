"use client";
import { useNavigate, useLocation } from '../../utils/router';
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/supabase';
import { Church } from '../../types';
import { 
  Loader2, MapPin, Search, Shield, Compass, ChevronRight
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import SEO from '../../components/SEO';

const ChurchesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTitle, resetHeader, setBreadcrumbs } = useHeader();
  
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTitle('Igrejas no Reino');
    setBreadcrumbs([
      { label: 'O Reino', path: '/social' },
      { label: 'Explorar', path: '/social/explore' },
      { label: 'Igrejas' }
    ]);
    loadChurches();
    return () => resetHeader();
  }, [setTitle, resetHeader, setBreadcrumbs]);

  const loadChurches = async () => {
    setLoading(true);
    try {
      const data = await dbService.searchGlobalChurches('');
      setChurches(data);
    } catch (e) {
      console.error("Erro ao carregar igrejas:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredChurches = churches.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.location?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.location?.state || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">
      <SEO title="Igrejas no Reino" description="Explore todas as igrejas e comunidades cadastradas no BíbliaLM." />
      
      <div className="max-w-xl mx-auto px-4 py-8 pb-32">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Compass size={32} />
          </div>
          <h1 className="text-2xl font-serif font-black text-gray-900 dark:text-white mb-2">Comunidades de Fé</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Encontre uma igreja próxima a você</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou cidade..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-bible-darkPaper border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm outline-none focus:ring-2 ring-bible-gold transition-all font-bold"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-bible-gold mb-4" size={32} />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Buscando Comunidades...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChurches.map(church => (
              <div 
                key={church.id}
                onClick={() => navigate(`/igreja/${church.slug}`)}
                className="bg-white dark:bg-bible-darkPaper p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:border-bible-gold transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {church.logoUrl ? (
                    <img src={church.logoUrl} className="w-full h-full object-cover" alt={church.name} />
                  ) : (
                    <Shield size={24} className="text-gray-200 dark:text-gray-700" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate mb-0.5">{church.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    <MapPin size={12} className="text-bible-gold" />
                    {church.location?.city}, {church.location?.state}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {church.stats?.memberCount || 0} Membros
                    </span>
                    <span className="text-[9px] font-black text-purple-500 uppercase tracking-tighter bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                      {church.stats?.totalMana || 0} Vitalidade
                    </span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 group-hover:text-bible-gold group-hover:bg-bible-gold/10 transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            ))}

            {filteredChurches.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
                <Search size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-500 font-bold">Nenhuma igreja encontrada</p>
                <p className="text-[10px] text-gray-400 uppercase font-black mt-1">Tente outro termo de busca</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChurchesListPage;
