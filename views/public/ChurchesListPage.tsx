"use client";
import { useNavigate, useLocation } from '../../utils/router';
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/supabase';
import { Church } from '../../types';
import {
  CheckCircle2,
  ChevronRight,
  Compass,
  Loader2,
  MapPin,
  Search,
  Shield,
} from 'lucide-react';
import { useHeader } from '../../contexts/HeaderContext';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/SEO';
import SocialNavigation from '../../components/SocialNavigation';
import { generateSlug } from '../../utils/textUtils';

const ChurchesListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, openLogin, showNotification } = useAuth();
  const { setTitle, resetHeader, setBreadcrumbs } = useHeader();

  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionChurchId, setActionChurchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [stateQuery, setStateQuery] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const isSocialMode = location.pathname.startsWith('/social');
  const currentUserId = currentUser?.uid || currentUser?.id;
  const currentChurchId = userProfile?.churchData?.churchId;
  const currentChurchSlug = userProfile?.churchData?.churchSlug;

  const reportChurchActionError = (label: string, error: unknown) => {
    const message = error instanceof Error ? error.message : (() => {
      try { return JSON.stringify(error); } catch { return String(error); }
    })();
    console.error(label, message);
    return message;
  };

  useEffect(() => {
    setTitle('Igrejas no Reino');
    setBreadcrumbs([
      { label: 'O Reino', path: '/social' },
      { label: 'Explorar', path: '/social/explore' },
      { label: 'Igrejas' },
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
      reportChurchActionError('Erro ao carregar igrejas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    setNextPageToken(null);
    setNextOffset(null);
    try {
      const term = searchQuery.trim();
      const city = cityQuery.trim();
      const state = stateQuery.trim().toUpperCase();
      if (term || city || state) {
        const page = await dbService.searchChurchesPage(term, city, state, { includeExternal: true, limit: 10 });
        setChurches(page.results);
        setNextPageToken(page.nextPageToken);
        setNextOffset(page.nextOffset);
      } else {
        const data = await dbService.searchGlobalChurches('');
        setChurches(data.slice(0, 10));
        setNextPageToken(null);
        setNextOffset(null);
      }
    } catch (e) {
      reportChurchActionError('Erro ao buscar igrejas:', e);
      showNotification('Nao foi possivel buscar igrejas agora.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createChurchFromSearch = async () => {
    const name = searchQuery.trim();
    const city = cityQuery.trim();
    const state = stateQuery.trim().toUpperCase();
    if (!name || !city || !state) {
      showNotification('Informe nome da igreja, cidade e UF para criar o perfil.', 'info');
      return;
    }
    if (!currentUserId) {
      openLogin('/social/igrejas');
      showNotification('Entre para criar e marcar esta igreja.', 'info');
      return;
    }

    setActionChurchId('manual-create');
    try {
      const slug = generateSlug(`${name} ${city} ${state} ${Date.now()}`);
      const id = await dbService.createChurch({
        name,
        acronym: '',
        slug,
        denomination: '',
        location: { city, state, address: '' },
        stats: { memberCount: 0, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
        teams: [],
        teamScores: {},
        admins: [],
        verificationStatus: 'unclaimed',
        sourceAttribution: 'Cadastro iniciado pelo membro',
        createdBy: currentUserId,
      });
      const createdChurch = {
        id,
        name,
        acronym: '',
        slug,
        denomination: '',
        location: { city, state, address: '' },
        stats: { memberCount: 0, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
        teams: [],
        teamScores: {},
        admins: [],
        isExternal: false,
      } as Church;
      const resolvedChurch = await dbService.joinChurch(currentUserId, createdChurch as any);
      showNotification(`Perfil de ${resolvedChurch.name} criado e vinculado.`, 'success');
      navigate(`/social/igreja/${resolvedChurch.slug}`);
    } catch (e) {
      reportChurchActionError('Erro ao criar igreja pela busca:', e);
      showNotification('Nao foi possivel criar o perfil desta igreja.', 'error');
    } finally {
      setActionChurchId(null);
    }
  };

  const loadMore = async () => {
    const term = searchQuery.trim();
    const city = cityQuery.trim();
    const state = stateQuery.trim().toUpperCase();
    if (!term && !city && !state) return;
    if (!nextPageToken && nextOffset === null) return;

    setIsLoadingMore(true);
    try {
      const page = await dbService.searchChurchesPage(term, city, state, {
        includeExternal: true,
        pageToken: nextPageToken,
        offset: nextOffset ?? 0,
        limit: 10,
      });
      setChurches((current) => {
        const seen = new Set(current.map((church) => `${church.externalProvider || 'local'}:${church.externalPlaceId || church.id}`));
        const additions = page.results.filter((church) => {
          const key = `${church.externalProvider || 'local'}:${church.externalPlaceId || church.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return [...current, ...additions];
      });
      setNextPageToken(page.nextPageToken);
      setNextOffset(page.nextOffset);
    } catch (e) {
      reportChurchActionError('Erro ao carregar mais igrejas:', e);
      showNotification('Nao foi possivel carregar mais igrejas.', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const openChurchProfile = async (church: Church) => {
    if (!church.isExternal) {
      navigate(`/social/igreja/${church.slug}`);
      return;
    }

    if (!currentUserId) {
      openLogin('/social/igrejas');
      showNotification('Entre para abrir o perfil desta igreja no BibliaLM.', 'info');
      return;
    }

    setActionChurchId(church.id);
    try {
      const resolvedChurch = await dbService.resolveChurchForMembership(currentUserId, church as any);
      navigate(`/social/igreja/${resolvedChurch.slug}`);
    } catch (e) {
      reportChurchActionError('Erro ao importar igreja:', e);
      showNotification('Nao foi possivel abrir o perfil desta igreja.', 'error');
    } finally {
      setActionChurchId(null);
    }
  };

  const joinChurch = async (event: React.MouseEvent, church: Church) => {
    event.stopPropagation();
    const isCurrentMember = !church.isExternal && currentChurchId === church.id;
    if (isCurrentMember) {
      navigate(`/social/igreja/${church.slug || currentChurchSlug}`);
      return;
    }
    if (!currentUserId) {
      openLogin('/social/igrejas');
      showNotification('Entre para marcar que voce e membro desta igreja.', 'info');
      return;
    }

    setActionChurchId(church.id);
    try {
      const resolvedChurch = await dbService.joinChurch(currentUserId, church as any);
      showNotification(`Voce agora esta vinculado a ${resolvedChurch.name}.`, 'success');
      navigate(`/social/igreja/${resolvedChurch.slug}`);
    } catch (e) {
      reportChurchActionError('Erro ao vincular igreja:', e);
      showNotification('Nao foi possivel concluir o vinculo.', 'error');
    } finally {
      setActionChurchId(null);
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">
      <SEO title="Igrejas no Reino" description="Explore igrejas e comunidades cadastradas no BibliaLM." />
      {isSocialMode && <SocialNavigation activeTab="church" />}

      <div className="max-w-xl mx-auto px-4 py-8 pb-32">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Compass size={32} />
          </div>
          <h1 className="text-2xl font-serif font-black text-gray-900 dark:text-white mb-2">Comunidades de Fe</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Encontre uma igreja e veja seu perfil</p>
        </div>

        <div className="mb-8 rounded-[2rem] bg-white p-3 shadow-sm border border-gray-100 dark:bg-bible-darkPaper dark:border-gray-800">
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nome da igreja"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 ring-bible-gold transition-all font-bold"
            />
          </div>
          <div className="grid grid-cols-[1fr_82px] gap-3">
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cidade"
              className="min-w-0 px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 ring-bible-gold transition-all text-sm font-bold"
            />
            <input
              type="text"
              value={stateQuery}
              onChange={(e) => setStateQuery(e.target.value.toUpperCase().slice(0, 2))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="UF"
              className="px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 ring-bible-gold transition-all text-sm font-black uppercase text-center"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-3 w-full min-h-12 rounded-2xl bg-bible-leather px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:opacity-90 disabled:opacity-50 dark:bg-bible-gold dark:text-black"
          >
            {loading ? 'Buscando...' : 'Buscar igrejas'}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-bible-gold mb-4" size={32} />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Buscando comunidades...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {churches.map((church) => {
              const isCurrentMember = !church.isExternal && currentChurchId === church.id;
              return (
              <div
                key={church.id}
                onClick={() => openChurchProfile(church)}
                className={`bg-white dark:bg-bible-darkPaper p-4 rounded-[2rem] border shadow-sm flex items-center gap-4 hover:border-bible-gold transition-all active:scale-[0.98] cursor-pointer group ${isCurrentMember ? 'border-bible-gold/60 ring-2 ring-bible-gold/10' : 'border-gray-100 dark:border-gray-800'}`}
              >
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {church.logoUrl ? (
                    <img src={church.logoUrl} className="w-full h-full object-cover" alt={church.name} />
                  ) : (
                    <Shield size={24} className="text-gray-200 dark:text-gray-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{church.name}</h3>
                    {church.isExternal && (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-black uppercase text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">Web</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    <MapPin size={12} className="text-bible-gold" />
                    {[church.location?.city, church.location?.state].filter(Boolean).join(', ') || 'Localizacao pendente'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {church.stats?.memberCount || 0} Membros
                    </span>
                    <span className="text-[9px] font-black text-purple-500 uppercase tracking-tighter bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                      {church.stats?.totalMana || 0} Vitalidade
                    </span>
                    {church.isExternal && (
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                        Perfil sera criado ao abrir
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={(event) => joinChurch(event, church)}
                    disabled={actionChurchId === church.id}
                    className={`min-h-9 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-60 ${isCurrentMember ? 'bg-bible-gold text-white' : 'bg-bible-gold/10 text-bible-gold hover:bg-bible-gold hover:text-white'}`}
                  >
                    {actionChurchId === church.id ? <Loader2 size={14} className="animate-spin" /> : <span className="flex items-center gap-1"><CheckCircle2 size={12} fill={isCurrentMember ? 'currentColor' : 'none'} /> {isCurrentMember ? 'Minha igreja' : 'Sou membro'}</span>}
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 group-hover:text-bible-gold group-hover:bg-bible-gold/10 transition-all">
                    {actionChurchId === church.id ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={20} />}
                  </div>
                </div>
              </div>
              );
            })}

            {churches.some((church) => church.sourceAttribution) && (
              <p className="px-2 text-center text-[10px] font-medium text-gray-400">
                Resultados externos podem usar Google Places ou Data (c) OpenStreetMap contributors.
              </p>
            )}

            {(nextPageToken || nextOffset !== null) && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full min-h-12 rounded-2xl border border-bible-gold/20 bg-white text-xs font-black uppercase tracking-widest text-bible-gold shadow-sm transition-all hover:bg-bible-gold hover:text-white disabled:opacity-60 dark:bg-bible-darkPaper"
              >
                {isLoadingMore ? (
                  <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Carregando mais 10</span>
                ) : (
                  'Carregar mais 10'
                )}
              </button>
            )}

            {churches.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
                <Search size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-500 font-bold">Nenhuma igreja encontrada</p>
                <p className="text-[10px] text-gray-400 uppercase font-black mt-1">Tente nome, cidade e UF</p>
                {hasSearched && searchQuery.trim() && cityQuery.trim() && stateQuery.trim() && (
                  <button
                    onClick={createChurchFromSearch}
                    disabled={actionChurchId === 'manual-create'}
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-bible-gold px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                  >
                    {actionChurchId === 'manual-create' ? <Loader2 size={16} className="animate-spin" /> : 'Criar perfil desta igreja'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChurchesListPage;
