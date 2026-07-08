"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useNavigate } from "../../utils/router";
import { useAuth } from "../../contexts/AuthContext";
import { dbService } from "../../services/supabase";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Church,
  Crown,
  Loader2,
  LogIn,
  Medal,
  QrCode,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  Search,
  ChevronRight,
} from "lucide-react";
import type { Church as ChurchType } from "../../types";

export default function ChurchContractPage() {
  const { churchSlug } = useParams<{ churchSlug: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile, openLogin, showNotification } = useAuth();
  
  const [church, setChurch] = useState<ChurchType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "qrcode" | "pastoral">("dashboard");
  const [formData, setFormData] = useState({
    fullName: userProfile?.displayName || "",
    contactPhone: "",
    churchRole: "pastor",
    acceptTerms: false,
  });

  // Church search selector states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const currentUserId = currentUser?.uid || currentUser?.id;
  const decodedSlug = useMemo(() => churchSlug ? decodeURIComponent(churchSlug) : "", [churchSlug]);

  useEffect(() => {
    if (!decodedSlug) {
      setLoading(false);
      setChurch(null);
      return;
    }
    setLoading(true);
    dbService.getChurchBySlug(decodedSlug)
      .then((data) => {
        setChurch(data);
      })
      .catch((e) => {
        console.error("Erro ao carregar dados da igreja:", e);
        setChurch(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [decodedSlug]);

  // Debounced search for churches
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      setIsSearching(true);
      dbService.searchGlobalChurches(searchQuery)
        .then((res) => {
          setSearchResults(res || []);
        })
        .catch((err) => {
          console.error("Erro ao pesquisar igrejas:", err);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!church) return;
    if (!currentUserId) {
      openLogin(window.location.pathname);
      showNotification("Por favor, faça login para contratar a gestão da igreja.", "info");
      return;
    }
    if (!formData.fullName.trim() || !formData.contactPhone.trim()) {
      showNotification("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }
    if (!formData.acceptTerms) {
      showNotification("Você precisa aceitar os termos de uso e análise manual.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await dbService.requestChurchResponsibility(currentUserId, church.id, "admin");
      setSuccess(true);
      showNotification("Solicitação enviada com sucesso!", "success");
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("23505") || msg.includes("church_role_requests_church_id_user_id_requested_role_key")) {
        showNotification("Você já tem uma solicitação pendente para gerir esta igreja.", "info");
        setSuccess(true);
      } else {
        showNotification("Erro ao enviar solicitação. Tente novamente mais tarde.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070b] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-[#d8b15f]" size={40} />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-slate-400">Carregando painel premium...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white font-sans selection:bg-[#d8b15f] selection:text-black relative overflow-x-hidden pb-16">
      {/* Background Glows */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[700px] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] h-[500px] w-[500px] rounded-full bg-[#cbd5e1]/3 blur-[140px]" />
        <div className="absolute top-[10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#d8b15f]/5 blur-[180px]" />
      </div>

      {/* Church Selector Header (Replaces the top bar) */}
      <div className="mx-auto max-w-4xl px-6 pt-10 text-center relative z-50">
        {church ? (
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <Church size={14} className="text-[#d8b15f]" />
            <span className="text-xs font-bold text-slate-200">
              Você está vendo a gestão para: <strong className="text-white">{church.name}</strong>
            </span>
            <button
              onClick={() => {
                setChurch(null);
                setSearchQuery("");
                setSearchResults([]);
                navigate("/social/igreja/gerir", { replace: true });
              }}
              className="text-[10px] font-black uppercase tracking-wider text-[#d8b15f] hover:underline border-l border-white/10 pl-3"
            >
              Alterar Igreja
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-4">
              <span className="rounded-full bg-[#d8b15f] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-black">
                Selecione
              </span>
              <span className="text-[10px] font-bold text-slate-300">
                Qual igreja você deseja gerir?
              </span>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 min-h-12 focus-within:border-white focus-within:ring-2 focus-within:ring-white/10 transition">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o nome da sua igreja..."
                  className="flex-1 bg-transparent text-sm text-white outline-none border-none placeholder-slate-500"
                />
                {isSearching && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-white/10 bg-[#0c0f16] p-2 shadow-2xl text-left max-h-60 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setChurch(item);
                        setSearchQuery("");
                        setSearchResults([]);
                        navigate(`/social/igreja/${item.slug}/gerir`, { replace: true });
                      }}
                      className="w-full rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition text-left flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.location_city || item.location?.city || ""} - {item.location_state || item.location?.state || ""}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8b15f]/20 bg-[#d8b15f]/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-[#d8b15f]">
              <Sparkles size={12} />
              Gestão de Alta Performance
            </div>
            
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              O controle da sua igreja em um só lugar.
            </h1>
            
            <p className="text-base leading-8 text-slate-400 max-w-xl">
              Simplifique escalas de voluntários, acompanhe fichas de contato e organize o cuidado pastoral de <strong className="text-white">{church?.name || "sua igreja"}</strong> de forma elegante, integrada e 100% segura com o ecossistema <span className="text-[#d8b15f] font-bold">BíbliaLM</span>.
            </p>

            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <a
                href="#contratar"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#d8b15f] px-6 text-xs font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(216,177,95,0.2)] transition duration-300 hover:bg-[#c9a150] hover:scale-[1.02] active:scale-95"
              >
                Ativar 30 Dias Grátis
              </a>
              <a
                href="#funcionalidades"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/10"
              >
                Conhecer Recursos
              </a>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-white/5">
              <div>
                <p className="text-2xl font-black text-white">30 Dias</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Teste Gratuito</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#cbd5e1]">100%</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Nuvem Protegida</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#cbd5e1]">Auditoria</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Manual de Acesso</p>
              </div>
            </div>
          </div>

          {/* Interactive UI Mockup Hero */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-[#cbd5e1]/2 blur-[100px] rounded-full" />
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-950/80 p-1 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-slate-900/50 rounded-t-[1.8rem]">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                <div className="ml-4 rounded-md bg-white/5 px-3 py-1 text-[9px] text-slate-400 font-mono flex items-center gap-1">
                  <Shield size={10} className="text-emerald-400" />
                  <span>{church?.slug || "igreja"}.biblialm.com/gestao</span>
                </div>
              </div>
              <img
                src="/mockups/church_dashboard_ui.png"
                alt="Painel de Gestão da Igreja"
                className="w-full h-auto object-cover rounded-b-[1.8rem] border-t border-white/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Section (Tabs Interface) */}
      <section id="funcionalidades" className="mx-auto max-w-7xl px-6 py-20 md:px-8 border-t border-white/5 bg-gradient-to-b from-[#05070b] to-[#0c0f16]">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d8b15f]">Demonstração Dinâmica</p>
          <h2 className="text-3xl font-black md:text-5xl">Explore por Dentro da Plataforma</h2>
          <p className="text-sm leading-7 text-slate-400">
            Navegue pelas principais áreas operacionais do sistema criadas para trazer integridade e fluidez ao dia a dia da sua comunidade.
          </p>
        </div>

        {/* Tab Buttons Container */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition duration-300 border ${
              activeTab === "dashboard"
                ? "bg-[#d8b15f] text-black border-[#d8b15f]"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            Dashboard & Escalas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("qrcode")}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition duration-300 border ${
              activeTab === "qrcode"
                ? "bg-[#d8b15f] text-black border-[#d8b15f]"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            Fichas & QR Codes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pastoral")}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition duration-300 border ${
              activeTab === "pastoral"
                ? "bg-[#d8b15f] text-black border-[#d8b15f]"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            Cuidado Pastoral Restrito
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left: Tab Text Info */}
          <div className="lg:col-span-5 space-y-6">
            {activeTab === "dashboard" && (
              <>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#d8b15f]/10 text-[#d8b15f]">
                  <Users size={22} />
                </div>
                <h3 className="text-2xl font-black text-white">Dashboard Operacional & Diretório de Membros</h3>
                <p className="text-sm leading-7 text-slate-400">
                  Gerencie fiéis e voluntários de forma estruturada. Uma base paginada e leve onde você visualiza papéis operacionais, crachás e atuações de maneira imediata.
                </p>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Visualização dinâmica de taxas de participação e contatos.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Controle de escalas com aceite e recusa formal direto pela Área do Membro.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Concessão ágil de cargos específicos (líderes, ministros, técnicos).</span>
                  </li>
                </ul>
              </>
            )}

            {activeTab === "qrcode" && (
              <>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#d8b15f]/10 text-[#d8b15f]">
                  <QrCode size={22} />
                </div>
                <h3 className="text-2xl font-black text-white">Formulários & QR Codes Inteligentes</h3>
                <p className="text-sm leading-7 text-slate-400">
                  Conecte o templo físico ao painel digital. Gere códigos QR dinâmicos para projeções, totens ou folhetos impressos e receba as interações instantaneamente.
                </p>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Formulário para visitantes e integração automática na base da igreja.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Pedidos de oração ou voluntariado enviados com um único escaneamento.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Configuração de validade para evitar formulários antigos ativos.</span>
                  </li>
                </ul>
              </>
            )}

            {activeTab === "pastoral" && (
              <>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#d8b15f]/10 text-[#d8b15f]">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="text-2xl font-black text-white">Inbox Pastoral e Triagem Confidencial</h3>
                <p className="text-sm leading-7 text-slate-400">
                  Respeito e discrição absoluto. Os pedidos de aconselhamento e as notas pastorais de acompanhamento ficam sob criptografia e isolados do restante da equipe administrativa.
                </p>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Nível de acesso exclusivo para pastores e líderes seniores da igreja.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Acompanhamento integrado com feedback direto para a Área do Membro.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className="text-[#d8b15f] shrink-0 mt-0.5" />
                    <span>Organização da Inbox com marcadores de prioridade e conselheiros.</span>
                  </li>
                </ul>
              </>
            )}
          </div>

          {/* Right: Tab Image Mockup */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-white/10 bg-slate-950 p-1 shadow-2xl transition duration-500 hover:border-[#d8b15f]/30">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-slate-900/50 rounded-t-xl">
                <span className="h-2 w-2 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <div className="ml-3 rounded bg-white/5 px-2 py-0.5 text-[8px] text-slate-500 font-mono uppercase tracking-widest">Visualização em Tempo Real</div>
              </div>
              <div className="bg-slate-950 relative overflow-hidden rounded-b-xl min-h-[300px] flex items-center justify-center">
                {activeTab === "dashboard" && (
                  <img
                    src="/mockups/church_dashboard_ui.png"
                    alt="Mockup do Dashboard"
                    className="w-full h-auto object-contain transition duration-500 animate-in fade-in"
                  />
                )}
                {activeTab === "qrcode" && (
                  <img
                    src="/mockups/church_qrcode_ui.png"
                    alt="Mockup do QR Code"
                    className="w-full h-auto object-contain transition duration-500 animate-in fade-in"
                  />
                )}
                {activeTab === "pastoral" && (
                  <img
                    src="/mockups/church_pastoral_ui.png"
                    alt="Mockup da Inbox Pastoral"
                    className="w-full h-auto object-contain transition duration-500 animate-in fade-in"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription/Conversion Form Section */}
      <section id="contratar" className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-[#0c0f16] to-[#07090d] p-6 shadow-2xl relative overflow-hidden md:p-12">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[#d8b15f]/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#cbd5e1]/2 blur-3xl pointer-events-none" />
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d8b15f]/10 text-[#d8b15f]">
              <Shield size={26} />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Assine o Plano de Gestão da Igreja</h2>
            <p className="text-sm leading-6 text-slate-400">
              Solicite acesso imediato ao painel administrativo. Você receberá os primeiros <strong className="text-white">30 dias grátis</strong> para testar todas as funcionalidades na comunidade <strong className="text-white">{church?.name || "sua igreja"}</strong>.
            </p>
          </div>

          {success ? (
            <div className="mt-10 rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center max-w-xl mx-auto space-y-4 animate-in zoom-in-95">
              <CheckCircle2 className="mx-auto text-green-400" size={42} />
              <h3 className="text-xl font-bold">Solicitação de Ativação Recebida</h3>
              <p className="text-xs leading-6 text-slate-300">
                Seu cadastro para a experimentação de 30 dias foi registrado. Agora, nossa equipe de integridade fará uma <strong>análise manual de segurança</strong> para confirmar seu vínculo e legitimar as permissões.
              </p>
              <p className="text-[10px] text-slate-500">
                Assim que a validação for concluída, você receberá um e-mail/notificação com as chaves de acesso ativadas.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-xs font-black uppercase tracking-widest text-black transition hover:bg-slate-200"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : !church ? (
            <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center max-w-2xl mx-auto">
              <Church className="mx-auto text-slate-500" size={32} />
              <p className="mt-3 text-sm text-slate-400">
                Selecione uma igreja no campo de busca no topo da página para habilitar o formulário de contratação do plano de gestão.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContractSubmit} className="mt-10 max-w-2xl mx-auto space-y-6">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Seu Nome Completo</span>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nome do responsável"
                  className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition focus:border-white focus:ring-2 focus:ring-white/10"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">WhatsApp / Telefone de Contato</span>
                  <input
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition focus:border-white focus:ring-2 focus:ring-white/10"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Função Oficial na Congregação</span>
                  <select
                    value={formData.churchRole}
                    onChange={(e) => setFormData({ ...formData, churchRole: e.target.value })}
                    className="min-h-12 rounded-xl border border-white/10 bg-[#0c0f16] px-4 text-sm outline-none transition focus:border-white focus:ring-2 focus:ring-white/10 text-slate-300"
                  >
                    <option value="pastor">Pastor(a) / Líder Principal</option>
                    <option value="manager">Administrador / Secretário(a)</option>
                    <option value="volunteer_coord">Coordenador(a) de Voluntários</option>
                    <option value="other">Outro cargo autorizado</option>
                  </select>
                </label>
              </div>

              {/* Security Banner Warning */}
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex gap-3 text-xs leading-6 text-amber-300">
                <Shield className="shrink-0 mt-0.5 text-[#d8b15f]" size={18} />
                <div>
                  <p className="font-bold">Política Anti-Sequestro de Painel (Segurança BíbliaLM)</p>
                  <p className="mt-1 text-slate-400">
                    Para garantir que apenas gestores reais e devidamente autorizados administrem {church?.name || "sua igreja"}, todas as solicitações passam por verificação manual e validação externa antes de liberar as ferramentas administrativas.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 select-none cursor-pointer pt-2">
                <input
                  type="checkbox"
                  required
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 text-[#d8b15f] focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-[11px] text-slate-400 leading-normal">
                  Confirmo que sou um representante legal e autorizado de {church?.name || "sua igreja"} e concordo com a análise de integridade cadastral obrigatória para ativação do módulo de gestão no ecossistema BíbliaLM.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-black uppercase tracking-widest text-black transition hover:bg-slate-200 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                Contratar Plano de Gestão
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
