"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList, KeyRound, QrCode, Save, Users, type LucideIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import type { ChurchManagementSettings, ChurchOperationalRole, ChurchQrFormField, ChurchQrFormType, ChurchRoleScopeType, ChurchServiceTeam } from "../../types";
import { CHURCH_VOLUNTEER_ROLE_OPTIONS, CHURCH_VOLUNTEER_CATEGORIES } from "../../utils/churchVolunteerCategories";

type CreateKind = "qrcode" | "designacao" | "equipe" | "permissao";

const configs: Record<CreateKind, { back: string; eyebrow: string; title: string; description: string; icon: LucideIcon }> = {
  qrcode: {
    back: "/gestao-igreja/qrcodes",
    eyebrow: "Novo QR/formulario",
    title: "Cadastrar QR Code",
    description: "Crie um ponto de entrada publico para pedidos, voluntariado, visitantes, cuidado pastoral ou grupos.",
    icon: QrCode,
  },
  designacao: {
    back: "/gestao-igreja/designacoes",
    eyebrow: "Nova escala",
    title: "Escalar time ou voluntario",
    description: "Monte uma escala por culto, evento, time ou usuario individual, com aceite do voluntario e retorno visivel para o membro.",
    icon: ClipboardList,
  },
  equipe: {
    back: "/gestao-igreja/equipes",
    eyebrow: "Nova equipe",
    title: "Cadastrar equipe",
    description: "Crie uma equipe operacional para organizar lideres, voluntarios, capacidade e futuras designacoes.",
    icon: Users,
  },
  permissao: {
    back: "/gestao-igreja/permissoes",
    eyebrow: "Nova permissao",
    title: "Conceder papel",
    description: "Atribua um papel operacional separado do plano comercial, com escopo claro e guarda-corpos.",
    icon: KeyRound,
  },
};

const qrTypes: Array<{ value: ChurchQrFormType; label: string }> = [
  { value: "prayer", label: "Pedido de oracao" },
  { value: "volunteer", label: "Voluntariado" },
  { value: "visitor", label: "Visitante" },
  { value: "pastor_care", label: "Cuidado pastoral" },
  { value: "group", label: "Entrada em grupo" },
  { value: "custom", label: "Personalizado" },
];

const roleOptions: Array<{ value: ChurchOperationalRole; label: string }> = [
  { value: "church_manager", label: "Gestor da Igreja" },
  { value: "pastor", label: "Pastor" },
  { value: "leader", label: "Lider" },
  { value: "volunteer", label: "Voluntario" },
];

const defaultFieldsByType: Record<ChurchQrFormType, ChurchQrFormField[]> = {
  prayer: [{ label: "Nome", type: "text" }, { label: "Contato", type: "tel" }, { label: "Pedido de oracao", type: "textarea", required: true }],
  volunteer: [{ label: "Nome", type: "text", required: true }, { label: "Contato", type: "tel", required: true }, { label: "Cargo de interesse", type: "select", required: true, options: CHURCH_VOLUNTEER_ROLE_OPTIONS }, { label: "Disponibilidade", type: "textarea" }],
  visitor: [{ label: "Nome", type: "text", required: true }, { label: "Contato", type: "tel" }, { label: "Primeira visita?", type: "select", options: ["Sim", "Nao"] }],
  pastor_care: [{ label: "Nome", type: "text", required: true }, { label: "Contato", type: "tel", required: true }, { label: "Como podemos cuidar?", type: "textarea", required: true }],
  group: [{ label: "Nome", type: "text", required: true }, { label: "Contato", type: "tel", required: true }, { label: "Preferencia de grupo", type: "text" }],
  custom: [{ label: "Nome", type: "text" }, { label: "Contato", type: "tel" }, { label: "Mensagem", type: "textarea", required: true }],
};

const volunteerCategoryOptions = [
  { value: "", label: "Todas as Categorias" },
  ...CHURCH_VOLUNTEER_CATEGORIES.map((cat) => ({ value: cat.key, label: cat.shortTitle })),
];

export default function ChurchManagementCreatePage({ kind }: { kind: CreateKind }) {
  const { currentUser, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const config = configs[kind];
  const Icon = config.icon;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? userProfile?.uid ?? null;
  const [activeChurchId, setActiveChurchId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.churchData?.churchId) {
      setActiveChurchId(userProfile.churchData.churchId);
      return;
    }
    if (!currentUserId) return;

    let isMounted = true;
    dbService.getApprovedChurchResponsibility(currentUserId).then((approved) => {
      if (isMounted && approved) {
        setActiveChurchId(approved.id);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userProfile?.churchData?.churchId, currentUserId]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [settings, setSettings] = useState<ChurchManagementSettings | null>(null);
  const [teams, setTeams] = useState<ChurchServiceTeam[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    formType: "prayer" as ChurchQrFormType,
    destination: "Inbox de cuidado",
    scopeType: "service" as ChurchRoleScopeType,
    startsAt: "",
    assigneeUserId: "",
    publicFeedback: "Voce recebeu uma designacao da igreja. Confirme sua disponibilidade para que a lideranca acompanhe.",
    area: "",
    capacity: "8",
    leaderId: "",
    functionsText: "",
    teamId: "",
    userId: "",
    role: "volunteer" as ChurchOperationalRole,
    scopeId: "",
    volunteerCategory: "",
  });

  useEffect(() => {
    if (kind !== "designacao") return;
    const serviceId = searchParams.get("serviceId");
    const teamId = searchParams.get("teamId");
    setForm((current) => ({
      ...current,
      scopeType: serviceId ? "service" : current.scopeType,
      scopeId: serviceId ?? current.scopeId,
      teamId: teamId ?? current.teamId,
      title: serviceId && !current.title ? "Escala do culto" : current.title,
    }));
  }, [kind, searchParams]);

  useEffect(() => {
    if (kind !== "designacao" || !activeChurchId) return;
    let isMounted = true;
    churchManagementService.listTeams(activeChurchId, { limit: 100 })
      .then((items) => {
        if (isMounted) setTeams(items);
      })
      .catch(() => {
        if (isMounted) setTeams([]);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, kind]);

  useEffect(() => {
    if (kind !== "qrcode" || !activeChurchId) return;
    let isMounted = true;
    churchManagementService.getSettings(activeChurchId)
      .then((data) => {
        if (isMounted) setSettings(data);
      })
      .catch(() => {
        if (isMounted) setSettings(null);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, kind]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeChurchId) {
      setFeedback({ type: "info", message: "Vincule seu perfil a uma igreja para salvar cadastros reais." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      if (kind === "qrcode") {
        let qrFields = defaultFieldsByType[form.formType];
        if (form.formType === "volunteer") {
          let roles: string[] = [];
          if (form.volunteerCategory) {
            const category = CHURCH_VOLUNTEER_CATEGORIES.find((c) => c.key === form.volunteerCategory);
            if (category) {
              roles = category.roles.map((r) => `${category.shortTitle} - ${r.label}`);
            }
          } else {
            roles = CHURCH_VOLUNTEER_ROLE_OPTIONS;
          }
          qrFields = [
            { label: "Nome", type: "text", required: true },
            { label: "Contato", type: "tel", required: true },
            { label: "Cargo de interesse", type: "select", required: true, options: roles },
            { label: "Disponibilidade", type: "textarea" },
          ];
        }

        const validityDays = settings?.qrDefaultValidityDays ?? 30;
        const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();
        await churchManagementService.createQrForm({
          churchId: activeChurchId,
          title: form.title.trim(),
          formType: form.formType,
          description: form.description.trim(),
          fields: qrFields,
          destination: form.destination.trim(),
          privacyText: settings?.defaultPrivacyText || "Sua resposta sera recebida pela equipe responsavel da igreja com cuidado e discricao.",
          confirmationText: settings?.defaultConfirmationText || "Recebemos sua mensagem. A igreja dara retorno quando houver uma proxima acao.",
          expiresAt,
          createdBy: currentUserId,
        });
      } else if (kind === "designacao") {
        await churchManagementService.createAssignment({
          churchId: activeChurchId,
          title: form.title.trim(),
          description: form.description.trim(),
          teamId: form.teamId.trim() || null,
          scopeType: form.scopeType,
          scopeId: form.scopeId.trim() || null,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          assigneeUserId: form.assigneeUserId.trim() || null,
          leaderUserId: currentUserId,
          publicFeedback: form.publicFeedback.trim(),
          createdBy: currentUserId,
        });
      } else if (kind === "equipe") {
        const description = buildTeamDescription(form.description, form.functionsText);
        const createdTeam = await churchManagementService.createTeam({
          churchId: activeChurchId,
          name: form.title.trim(),
          area: form.area.trim(),
          description,
          leaderId: form.leaderId.trim() || null,
          capacity: Number(form.capacity) || null,
          createdBy: currentUserId,
        });
        if (form.leaderId.trim()) {
          await churchManagementService.grantRole({
            churchId: activeChurchId,
            userId: form.leaderId.trim(),
            role: "leader",
            scopeType: "team",
            scopeId: createdTeam.id,
            grantedBy: currentUserId,
          });
        }
      } else {
        await churchManagementService.grantRole({
          churchId: activeChurchId,
          userId: form.userId.trim(),
          role: form.role,
          scopeType: form.scopeType,
          scopeId: form.scopeId.trim() || null,
          grantedBy: currentUserId,
        });
      }
      setFeedback({ type: "success", message: kind === "designacao" ? "Escala salva com sucesso." : "Cadastro salvo com sucesso." });
      setForm((current) => ({ ...current, title: "", description: "", userId: "", assigneeUserId: "", area: "", scopeId: "", teamId: "", leaderId: "", functionsText: "" }));
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel salvar agora." });
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
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{config.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-8 md:px-8">
        <form onSubmit={save} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-4 md:grid-cols-2">
            {kind !== "permissao" ? (
              <Field label={kind === "equipe" ? "Nome da equipe" : "Titulo"} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder={kind === "equipe" ? "Ex.: Portaria" : "Ex.: Pedido de oracao do culto"} />
            ) : (
              <Field label="ID do usuario" value={form.userId} onChange={(value) => setForm((current) => ({ ...current, userId: value }))} placeholder="UUID do usuario" />
            )}

            {kind === "qrcode" ? (
              <>
                <Select label="Tipo" value={form.formType} onChange={(value) => setForm((current) => ({ ...current, formType: value as ChurchQrFormType }))} options={qrTypes} />
                {form.formType === "volunteer" && (
                  <Select
                    label="Categoria do Voluntariado"
                    value={form.volunteerCategory || ""}
                    onChange={(value) => setForm((current) => ({ ...current, volunteerCategory: value }))}
                    options={volunteerCategoryOptions}
                  />
                )}
              </>
            ) : null}

            {kind === "permissao" ? (
              <Select label="Papel" value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value as ChurchOperationalRole }))} options={roleOptions} />
            ) : null}

            {kind === "designacao" || kind === "permissao" ? (
              <Select label="Escopo" value={form.scopeType} onChange={(value) => setForm((current) => ({ ...current, scopeType: value as ChurchRoleScopeType }))} options={["church", "team", "group", "service", "event"].map((value) => ({ value, label: getScopeLabel(value as ChurchRoleScopeType) }))} />
            ) : null}

            {kind === "designacao" ? (
              <>
                <Select label="Time da escala" value={form.teamId} onChange={(value) => setForm((current) => ({ ...current, teamId: value }))} options={[{ value: "", label: "Sem time / usuario individual" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]} />
                <Field label="Data" type="datetime-local" value={form.startsAt} onChange={(value) => setForm((current) => ({ ...current, startsAt: value }))} />
                <Field label="ID do voluntario" value={form.assigneeUserId} onChange={(value) => setForm((current) => ({ ...current, assigneeUserId: value }))} placeholder="Opcional; vazio escala apenas o time" />
                <Field label="ID do culto/evento" value={form.scopeId} onChange={(value) => setForm((current) => ({ ...current, scopeId: value }))} placeholder="Preenchido automaticamente ao vir do card do culto" />
              </>
            ) : null}

            {kind === "equipe" ? (
              <>
                <Field label="Area" value={form.area} onChange={(value) => setForm((current) => ({ ...current, area: value }))} placeholder="Ex.: Recepcao e fluxo" />
                <Field label="Capacidade" type="number" value={form.capacity} onChange={(value) => setForm((current) => ({ ...current, capacity: value }))} />
                <Field label="ID do lider principal" value={form.leaderId} onChange={(value) => setForm((current) => ({ ...current, leaderId: value }))} placeholder="Opcional; UUID do lider" />
              </>
            ) : null}

            {kind === "qrcode" ? (
              <Field label="Destino interno" value={form.destination} onChange={(value) => setForm((current) => ({ ...current, destination: value }))} />
            ) : null}

            {kind === "permissao" ? (
              <Field label="ID do escopo" value={form.scopeId} onChange={(value) => setForm((current) => ({ ...current, scopeId: value }))} placeholder="Opcional para igreja" />
            ) : null}
          </div>

          {kind !== "permissao" ? (
            <label className="mt-4 block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Descricao</span>
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>
          ) : null}

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
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Esta etapa usa a descricao estruturada ate a migration dedicada de funcoes/vagas ser aplicada.</p>
            </label>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950">
              <Save size={16} />
              {saving ? "Salvando" : "Salvar"}
            </button>
            <Link href={config.back} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">Cancelar</Link>
          </div>

          {feedback ? <p className={`mt-4 rounded-lg border p-3 text-sm font-semibold ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : feedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{feedback.message}</p> : null}
        </form>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-white/10 dark:text-white" />
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

function getScopeLabel(scope: ChurchRoleScopeType) {
  const labels: Record<ChurchRoleScopeType, string> = {
    church: "Igreja",
    team: "Equipe",
    group: "Grupo",
    service: "Culto",
    event: "Evento",
  };
  return labels[scope];
}

function buildTeamDescription(description: string, functionsText: string) {
  const trimmedDescription = description.trim();
  const functions = functionsText.trim();
  if (!functions) return trimmedDescription;
  return [trimmedDescription, "Funcoes esperadas:", functions].filter(Boolean).join("\n\n");
}
