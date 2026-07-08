"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Church,
  Copy,
  Download,
  Eye,
  HeartHandshake,
  Loader2,
  MessageSquareHeart,
  Plus,
  Printer,
  QrCode,
  Save,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchQrForm, ChurchQrFormField, ChurchQrFormType } from "../../types";
import { CHURCH_VOLUNTEER_ROLE_OPTIONS } from "../../utils/churchVolunteerCategories";

const qrFormTypes: Array<{ value: ChurchQrFormType; label: string }> = [
  { value: "prayer", label: "Pedido de oracao" },
  { value: "volunteer", label: "Voluntariado" },
  { value: "visitor", label: "Visitante" },
  { value: "pastor_care", label: "Cuidado pastoral" },
  { value: "group", label: "Entrada em grupo" },
  { value: "custom", label: "Personalizado" },
];

const defaultFieldsByType: Record<ChurchQrFormType, ChurchQrFormField[]> = {
  prayer: [
    { label: "Nome", type: "text" },
    { label: "Contato", type: "tel" },
    { label: "Pedido de oracao", type: "textarea", required: true },
  ],
  volunteer: [
    { label: "Nome", type: "text", required: true },
    { label: "Contato", type: "tel", required: true },
    { label: "Cargo de interesse", type: "select", required: true, options: CHURCH_VOLUNTEER_ROLE_OPTIONS },
    { label: "Disponibilidade", type: "textarea" },
  ],
  visitor: [
    { label: "Nome", type: "text", required: true },
    { label: "Contato", type: "tel" },
    { label: "Primeira visita?", type: "select", options: ["Sim", "Nao"] },
  ],
  pastor_care: [
    { label: "Nome", type: "text", required: true },
    { label: "Contato", type: "tel", required: true },
    { label: "Como podemos cuidar?", type: "textarea", required: true },
  ],
  group: [
    { label: "Nome", type: "text", required: true },
    { label: "Contato", type: "tel", required: true },
    { label: "Preferencia de grupo", type: "text" },
  ],
  custom: [
    { label: "Nome", type: "text" },
    { label: "Contato", type: "tel" },
    { label: "Mensagem", type: "textarea", required: true },
  ],
};

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function ChurchQrCodesPreview() {
  const { currentUser, userProfile } = useAuth();
  const [selectedToken, setSelectedToken] = useState("");
  const [origin, setOrigin] = useState("http://localhost:3010");
  const [copied, setCopied] = useState(false);
  const [realForms, setRealForms] = useState<ChurchQrForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState<ChurchQrFormType | "Todos">("Todos");
  const [isCreating, setIsCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    formType: "prayer" as ChurchQrFormType,
    description: "",
    destination: "Inbox de cuidado",
    privacyText: "Sua resposta sera recebida pela equipe responsavel da igreja com cuidado e discricao.",
    confirmationText: "Recebemos sua mensagem. A igreja dara retorno quando houver uma proxima acao.",
  });
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.listQrForms(activeChurchId, { limit: 25 })
      .then((forms) => {
        if (!isMounted) return;
        setRealForms(forms);
        if (forms[0]?.token) setSelectedToken(forms[0].token);
      })
      .catch(() => {
        if (isMounted) setRealForms([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const displayForms = useMemo(() => {
    return realForms.map((form) => ({
      token: form.token,
      id: form.id,
      title: form.title,
      type: form.formType,
      description: form.description,
      status: form.status === "active" ? "Ativo" : form.status === "paused" ? "Pausado" : form.status === "expired" ? "Expirado" : "Rascunho",
      scans: form.scansCount,
      submissions: form.submissionsCount,
      destination: form.destination,
      privacy: form.privacyText,
      confirmation: form.confirmationText,
      icon: getQrIcon(form.formType),
    }));
  }, [realForms]);

  const selectedForm = useMemo(
    () => displayForms.find((form) => form.token === selectedToken) ?? displayForms[0],
    [displayForms, selectedToken]
  );

  const filteredForms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return displayForms.filter((form) =>
      (statusFilter === "Todos" || form.status === statusFilter) &&
      (typeFilter === "Todos" || form.type === typeFilter) &&
      (!term || [form.title, form.description, form.type, form.status, form.destination].join(" ").toLowerCase().includes(term))
    );
  }, [displayForms, search, statusFilter, typeFilter]);

  const publicUrl = selectedForm ? `${origin}/qr/${selectedForm.token}` : `${origin}/gestao-igreja/qrcodes/novo`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=${encodeURIComponent(publicUrl)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const createQrForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setCreateFeedback({ type: "error", message: "Informe um titulo para gerar o QR." });
      return;
    }
    if (!activeChurchId) {
      setCreateFeedback({ type: "info", message: "Vincule seu perfil a uma igreja para gravar novos QR Codes. Por enquanto, esta tela segue em modo preview." });
      return;
    }

    setIsCreating(true);
    setCreateFeedback(null);
    try {
      const created = await churchManagementService.createQrForm({
        churchId: activeChurchId,
        title: draft.title.trim(),
        formType: draft.formType,
        description: draft.description.trim(),
        fields: defaultFieldsByType[draft.formType],
        destination: draft.destination.trim() || "Inbox de cuidado",
        privacyText: draft.privacyText.trim(),
        confirmationText: draft.confirmationText.trim(),
        allowAnonymous: true,
        createdBy: currentUser?.id ?? currentUser?.uid ?? null,
      });
      setRealForms((forms) => [created, ...forms]);
      setSelectedToken(created.token);
      setDraft((current) => ({ ...current, title: "", description: "" }));
      setCreateFeedback({ type: "success", message: "QR criado e pronto para impressao, slide ou compartilhamento." });
    } catch (error) {
      setCreateFeedback({ type: "error", message: error instanceof Error ? error.message : "Nao foi possivel criar o QR agora." });
    } finally {
      setIsCreating(false);
    }
  };

  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: { visible: { transition: { staggerChildren: 0.05 } } },
      };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/gestao-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <QrCode size={15} className="text-[#d8b15f]" />
                QR Codes e formularios
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                Entradas publicas da igreja
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Gere QR Codes para pedidos de oracao, voluntariado, visitantes, cuidado pastoral e grupos, sempre com destino e privacidade claros.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["QR ativos", String(displayForms.filter((form) => form.status === "Ativo").length)],
                ["Scans", String(displayForms.reduce((sum, form) => sum + form.scans, 0))],
                ["Envios", String(displayForms.reduce((sum, form) => sum + form.submissions, 0))],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/15 bg-white/8 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</p>
                  <p className="mt-3 text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        {isLoading ? (
          <div className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Carregando QR Codes da igreja...
          </div>
        ) : null}
        <motion.div {...motionProps} className="grid gap-4">
          <label className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Buscar QR/formulario</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Digite titulo, tipo ou status" className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-white/10 dark:text-white" />
          </label>
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-2">
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={["Todos", "Ativo", "Pausado", "Expirado", "Rascunho"]}
            />
            <SelectFilter
              label="Tipo"
              value={typeFilter}
              onChange={(value) => setTypeFilter(value as ChurchQrFormType | "Todos")}
              options={["Todos", ...qrFormTypes.map((item) => item.value)]}
            />
          </div>
          {!isLoading && filteredForms.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="text-xl font-black">Nenhum QR cadastrado</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Crie o primeiro QR publico para receber pedidos, visitantes, voluntarios ou interesse em grupos direto na inbox.
              </p>
              <Link href="/gestao-igreja/qrcodes/novo" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                <Plus size={16} />
                Novo QR
              </Link>
            </div>
          ) : null}
          {filteredForms.map((form) => {
            const Icon = form.icon;
            const isSelected = form.token === selectedForm?.token;
            return (
              <motion.article
                key={form.token}
                variants={cardMotion}
                onClick={() => setSelectedToken(form.token)}
                role="button"
                tabIndex={0}
                className={`rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white/[0.04] ${
                  isSelected
                    ? "border-[#d8b15f] ring-2 ring-[#d8b15f]/20 dark:border-[#f4d789]"
                    : "border-slate-200 dark:border-white/10"
                }`}
              >
                <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <Icon size={21} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">{form.title}</h2>
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          {form.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{form.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-right md:w-32 md:shrink-0">
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Scans</p>
                      <p className="mt-1 text-xl font-black">{form.scans}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Envios</p>
                      <p className="mt-1 text-xl font-black">{form.submissions}</p>
                    </div>
                    <Link href={`/gestao-igreja/qrcodes/${form.id}/editar`} className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                      Editar
                    </Link>
                    <Link href={`/gestao-igreja/qrcodes/${form.id}`} className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                      Ver detalhe
                    </Link>
                    <Link href={`/gestao-igreja/qrcodes/${form.id}/imprimir`} className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                      <Printer size={14} />
                      Imprimir
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        <aside className="space-y-4">
          {!selectedForm ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Entrada publica</p>
                  <h2 className="mt-1 text-2xl font-black">Primeiro QR</h2>
                </div>
                <QrCode size={22} className="text-[#9a7a2f]" />
              </div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                A pre-visualizacao aparece aqui assim que houver um QR real cadastrado.
              </p>
              <Link href="/gestao-igreja/qrcodes/novo" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                <Plus size={16} />
                Novo QR
              </Link>
            </section>
          ) : null}
          {selectedForm ? (
          <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Preview do QR</p>
                <h2 className="mt-1 text-2xl font-black">{selectedForm.title}</h2>
              </div>
              <Sparkles size={22} className="text-[#9a7a2f]" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-4 dark:border-white/10 dark:bg-[#0f172a]">
              <img src={qrImageUrl} alt={`QR Code para ${selectedForm.title}`} className="mx-auto aspect-square w-full max-w-72 rounded-lg bg-white p-3" />
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-6 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
              {publicUrl}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <button type="button" onClick={copyLink} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
              <a href={qrImageUrl} download={`qr-${selectedForm.token}.png`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                <Download size={16} />
                Baixar
              </a>
              <Link href={`/qr/${selectedForm.token}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                <Eye size={16} />
                Abrir
              </Link>
              <Link href={`/gestao-igreja/qrcodes/${selectedForm.id}/imprimir`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                <Printer size={16} />
                Imprimir
              </Link>
            </div>
          </section>
          </>
          ) : null}

          {selectedForm ? (
          <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Novo ponto de entrada</p>
                <h2 className="mt-1 text-2xl font-black">Cadastrar QR</h2>
              </div>
              <Plus size={22} className="text-[#9a7a2f]" />
            </div>

            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              A listagem fica limpa para acompanhar QR Codes ativos. O cadastro acontece em uma tela propria com campos, validacao e retorno dedicado.
            </p>
            <Link href="/gestao-igreja/qrcodes/novo" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
              <Plus size={16} />
              Novo QR
            </Link>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-black">Privacidade e destino</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p><strong className="text-slate-900 dark:text-white">Destino:</strong> {selectedForm.destination}</p>
              <p><strong className="text-slate-900 dark:text-white">Privacidade:</strong> {selectedForm.privacy}</p>
              <p><strong className="text-slate-900 dark:text-white">Retorno:</strong> {selectedForm.confirmation}</p>
            </div>
          </section>
          </>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function getQrIcon(type: ChurchQrFormType): LucideIcon {
  const icons: Record<ChurchQrFormType, LucideIcon> = {
    prayer: MessageSquareHeart,
    volunteer: UserPlus,
    visitor: Church,
    pastor_care: HeartHandshake,
    group: Users,
    custom: QrCode,
  };
  return icons[type] ?? QrCode;
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-[#151b27] dark:text-white">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
