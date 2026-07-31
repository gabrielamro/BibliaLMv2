"use client";
import { useNavigate, useLocation } from '../../utils/router';
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/supabase';
import { Church } from '../../types';
import {
  CheckCircle2,
  ChevronRight,
  Church as ChurchIcon,
  Loader2,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Users,
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
    <div data-module="kingdom" className="h-full overflow-y-auto bg-[#fdfbf7] text-[#2d2a26] dark:bg-[#0b0b0c] dark:text-gray-100">
      <SEO title="Igrejas no Reino" description="Explore igrejas e comunidades cadastradas no BibliaLM." />
      {isSocialMode && <SocialNavigation activeTab="church" />}

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">
        <section className="module-gradient relative overflow-hidden rounded-[1.5rem] px-5 py-4 text-white shadow-[0_12px_35px_rgba(91,42,134,0.16)] sm:px-6">
          <div aria-hidden="true" className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-orange-200/15 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="max-w-2xl">
              <span className="hidden">
                <Sparkles size={13} /> Reino Culto+
              </span>
              <h1 className="text-xl font-black tracking-[-0.03em] sm:text-2xl">Igrejas</h1>
              <p className="hidden">
                Descubra igrejas, acompanhe o que acontece perto de você e fortaleça vínculos de fé.
              </p>
            </div>
            {currentChurchSlug ? (
              <button
                type="button"
                onClick={() => navigate(`/social/igreja/${currentChurchSlug}`)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black uppercase tracking-[0.08em] text-[#5b2a86] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#fff4f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ChurchIcon size={16} /> Abrir minha igreja
              </button>
            ) : null}
          </div>
          <nav aria-label="Atalhos do Reino" className="relative mt-3 flex gap-1.5 overflow-x-auto border-t border-white/10 pt-3 no-scrollbar">
            <button type="button" onClick={() => navigate('/social')} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold text-white/90 transition hover:bg-white/10"><Users size={15} /> Feed</button>
            <span aria-current="page" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-black text-[#5b2a86]"><ChurchIcon size={15} /> Igrejas</span>
            <button type="button" onClick={() => navigate('/social/explore')} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold text-white/90 transition hover:bg-white/10"><Search size={15} /> Explorar</button>
          </nav>
        </section>

        <section aria-labelledby="church-search-title" className="mt-5 rounded-[1.5rem] border border-[#eadde8] bg-white p-4 shadow-[0_8px_30px_rgba(91,42,134,0.06)] dark:border-white/10 dark:bg-[#151515] sm:p-5">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-700 dark:text-fuchsia-300">Buscar comunidades</p>
            <h2 id="church-search-title" className="mt-1 text-xl font-black tracking-tight">Qual igreja você procura?</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,.7fr)_90px_auto]">
            <label className="relative block">
              <span className="sr-only">Nome da igreja</span>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fuchsia-700/60" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nome da igreja"
                className="min-h-12 w-full rounded-xl border border-[#e9e1e8] bg-[#fbf8fa] pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-200 dark:border-white/10 dark:bg-white/5 dark:focus:ring-fuchsia-500/20"
            />
            </label>
            <label>
              <span className="sr-only">Cidade</span>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cidade"
                className="min-h-12 w-full rounded-xl border border-[#e9e1e8] bg-[#fbf8fa] px-4 text-sm font-semibold outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-200 dark:border-white/10 dark:bg-white/5 dark:focus:ring-fuchsia-500/20"
            />
            </label>
            <label>
              <span className="sr-only">Estado</span>
            <input
              type="text"
              value={stateQuery}
              onChange={(e) => setStateQuery(e.target.value.toUpperCase().slice(0, 2))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="UF"
                maxLength={2}
                className="min-h-12 w-full rounded-xl border border-[#e9e1e8] bg-[#fbf8fa] px-3 text-center text-sm font-black uppercase outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-200 dark:border-white/10 dark:bg-white/5 dark:focus:ring-fuchsia-500/20"
            />
            </label>
          <button
            onClick={handleSearch}
            disabled={loading}
              className="module-gradient inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Buscando</> : <><Search size={16} /> Buscar</>}
          </button>
        </div>
        </section>

        {loading ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-[1.5rem] border border-[#eadde8] bg-white py-24 dark:border-white/10 dark:bg-[#151515]">
            <Loader2 className="mb-4 animate-spin text-fuchsia-700" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-800 dark:text-fuchsia-300">Buscando comunidades...</p>
          </div>
        ) : (
          <section aria-live="polite" className="mt-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-700 dark:text-fuchsia-300">{hasSearched ? 'Resultado da busca' : 'Comunidades no Reino'}</p>
                <h2 className="mt-1 text-xl font-black">{churches.length} {churches.length === 1 ? 'igreja encontrada' : 'igrejas encontradas'}</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {churches.map((church) => {
              const isCurrentMember = !church.isExternal && currentChurchId === church.id;
              return (
              <div
                key={church.id}
                onClick={() => openChurchProfile(church)}
                  className={`group flex min-h-[180px] cursor-pointer flex-col rounded-[1.5rem] border bg-white p-5 shadow-[0_8px_30px_rgba(91,42,134,0.05)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:shadow-[0_16px_40px_rgba(91,42,134,0.10)] active:scale-[0.99] dark:bg-[#151515] ${isCurrentMember ? 'border-fuchsia-400 ring-2 ring-fuchsia-500/10' : 'border-[#eadde8] dark:border-white/10'}`}
              >
                  <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 to-rose-50 dark:border-fuchsia-500/15 dark:from-fuchsia-500/10 dark:to-rose-500/10">
                  {church.logoUrl ? (
                    <img src={church.logoUrl} className="w-full h-full object-cover" alt={church.name} />
                  ) : (
                    <Shield size={24} className="text-fuchsia-300 dark:text-fuchsia-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="truncate font-black text-gray-900 dark:text-white">{church.name}</h3>
                    {church.isExternal && (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-black uppercase text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">Web</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    <MapPin size={12} className="text-fuchsia-600" />
                    {[church.location?.city, church.location?.state].filter(Boolean).join(', ') || 'Localizacao pendente'}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300">
                      {church.stats?.memberCount || 0} Membros
                    </span>
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                      {church.stats?.totalMana || 0} Vitalidade
                    </span>
                    {church.isExternal && (
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                        Perfil sera criado ao abrir
                      </span>
                    )}
                  </div>
                </div>

                  </div>
                <div className="mt-auto flex items-center gap-2 border-t border-[#f0e8ef] pt-4 dark:border-white/10">
                  <button
                    onClick={(event) => joinChurch(event, church)}
                    disabled={actionChurchId === church.id}
                      className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-60 ${isCurrentMember ? 'module-gradient text-white' : 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-500/10 dark:text-fuchsia-300'}`}
                  >
                    {actionChurchId === church.id ? <Loader2 size={14} className="animate-spin" /> : <span className="flex items-center gap-1"><CheckCircle2 size={12} fill={isCurrentMember ? 'currentColor' : 'none'} /> {isCurrentMember ? 'Minha igreja' : 'Sou membro'}</span>}
                  </button>
                    <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8f4f7] text-fuchsia-500 transition group-hover:bg-fuchsia-100 group-hover:text-fuchsia-700 dark:bg-white/5">
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

            </div>

            {(nextPageToken || nextOffset !== null) && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                  className="mt-5 min-h-12 w-full rounded-xl border border-fuchsia-200 bg-white text-xs font-black uppercase tracking-widest text-fuchsia-700 shadow-sm transition hover:bg-fuchsia-50 disabled:opacity-60 dark:border-fuchsia-500/20 dark:bg-[#151515] dark:text-fuchsia-300"
              >
                {isLoadingMore ? (
                  <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Carregando mais 10</span>
                ) : (
                  'Carregar mais 10'
                )}
              </button>
            )}

            {churches.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-fuchsia-200 bg-white py-20 text-center dark:border-fuchsia-500/20 dark:bg-[#151515]">
                <Search size={48} className="mx-auto mb-4 text-fuchsia-200" />
                <p className="text-gray-500 font-bold">Nenhuma igreja encontrada</p>
                <p className="text-[10px] text-gray-400 uppercase font-black mt-1">Tente nome, cidade e UF</p>
                {hasSearched && searchQuery.trim() && cityQuery.trim() && stateQuery.trim() && (
                  <button
                    onClick={createChurchFromSearch}
                    disabled={actionChurchId === 'manual-create'}
                      className="module-gradient mt-6 inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {actionChurchId === 'manual-create' ? <Loader2 size={16} className="animate-spin" /> : 'Criar perfil desta igreja'}
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default ChurchesListPage;
