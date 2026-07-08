"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Church,
  Lock,
  MessageSquareHeart,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchQrForm, ChurchQrFormType } from "../../types";
import { extractQrSubmitterFields } from "../../utils/churchManagementRules";

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
  const [pendingPayload, setPendingPayload] = useState<Record<string, string> | null>(null);
  const [submitError, setSubmitError] = useState("");
  const Icon = formTypeIcons[form.formType] ?? Sparkles;
  const isPreview = form.churchId === "preview";
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? null;
  const pendingStorageKey = `biblialm.qr.pending.${form.id}`;

  useEffect(() => {
    if (!currentUserId || pendingPayload) return;
    const storedPayload = window.sessionStorage.getItem(pendingStorageKey);
    if (!storedPayload) return;
    try {
      setPendingPayload(JSON.parse(storedPayload));
    } catch {
      window.sessionStorage.removeItem(pendingStorageKey);
    }
  }, [currentUserId, pendingPayload, pendingStorageKey]);

  useEffect(() => {
    if (!pendingPayload || !currentUserId || isSubmitting) return;
    void submitPayload(pendingPayload, currentUserId);
  }, [currentUserId, isSubmitting, pendingPayload]);

  const submitPayload = async (payload: Record<string, string>, userId: string) => {
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

        if (!userProfile?.churchData?.churchId) {
          const church = await dbService.getChurchById(form.churchId).catch(() => null);
          if (church) {
            await updateProfile({
              churchData: {
                churchId: church.id,
                churchName: church.name,
                churchSlug: church.slug,
                isAnonymous: false,
              },
            });
          }
        }
        setSubmitMode("real");
      } else {
        setSubmitMode("preview");
      }
      window.sessionStorage.removeItem(pendingStorageKey);
      setPendingPayload(null);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Nao foi possivel salvar seu pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
    setSubmitError("");

    if (!currentUserId) {
      setPendingPayload(payload);
      window.sessionStorage.setItem(pendingStorageKey, JSON.stringify(payload));
      openLogin(window.location.pathname);
      return;
    }

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
              <Link href="/minha-igreja/acompanhamento" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                Ver acompanhamento
              </Link>
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
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <Link href="/" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            BibliaLM
          </Link>
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
            <Sparkles size={15} className="text-[#d8b15f]" />
            BibliaLM Igreja
          </div>
          <div className="mt-5 flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950">
              <Icon size={24} />
            </span>
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-normal">{form.title}</h1>
              <p className="mt-3 text-base leading-8 text-slate-300">{form.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-5 px-5 py-8">
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-4">
            {form.fields.map((field) => {
              const shouldMaskPhone = isPhoneContactField(field.label, field.type);
              return (
              <label key={field.label} className="grid gap-2">
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {field.label}
                  {field.required ? <span className="text-red-600"> *</span> : null}
                </span>
                {field.type === "textarea" ? (
                  <textarea name={field.label} required={field.required} rows={5} className="min-h-32 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-white/10 dark:bg-[#0f172a] dark:focus:border-white/40" />
                ) : field.type === "select" ? (
                  <select name={field.label} required={field.required} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-white/10 dark:bg-[#0f172a] dark:focus:border-white/40">
                    <option value="">Selecionar</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.label}
                    required={field.required}
                    type={shouldMaskPhone ? "tel" : field.type}
                    inputMode={shouldMaskPhone ? "numeric" : undefined}
                    maxLength={shouldMaskPhone ? 15 : undefined}
                    placeholder={shouldMaskPhone ? "(00) 99999-9999" : undefined}
                    onChange={shouldMaskPhone ? (event) => { event.currentTarget.value = formatBrazilianPhone(event.currentTarget.value); } : undefined}
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-white/10 dark:bg-[#0f172a] dark:focus:border-white/40"
                  />
                )}
              </label>
              );
            })}
          </div>

          <button type="submit" disabled={isSubmitting} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
            <Send size={16} />
            {isSubmitting ? "Salvando..." : currentUserId ? "Salvar e acompanhar" : "Entrar para salvar"}
          </button>
          {submitError ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              {submitError}
            </p>
          ) : null}
          {!currentUserId ? (
            <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
              Para acompanhar o retorno em Minha Igreja, entre ou crie sua conta antes de salvar.
            </p>
          ) : null}
        </form>

        <aside className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
          <p className="flex gap-3">
            <ShieldCheck size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
            {form.privacyText || "As informacoes enviadas serao tratadas pela equipe autorizada da igreja."}
          </p>
          {isPreview ? (
            <p className="flex gap-3">
              <Lock size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
              Este ambiente esta usando dados demonstrativos porque o banco real ainda nao retornou este formulario.
            </p>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function isPhoneContactField(label: string, type: string) {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return type === "tel" || /\b(contato|telefone|celular|whatsapp|zap)\b/.test(normalized);
}

function formatBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
