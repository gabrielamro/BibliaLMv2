"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Church, KeyRound, QrCode, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import type { ChurchManagementSettings } from "../../types";

const settingGroups = [
  {
    title: "Identidade e igreja ativa",
    icon: Church,
    items: ["Igreja vinculada ao usuario", "Nome/slug vindos do cadastro principal", "Multi-igreja fica para fase futura"],
  },
  {
    title: "Privacidade pastoral",
    icon: ShieldCheck,
    items: ["Pedidos sensiveis exigem papel pastoral", "Gestor nao ve cuidado sensivel automaticamente", "Membro ve apenas retorno publico"],
  },
  {
    title: "QR Codes",
    icon: QrCode,
    items: ["Formularios publicos usam token", "Validade padrao sera configuravel", "Campos avancados ficam fora do primeiro corte"],
  },
  {
    title: "Notificacoes",
    icon: Bell,
    items: ["Alertas acionaveis no dashboard", "Feedback seguro em Minha Igreja", "Preferencias granulares entram em fase futura"],
  },
  {
    title: "Permissoes",
    icon: KeyRound,
    items: ["Papel operacional separado do plano", "Escopos por igreja/equipe/grupo/culto/evento", "Revogacao em tela propria"],
  },
];

export default function ChurchSettingsPreview() {
  const { currentUser, userProfile } = useAuth();
  const churchData = userProfile?.churchData;
  const activeChurchId = churchData?.churchId;
  const [settings, setSettings] = useState<ChurchManagementSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.getSettings(activeChurchId)
      .then((data) => {
        if (isMounted) setSettings(data);
      })
      .catch(() => {
        if (isMounted) setFeedback("Nao foi possivel carregar configuracoes persistentes. Usando padroes do MVP.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const updateField = <K extends keyof ChurchManagementSettings>(key: K, value: ChurchManagementSettings[K]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  };

  const saveSettings = async () => {
    if (!activeChurchId || !settings) return;
    setIsSaving(true);
    setFeedback("");
    try {
      const saved = await churchManagementService.updateSettings(activeChurchId, {
        qrDefaultValidityDays: settings.qrDefaultValidityDays,
        defaultPrivacyText: settings.defaultPrivacyText,
        defaultConfirmationText: settings.defaultConfirmationText,
        notifyPastorsOnSensitiveRequests: settings.notifyPastorsOnSensitiveRequests,
        notifyLeadersOnVolunteerRequests: settings.notifyLeadersOnVolunteerRequests,
        memberFeedbackEnabled: settings.memberFeedbackEnabled,
        updatedBy: currentUser?.uid ?? null,
      });
      setSettings(saved);
      setFeedback("Configuracoes salvas para esta igreja.");
    } catch {
      setFeedback("Nao foi possivel salvar. Verifique se o SQL atualizado foi executado e se seu perfil tem permissao de gestor.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/gestao-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <SlidersHorizontal size={15} className="text-[#d8b15f]" />
                Configuracoes
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">Configuracoes da Igreja</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Parametros operacionais do modulo, com guarda-corpos para privacidade, papeis e custo no MVP.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/8 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Igreja ativa</p>
              <p className="mt-3 text-2xl font-black">{churchData?.churchName ?? churchData?.churchId ?? "Nao vinculada"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{churchData?.churchId ? `ID: ${churchData.churchId}` : "Vincule o perfil a uma igreja para persistir configuracoes reais."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {feedback ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 shadow-sm dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
            {feedback}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settingGroups.map((group) => {
            const Icon = group.icon;
            return (
              <article key={group.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <Icon size={22} className="text-[#9a7a2f]" />
                <h2 className="mt-4 text-xl font-black">{group.title}</h2>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {group.items.map((item) => (
                    <p key={item} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">{item}</p>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Parametros persistentes</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Preferencias usadas por QR Codes, notificacoes e retorno para o membro.
              </p>
            </div>
            <button
              type="button"
              onClick={saveSettings}
              disabled={!activeChurchId || !settings || isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#c5a059] px-4 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-[#d8b15f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          {!activeChurchId ? (
            <div className="mt-5 rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
              Vincule uma igreja ativa ao perfil para salvar configuracoes reais.
            </div>
          ) : isLoading || !settings ? (
            <div className="mt-5 rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
              Carregando configuracoes...
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <label className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Validade padrao de QR</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.qrDefaultValidityDays}
                  onChange={(event) => updateField("qrDefaultValidityDays", Number(event.target.value))}
                  className="mt-3 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#c5a059] dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
                <span className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">Entre 1 e 365 dias.</span>
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["notifyPastorsOnSensitiveRequests", "Alertar pastores em pedidos sensiveis"],
                  ["notifyLeadersOnVolunteerRequests", "Alertar lideres em voluntariado"],
                  ["memberFeedbackEnabled", "Mostrar feedback em Minha Igreja"],
                ].map(([key, label]) => (
                  <label key={key} className="flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 p-4 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(settings[key as keyof ChurchManagementSettings])}
                      onChange={(event) => updateField(key as keyof ChurchManagementSettings, event.target.checked as never)}
                      className="h-5 w-5 rounded border-slate-300 accent-[#c5a059]"
                    />
                    {label}
                  </label>
                ))}
              </div>

              <label className="lg:col-span-2 rounded-lg border border-slate-200 p-4 dark:border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Texto padrao de privacidade</span>
                <textarea
                  value={settings.defaultPrivacyText}
                  onChange={(event) => updateField("defaultPrivacyText", event.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-[#c5a059] dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="lg:col-span-2 rounded-lg border border-slate-200 p-4 dark:border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Mensagem padrao de confirmacao</span>
                <textarea
                  value={settings.defaultConfirmationText}
                  onChange={(event) => updateField("defaultConfirmationText", event.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-[#c5a059] dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </label>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
