"use client";

import { useEffect, useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import type { ChurchServiceTeam } from "../../types";

type ChurchTeamCreateModalProps = {
  churchId?: string | null;
  currentUserId?: string | null;
  open: boolean;
  onClose: () => void;
  onCreated: (team: ChurchServiceTeam) => void | Promise<void>;
};

const EMPTY_DRAFT = {
  name: "",
  area: "",
  description: "",
  capacity: "8",
  leaderId: "",
  functionsText: "",
};

export default function ChurchTeamCreateModal({ churchId, currentUserId, open, onClose, onCreated }: ChurchTeamCreateModalProps) {
  const titleId = useId();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFeedback(null);
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (isCreating) return;
    setFeedback(null);
    onClose();
  };

  const createTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!churchId) {
      setFeedback("Vincule seu perfil a uma igreja para criar equipes.");
      return;
    }
    if (!draft.name.trim() || !draft.area.trim()) {
      setFeedback("Informe nome e area da equipe.");
      return;
    }

    setIsCreating(true);
    setFeedback(null);
    try {
      const createdTeam = await churchManagementService.createTeam({
        churchId,
        name: draft.name.trim(),
        area: draft.area.trim(),
        description: buildTeamDescription(draft.description, draft.functionsText),
        leaderId: draft.leaderId.trim() || null,
        capacity: Number(draft.capacity) || null,
        createdBy: currentUserId,
      });
      if (draft.leaderId.trim()) {
        await churchManagementService.grantRole({
          churchId,
          userId: draft.leaderId.trim(),
          role: "leader",
          scopeType: "team",
          scopeId: createdTeam.id,
          grantedBy: currentUserId,
        });
      }
      await onCreated(createdTeam);
      setDraft(EMPTY_DRAFT);
      onClose();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel criar a equipe.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 px-4 py-6">
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Gestao da Igreja</p>
            <h2 id={titleId} className="mt-2 text-2xl font-black text-[#071735]">Nova Equipe</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">Cadastre o time sem sair da tela atual.</p>
          </div>
          <button type="button" onClick={close} disabled={isCreating} aria-label="Fechar cadastro de equipe" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#071735] transition hover:bg-slate-50 disabled:opacity-60">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={createTeam} className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da equipe" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} placeholder="Ex.: Time Recepcao" />
            <Field label="Area" value={draft.area} onChange={(value) => setDraft((current) => ({ ...current, area: value }))} placeholder="Ex.: Acolhimento" />
            <Field label="Capacidade" type="number" value={draft.capacity} onChange={(value) => setDraft((current) => ({ ...current, capacity: value }))} />
            <Field label="ID do lider principal" value={draft.leaderId} onChange={(value) => setDraft((current) => ({ ...current, leaderId: value }))} placeholder="Opcional; UUID do lider" />
          </div>

          <TextArea label="Descricao" value={draft.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} />
          <TextArea
            label="Funcoes esperadas"
            value={draft.functionsText}
            onChange={(value) => setDraft((current) => ({ ...current, functionsText: value }))}
            placeholder={"Uma por linha. Ex.:\nRecepcao - 4 voluntarios\nApoio - 2 voluntarios"}
          />

          {feedback ? <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{feedback}</p> : null}

          <footer className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} disabled={isCreating} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-black text-[#061b49] transition hover:bg-slate-50 disabled:opacity-60">Cancelar</button>
            <button type="submit" disabled={isCreating} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#061b49] px-5 text-sm font-black text-white transition hover:bg-[#0b2b6c] disabled:cursor-not-allowed disabled:opacity-60">
              <Plus size={16} />
              {isCreating ? "Salvando" : "Criar equipe"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#061b49]" />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="mt-4 block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} placeholder={placeholder} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-[#061b49]" />
    </label>
  );
}

function buildTeamDescription(description: string, functionsText: string) {
  const trimmedDescription = description.trim();
  const functions = functionsText.trim();
  if (!functions) return trimmedDescription;
  return [trimmedDescription, "Funcoes esperadas:", functions].filter(Boolean).join("\n\n");
}
