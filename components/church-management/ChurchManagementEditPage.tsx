"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardList, KeyRound, QrCode, Save, Trash2, Users, type LucideIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import type { ChurchAssignmentStatus, ChurchManagementStatus, ChurchOperationalRole, ChurchQrFormStatus, ChurchQrFormType, ChurchRoleScopeType } from "../../types";

type EditKind = "qrcode" | "designacao" | "equipe" | "permissao";

const configs: Record<EditKind, { back: string; eyebrow: string; title: string; icon: LucideIcon }> = {
  qrcode: { back: "/gestao-igreja/qrcodes", eyebrow: "Editar QR/formulario", title: "Editar QR Code", icon: QrCode },
  designacao: { back: "/gestao-igreja/designacoes", eyebrow: "Editar designacao", title: "Editar designacao", icon: ClipboardList },
  equipe: { back: "/gestao-igreja/equipes", eyebrow: "Editar equipe", title: "Editar equipe", icon: Users },
  permissao: { back: "/gestao-igreja/permissoes", eyebrow: "Editar permissao", title: "Editar papel operacional", icon: KeyRound },
};

export default function ChurchManagementEditPage({ kind }: { kind: EditKind }) {
  const { currentUser, userProfile } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const activeChurchId = userProfile?.churchData?.churchId ?? null;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? userProfile?.uid ?? null;
  const config = configs[kind];
  const Icon = config.icon;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    area: "",
    capacity: "",
    leaderId: "",
    functionsText: "",
    status: "active",
    formType: "prayer" as ChurchQrFormType,
    destination: "",
    scopeType: "service" as ChurchRoleScopeType,
    assigneeUserId: "",
    startsAt: "",
    publicFeedback: "",
    userId: "",
    role: "volunteer" as ChurchOperationalRole,
    scope: "",
  });

  useEffect(() => {
    if (!id) return;
    if (kind === "permissao" && !isUuid(id)) {
      setFeedback("Este card resume um papel operacional. Para editar, abra uma permissao real vinculada a um usuario.");
      return;
    }
    let isMounted = true;
    setLoading(true);
    const load = async () => {
      if (kind === "qrcode") {
        const item = await churchManagementService.getQrForm(id);
        if (!item || !isMounted) return;
        setForm((current) => ({ ...current, title: item.title, description: item.description, status: item.status, formType: item.formType, destination: item.destination }));
      } else if (kind === "designacao") {
        const item = await churchManagementService.getAssignment(id);
        if (!item || !isMounted) return;
        setForm((current) => ({
          ...current,
          title: item.title,
          description: item.description,
          status: item.status,
          scopeType: item.scopeType,
          assigneeUserId: item.assigneeUserId ?? "",
          startsAt: item.startsAt ? item.startsAt.slice(0, 16) : "",
          publicFeedback: item.publicFeedback,
        }));
      } else if (kind === "equipe") {
        const item = await churchManagementService.getTeam(id);
        if (!item || !isMounted) return;
        const parsed = parseTeamDescription(item.description);
        setForm((current) => ({
          ...current,
          title: item.name,
          description: parsed.description,
          functionsText: parsed.functionsText,
          area: item.area,
          capacity: item.capacity ? String(item.capacity) : "",
          leaderId: item.leaderId ?? "",
          status: item.status,
        }));
      } else {
        const item = await churchManagementService.getRole(id);
        if (!item || !isMounted) return;
        setForm((current) => ({ ...current, userId: item.userId, role: item.role, scopeType: item.scopeType, scope: item.scopeId ?? "", status: item.status }));
      }
    };
    load()
      .catch((error) => setFeedback(error instanceof Error ? error.message : "Nao foi possivel carregar."))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id, kind]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    setSaving(true);
    setFeedback(null);
    try {
      if (kind === "qrcode") {
        await churchManagementService.updateQrForm(id, {
          title: form.title,
          description: form.description,
          destination: form.destination,
          formType: form.formType,
          status: form.status as ChurchQrFormStatus,
        });
      } else if (kind === "designacao") {
        await churchManagementService.updateAssignment(id, {
          title: form.title,
          description: form.description,
          scopeType: form.scopeType,
          assigneeUserId: form.assigneeUserId || null,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          publicFeedback: form.publicFeedback,
          status: form.status as ChurchAssignmentStatus,
        });
      } else if (kind === "equipe") {
        const description = buildTeamDescription(form.description, form.functionsText);
        await churchManagementService.updateTeam(id, {
          name: form.title,
          description,
          area: form.area,
          capacity: Number(form.capacity) || null,
          leaderId: form.leaderId.trim() || null,
          status: form.status as ChurchManagementStatus,
        });
        if (activeChurchId && form.leaderId.trim()) {
          await churchManagementService.grantRole({
            churchId: activeChurchId,
            userId: form.leaderId.trim(),
            role: "leader",
            scopeType: "team",
            scopeId: id,
            grantedBy: currentUserId,
          });
        }
      }
      setFeedback("Alteracoes salvas com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    } finally {
      setSaving(false);
    }
  };

  const revoke = async () => {
    if (!id) return;
    if (kind === "permissao" && !isUuid(id)) {
      setFeedback("Este card resume um papel operacional. Nao ha uma permissao real para revogar aqui.");
      return;
    }
    setSaving(true);
    try {
      await churchManagementService.revokeRole(id);
      setFeedback("Permissao revogada.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel revogar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
          <Link href={config.back} className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
            <Icon size={15} className="text-[#d8b15f]" />
            {config.eyebrow}
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">{config.title}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-8 md:px-8">
        <form onSubmit={save} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          {loading ? <p className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Carregando dados...</p> : null}
          {kind === "permissao" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ReadOnly label="Usuario" value={form.userId} />
              <ReadOnly label="Papel" value={form.role} />
              <ReadOnly label="Escopo" value={form.scopeType} />
              <ReadOnly label="Status" value={form.status} />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={kind === "equipe" ? "Nome" : "Titulo"} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
                {kind === "equipe" ? <Field label="Area" value={form.area} onChange={(value) => setForm((current) => ({ ...current, area: value }))} /> : null}
                {kind === "equipe" ? <Field label="Capacidade" type="number" value={form.capacity} onChange={(value) => setForm((current) => ({ ...current, capacity: value }))} /> : null}
                {kind === "equipe" ? <Field label="ID do lider principal" value={form.leaderId} onChange={(value) => setForm((current) => ({ ...current, leaderId: value }))} /> : null}
                {kind === "qrcode" ? <Field label="Destino" value={form.destination} onChange={(value) => setForm((current) => ({ ...current, destination: value }))} /> : null}
                {kind === "designacao" ? <Field label="ID do voluntario" value={form.assigneeUserId} onChange={(value) => setForm((current) => ({ ...current, assigneeUserId: value }))} /> : null}
                {kind === "designacao" ? <Field label="Data" type="datetime-local" value={form.startsAt} onChange={(value) => setForm((current) => ({ ...current, startsAt: value }))} /> : null}
                <Select label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={getStatusOptions(kind)} />
              </div>
              <label className="mt-4 block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Descricao</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>
              {kind === "equipe" ? (
                <label className="mt-4 block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Funcoes esperadas</span>
                  <textarea
                    value={form.functionsText}
                    onChange={(event) => setForm((current) => ({ ...current, functionsText: event.target.value }))}
                    rows={4}
                    placeholder={"Uma por linha. Ex.:\nRecepcao - 4 voluntarios\nApoio - 2 voluntarios"}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </label>
              ) : null}
            </>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {kind !== "permissao" ? (
              <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950">
                <Save size={16} />
                {saving ? "Salvando" : "Salvar"}
              </button>
            ) : (
              <button type="button" onClick={revoke} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-700 px-5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-rose-800 disabled:opacity-60">
                <Trash2 size={16} />
                Revogar permissao
              </button>
            )}
            <Link href={config.back} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">Cancelar</Link>
          </div>

          {feedback ? <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">{feedback}</p> : null}
        </form>
      </section>
    </main>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-white/10 dark:text-white" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-[#151b27] dark:text-white">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function getStatusOptions(kind: EditKind) {
  if (kind === "qrcode") {
    return [
      { value: "draft", label: "Rascunho" },
      { value: "active", label: "Ativo" },
      { value: "paused", label: "Pausado" },
      { value: "expired", label: "Expirado" },
      { value: "archived", label: "Arquivado" },
    ];
  }
  if (kind === "designacao") {
    return [
      { value: "draft", label: "Rascunho" },
      { value: "pending", label: "Aguardando aceite" },
      { value: "accepted", label: "Aceita" },
      { value: "declined", label: "Recusada" },
      { value: "paused", label: "Pausada" },
      { value: "expired", label: "Expirada" },
      { value: "removed", label: "Removida" },
    ];
  }
  return [
    { value: "active", label: "Ativa" },
    { value: "paused", label: "Pausada" },
    { value: "archived", label: "Arquivada" },
  ];
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value || "Nao informado"}</p>
    </div>
  );
}

function parseTeamDescription(description: string) {
  const marker = "Funcoes esperadas:";
  const index = description.indexOf(marker);
  if (index < 0) return { description, functionsText: "" };
  return {
    description: description.slice(0, index).trim(),
    functionsText: description.slice(index + marker.length).trim(),
  };
}

function buildTeamDescription(description: string, functionsText: string) {
  const trimmedDescription = description.trim();
  const functions = functionsText.trim();
  if (!functions) return trimmedDescription;
  return [trimmedDescription, "Funcoes esperadas:", functions].filter(Boolean).join("\n\n");
}
