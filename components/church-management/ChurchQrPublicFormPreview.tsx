"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Church,
  Loader2,
  MapPin,
  MessageSquareHeart,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { Church as ChurchType, ChurchQrForm, ChurchQrFormType } from "../../types";
import { extractQrSubmitterFields } from "../../utils/churchManagementRules";
import CultoPlusBrand from "../CultoPlusBrand";

const formTypeIcons: Record<ChurchQrFormType, LucideIcon> = {
  prayer: MessageSquareHeart,
  volunteer: UserPlus,
  visitor: Church,
  pastor_care: ShieldCheck,
  group: Users,
  custom: Sparkles,
};

export default function ChurchQrPublicFormPreview({ form }: { form: ChurchQrForm }) {
  const { currentUser, userProfile, openLogin, updateProfile } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitMode, setSubmitMode] = useState<"real" | "preview">("preview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [invitingChurch, setInvitingChurch] = useState<ChurchType | null>(null);
  const [isChurchCardLoading, setIsChurchCardLoading] = useState(true);
  const [isChurchMember, setIsChurchMember] = useState(false);
  const [isFollowingChurch, setIsFollowingChurch] = useState(false);
  const [teamLeaderName, setTeamLeaderName] = useState<string | null>(null);
  const [churchAction, setChurchAction] = useState<"follow" | "join" | null>(null);
  const [churchActionFeedback, setChurchActionFeedback] = useState("");
  const Icon = formTypeIcons[form.formType] ?? Sparkles;
  const isPreview = form.churchId === "preview";
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? null;
  const publicFields = form.fields.filter((field) => !isTeamField(field.label));
  const teamFunctions = extractTeamFunctions(form.description);
  const destinationTeamId = getTeamIdFromDestination(form.destination);
  const requiresChurchMembership = form.formType === "volunteer" && !isPreview;
  const canSubmitVolunteerApplication = !requiresChurchMembership || (Boolean(currentUserId) && isChurchMember && !isChurchCardLoading);

  useEffect(() => {
    if (isPreview) {
      setIsChurchCardLoading(false);
      setTeamLeaderName(null);
      return;
    }
    let active = true;
    setIsChurchCardLoading(true);
    Promise.all([
      dbService.getChurchById(form.churchId),
      currentUserId ? churchManagementService.isChurchMember(form.churchId, currentUserId).catch(() => false) : Promise.resolve(false),
      currentUserId ? dbService.isFollowingChurch(currentUserId, form.churchId).catch(() => false) : Promise.resolve(false),
      destinationTeamId
        ? churchManagementService.getTeamPublicLeaderName(form.churchId, destinationTeamId).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([church, member, following, leaderName]) => {
        if (!active) return;
        setInvitingChurch(church);
        setIsChurchMember(member);
        setIsFollowingChurch(following);
        setTeamLeaderName(leaderName);
      })
      .catch(() => {
        if (!active) return;
        setInvitingChurch(null);
        setIsChurchMember(false);
        setIsFollowingChurch(false);
        setTeamLeaderName(null);
      })
      .finally(() => {
        if (active) setIsChurchCardLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUserId, destinationTeamId, form.churchId, isPreview]);

  const requireChurchActionAuth = () => {
    if (currentUserId) return true;
    openLogin(typeof window !== "undefined" ? window.location.pathname : undefined);
    return false;
  };

  const handleFollowChurch = async () => {
    if (!invitingChurch || isFollowingChurch || !requireChurchActionAuth() || !currentUserId) return;
    setChurchAction("follow");
    setChurchActionFeedback("");
    try {
      await dbService.followChurch(currentUserId, invitingChurch.id, userProfile, invitingChurch);
      setIsFollowingChurch(true);
      setChurchActionFeedback(`Agora você segue ${invitingChurch.name}.`);
    } catch (error) {
      setChurchActionFeedback(error instanceof Error ? error.message : "Não foi possível seguir esta igreja.");
    } finally {
      setChurchAction(null);
    }
  };

  const handleJoinChurch = async () => {
    if (!invitingChurch || isChurchMember || !requireChurchActionAuth() || !currentUserId) return;
    setChurchAction("join");
    setChurchActionFeedback("");
    try {
      const church = await dbService.joinChurch(currentUserId, invitingChurch);
      await updateProfile({
        churchData: {
          churchId: church.id,
          churchName: church.name,
          churchSlug: church.slug,
          isAnonymous: false,
        },
      });
      setIsChurchMember(true);
      setChurchActionFeedback(`Agora você é membro de ${church.name}.`);
    } catch (error) {
      setChurchActionFeedback(error instanceof Error ? error.message : "Não foi possível criar o vínculo com esta igreja.");
    } finally {
      setChurchAction(null);
    }
  };

  const submitPayload = async (payload: Record<string, string>, userId: string | null) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (!isPreview) {
        const submitter = extractQrSubmitterFields(payload);
        await churchManagementService.submitQrForm({
          form,
          submitterUserId: userId,
          submitterName: submitter.submitterName || userProfile?.displayName || null,
          submitterContact: submitter.submitterContact || null,
          payload,
        });

        setSubmitMode("real");
      } else {
        setSubmitMode("preview");
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Nao foi possivel salvar seu pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requiresChurchMembership && !currentUserId) {
      setSubmitError("Entre na sua conta e torne-se membro desta igreja para enviar sua candidatura.");
      openLogin(typeof window !== "undefined" ? window.location.pathname : undefined);
      return;
    }
    if (requiresChurchMembership && !isChurchMember) {
      setSubmitError("Você precisa ser membro desta igreja para se candidatar como voluntário.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
    setSubmitError("");

    await submitPayload(payload, currentUserId);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] px-5 py-8 text-slate-950 dark:bg-[#05070b] dark:text-white">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 size={26} />
            </div>
            <h1 className="text-3xl font-black">Recebido com cuidado</h1>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{form.confirmationText}</p>
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
              {submitMode === "real"
                ? "Seu envio foi registrado e podera aparecer em Minha Igreja quando houver identificacao suficiente e vinculo com a igreja."
                : "Este prototipo ainda nao salvou dados reais neste ambiente. Quando o banco estiver aplicado, este envio caira na Inbox da igreja."}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {currentUserId ? (
                <Link href="/minha-igreja#acompanhamento" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                  Ver acompanhamento
                </Link>
              ) : (
                <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                  Voltar ao BibliaLM
                </Link>
              )}
              <button type="button" onClick={() => setSubmitted(false)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                Enviar outro
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf8f3] text-slate-950 dark:bg-[#08060b] dark:text-white">
      <a href="#candidatura" className="sr-only fixed left-3 top-3 z-[200] rounded-lg bg-white px-4 py-3 font-bold text-[#321b50] focus:not-sr-only">
        Ir para a candidatura
      </a>

      <header className="sticky top-0 z-50 border-b border-[#eadfd2] bg-[#fffdf9]/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#100c15]/95">
        <nav aria-label="Navegacao do convite" className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5 md:min-h-20 md:gap-5 md:px-8 lg:px-10">
          <Link href="/" aria-label="Ir para o inicio do BibliaLM" className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d36a3] focus-visible:ring-offset-2">
            <CultoPlusBrand className="!h-10 !rounded-lg sm:!h-11 md:!h-14" />
          </Link>
          <div className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex dark:text-slate-300">
            <a href="#convite" className="transition hover:text-[#6d36a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d36a3]">O convite</a>
            <a href="#como-funciona" className="transition hover:text-[#6d36a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d36a3]">Como funciona</a>
            {teamFunctions.length > 0 ? <a href="#funcoes" className="transition hover:text-[#6d36a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d36a3]">Funcoes</a> : null}
          </div>
          <a href="#candidatura" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#321b50] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#4d2878] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d36a3] focus-visible:ring-offset-2 sm:px-4 sm:text-sm">
            <span className="sm:hidden">Candidatar</span>
            <span className="hidden sm:inline">Quero servir</span>
          </a>
        </nav>
      </header>

      <section id="convite" className="relative overflow-hidden bg-gradient-to-br from-[#25133f] via-[#442263] to-[#762c57] text-white">
        <div aria-hidden="true" className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#ffb422]/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-36 left-[35%] h-80 w-80 rounded-full bg-[#ed4160]/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-5 md:gap-9 md:px-8 md:py-14 lg:grid-cols-[1.18fr_0.82fr] lg:items-center lg:px-10 lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 ring-1 ring-white/15">
              <Sparkles size={14} />
              Um convite para servir
            </div>
            <div className="mt-5 flex items-start gap-3 sm:mt-6 sm:gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#442263] shadow-lg ring-1 ring-white/70 sm:h-14 sm:w-14 sm:rounded-2xl">
                <Icon size={23} />
              </span>
              <div>
                <p className="text-xs font-bold text-[#ffd88a] sm:text-sm">Voce pode fazer parte da equipe de</p>
                <h1 className="mt-1 text-3xl font-black leading-[1.04] tracking-tight sm:text-4xl md:text-6xl">{getTeamTitle(form.title)}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-purple-100 sm:text-sm">
                  <UserRound size={15} className="shrink-0 text-[#ffd88a]" />
                  <span>Líder responsável:</span>
                  <strong className="truncate text-white">{teamLeaderName || "Ainda não definido"}</strong>
                </p>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">{form.description || "Existe um lugar para você servir, crescer e cuidar de pessoas junto com a igreja."}</p>
              </div>
            </div>
            {currentUserId ? (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15">
                <CheckCircle2 size={15} className="text-emerald-300" />
                Seus dados já serão preenchidos no formulário.
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md sm:rounded-[2rem] sm:p-6 md:p-7">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb422] text-[#321b50] shadow-lg sm:mb-5 sm:h-11 sm:w-11 sm:rounded-2xl"><Users size={20} /></div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Sua participação importa</p>
            <p className="mt-3 text-xl font-black leading-8">Sirva com propósito e faça parte do que Deus está fazendo.</p>
            <div className="mt-4 grid gap-2.5 text-xs font-semibold text-slate-200 sm:mt-5 sm:gap-3 sm:text-sm">
              <p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-emerald-300" /> Descubra onde você pode contribuir.</p>
              <p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-emerald-300" /> A liderança recebe seu interesse.</p>
              <p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-emerald-300" /> Aguarde o próximo passo da equipe.</p>
            </div>
          </div>
        </div>
      </section>

      {(isChurchCardLoading || invitingChurch) ? (
        <section aria-label="Igreja responsável pelo convite" className="relative z-10 mx-auto -mb-1 -mt-5 max-w-3xl px-4 sm:px-5 md:-mt-7">
          <div className="rounded-3xl border border-[#eadfd2] bg-white p-4 shadow-xl shadow-[#321b50]/10 dark:border-white/10 dark:bg-[#15111a] sm:p-5">
            {isChurchCardLoading ? (
              <div className="flex min-h-20 items-center gap-4" aria-label="Carregando igreja">
                <span className="h-14 w-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/10" />
                <div className="grid flex-1 gap-2">
                  <span className="h-3 w-28 animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                  <span className="h-5 w-48 max-w-full animate-pulse rounded bg-slate-100 dark:bg-white/10" />
                </div>
              </div>
            ) : invitingChurch ? (
              <>
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  {invitingChurch.logoUrl ? (
                    <img src={invitingChurch.logoUrl} alt={`Logo da igreja ${invitingChurch.name}`} loading="lazy" className="h-14 w-14 shrink-0 rounded-2xl border border-slate-100 bg-white object-cover shadow-sm sm:h-16 sm:w-16" />
                  ) : (
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-[#6d36a3] ring-1 ring-purple-100 dark:bg-purple-400/10 dark:text-purple-200 dark:ring-purple-300/20 sm:h-16 sm:w-16">
                      <Church size={27} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6d36a3] dark:text-purple-300">Convite de</p>
                    <h2 className="mt-1 truncate text-base font-black text-slate-950 dark:text-white sm:text-lg">{invitingChurch.name}</h2>
                    {(invitingChurch.location?.city || invitingChurch.location?.state) ? (
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <MapPin size={13} className="shrink-0" />
                        {[invitingChurch.location?.city, invitingChurch.location?.state].filter(Boolean).join(" - ")}
                      </p>
                    ) : null}
                  </div>
                  {isChurchMember ? (
                    <span className="hidden min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-700 sm:inline-flex dark:bg-emerald-400/10 dark:text-emerald-200">
                      <UserRoundCheck size={16} /> Membro
                    </span>
                  ) : null}
                </div>

                {isChurchMember ? (
                  <div className="mt-3 flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-700 sm:hidden dark:bg-emerald-400/10 dark:text-emerald-200">
                    <UserRoundCheck size={16} /> Você já é membro desta igreja
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <button type="button" onClick={() => void handleFollowChurch()} disabled={churchAction !== null || isFollowingChurch} aria-busy={churchAction === "follow"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9cbe8] px-3 text-xs font-black text-[#5b2d87] transition hover:bg-purple-50 disabled:cursor-default disabled:opacity-70 dark:border-purple-300/25 dark:text-purple-200 dark:hover:bg-purple-400/10">
                      {churchAction === "follow" ? <Loader2 size={15} className="animate-spin" /> : isFollowingChurch ? <CheckCircle2 size={15} /> : <UserPlus size={15} />}
                      {isFollowingChurch ? "Seguindo" : "Seguir"}
                    </button>
                    <button type="button" onClick={() => void handleJoinChurch()} disabled={churchAction !== null} aria-busy={churchAction === "join"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#321b50] px-3 text-xs font-black text-white transition hover:bg-[#4d2878] disabled:opacity-70">
                      {churchAction === "join" ? <Loader2 size={15} className="animate-spin" /> : <Church size={15} />}
                      Tornar-se membro
                    </button>
                  </div>
                )}
                {churchActionFeedback ? <p role="status" className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{churchActionFeedback}</p> : null}
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-5 sm:py-8 md:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-6 lg:px-10 lg:py-12">
        <aside className="order-2 grid gap-4 lg:order-none lg:col-start-1 lg:row-start-1">
          <div id="como-funciona" className="scroll-mt-28 rounded-3xl border border-[#eadfd2] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Como funciona</p>
            <div className="mt-5 grid gap-4">
              <Step number="01" title="Conte um pouco sobre você" text="Preencha seus dados e conte como gostaria de servir." />
              <Step number="02" title="A igreja recebe sua candidatura" text="A liderança avaliará o melhor próximo passo com cuidado." />
              <Step number="03" title="Comece a servir" text="Você receberá orientações para fazer parte da equipe." />
            </div>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
            <ShieldCheck size={20} className="mb-3 text-emerald-700 dark:text-emerald-300" />
            {form.privacyText || "Seus dados serão tratados com cuidado pela equipe autorizada da igreja."}
          </div>
          {teamFunctions.length > 0 ? (
            <div id="funcoes" className="scroll-mt-28 rounded-3xl border border-[#eadfd2] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Onde você pode servir</p>
              <div className="mt-4 grid gap-2">
                {teamFunctions.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.06]">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{item.name}</span>
                    {item.quantity ? <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{item.quantity} vaga(s)</span> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {isPreview ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">Este é um formulário demonstrativo.</div>
          ) : null}
        </aside>

        <form id="candidatura" key={`${form.id}:${currentUserId ?? "visitor"}`} onSubmit={handleSubmit} className="order-1 scroll-mt-20 rounded-3xl border border-[#eadfd2] bg-white p-4 shadow-xl shadow-[#321b50]/5 sm:p-5 md:p-8 dark:border-white/10 dark:bg-white/[0.04] lg:order-none lg:col-start-2 lg:row-start-1">
          <div className="border-b border-slate-100 pb-5 dark:border-white/10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Candidatura de voluntariado</p>
            <h2 className="mt-2 text-2xl font-black">Vamos começar?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Preencha os campos abaixo. Você pode revisar tudo antes de enviar.</p>
          </div>
          <div className="grid gap-4">
            {publicFields.map((field) => {
              const shouldMaskPhone = isPhoneContactField(field.label, field.type);
              return (
              <label key={field.label} className="grid gap-2">
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {field.label}
                  {field.required ? <span className="text-red-600"> *</span> : null}
                </span>
                {field.type === "textarea" ? (
                  <textarea name={field.label} defaultValue={getPrefilledValue(field.label, form, currentUser, userProfile)} required={field.required} rows={4} className="min-h-28 rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none transition focus:border-[#6d36a3] focus:ring-2 focus:ring-purple-100 dark:border-white/10 dark:bg-[#0f172a] dark:focus:border-purple-300" />
                ) : field.type === "select" ? (
                  <select name={field.label} defaultValue={getPrefilledValue(field.label, form, currentUser, userProfile)} required={field.required} className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-base outline-none transition focus:border-[#6d36a3] focus:ring-2 focus:ring-purple-100 dark:border-white/10 dark:bg-[#0f172a] dark:focus:border-purple-300">
                    <option value="">Selecionar</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.label}
                    defaultValue={getPrefilledValue(field.label, form, currentUser, userProfile)}
                    required={field.required}
                    type={shouldMaskPhone ? "tel" : field.type}
                    inputMode={shouldMaskPhone ? "numeric" : undefined}
                    maxLength={shouldMaskPhone ? 15 : undefined}
                    placeholder={shouldMaskPhone ? "(00) 99999-9999" : undefined}
                    onChange={shouldMaskPhone ? (event) => { event.currentTarget.value = formatBrazilianPhone(event.currentTarget.value); } : undefined}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-base outline-none transition focus:border-[#6d36a3] focus:ring-2 focus:ring-purple-100 dark:border-white/10 dark:bg-[#0f172a] dark:focus:border-purple-300"
                  />
                )}
              </label>
              );
            })}
          </div>

          {requiresChurchMembership && !isChurchCardLoading && !isChurchMember ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
              <p className="text-sm font-black">Candidatura exclusiva para membros</p>
              <p className="mt-1 text-xs font-semibold leading-5">
                {currentUserId
                  ? `Torne-se membro de ${invitingChurch?.name || "esta igreja"} antes de enviar sua candidatura.`
                  : "Entre na sua conta e confirme seu vínculo com esta igreja para continuar."}
              </p>
              <button
                type="button"
                onClick={() => currentUserId ? void handleJoinChurch() : openLogin(typeof window !== "undefined" ? window.location.pathname : undefined)}
                disabled={churchAction !== null || (Boolean(currentUserId) && !invitingChurch)}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-950 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-amber-900 disabled:opacity-60 dark:bg-amber-200 dark:text-amber-950"
              >
                {churchAction === "join" ? <Loader2 size={16} className="animate-spin" /> : currentUserId ? <Church size={16} /> : <UserRound size={16} />}
                {currentUserId ? "Tornar-se membro" : "Entrar para continuar"}
              </button>
            </div>
          ) : null}

          <button type="submit" disabled={isSubmitting || !canSubmitVolunteerApplication} aria-busy={isSubmitting || (requiresChurchMembership && isChurchCardLoading)} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#321b50] px-5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#321b50]/15 transition hover:bg-[#4d2878] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d36a3] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
            <Send size={16} />
            {isSubmitting
              ? "Enviando candidatura..."
              : requiresChurchMembership && isChurchCardLoading
                ? "Verificando vínculo..."
                : requiresChurchMembership && !currentUserId
                  ? "Entre para candidatar-se"
                  : requiresChurchMembership && !isChurchMember
                    ? "Seja membro para candidatar-se"
                    : "Candidatar-se"}
          </button>
          {submitError ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              {submitError}
            </p>
          ) : null}
          <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
            {currentUserId ? "Você poderá acompanhar o retorno pela sua conta." : "Você pode se candidatar sem login. Informe um contato para a igreja retornar."}
          </p>
        </form>
      </section>
      <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 pb-8 pt-1 text-xs font-semibold text-slate-500 md:px-8 lg:px-10 dark:text-slate-400">
        <span>Uma experiencia BibliaLM para servir com proposito.</span>
        <CultoPlusBrand compact className="!h-8 !w-8 !rounded-lg opacity-70" />
      </footer>
    </main>
  );
}

function isPhoneContactField(label: string, type: string) {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return type === "tel" || /\b(contato|telefone|celular|whatsapp|zap)\b/.test(normalized);
}

function isTeamField(label: string) {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /\b(equipe|time|team)\b/.test(normalized);
}

function extractTeamFunctions(description: string) {
  const section = description.split(/Fun(?:ções|coes) da equipe:/i)[1] || "";
  return section
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*?)(?:\s*[-:]\s*(\d+))?$/);
      return { name: match?.[1]?.trim() || line, quantity: match?.[2] ? Number(match[2]) : null };
    });
}

function getPrefilledValue(label: string, form: ChurchQrForm, currentUser: any, userProfile: any) {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(nome|name)\b/.test(normalized)) return userProfile?.displayName || currentUser?.user_metadata?.display_name || "";
  if (/\b(email|e-mail)\b/.test(normalized)) return userProfile?.email || currentUser?.email || "";
  if (/\b(contato|telefone|celular|whatsapp|zap)\b/.test(normalized)) return userProfile?.phoneNumber || "";
  if (/\b(equipe|time|team)\b/.test(normalized)) return getTeamTitle(form.title);
  return "";
}

function getTeamTitle(title: string) {
  return title.replace(/^voluntariado\s*[-:]/i, "").trim() || title;
}

function getTeamIdFromDestination(destination: string) {
  if (!destination.startsWith("team:")) return null;
  return destination.slice("team:".length).trim() || null;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#321b50] text-[10px] font-black text-white">{number}</span>
      <div>
        <p className="text-sm font-black text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function formatBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
