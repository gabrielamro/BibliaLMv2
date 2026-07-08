"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Archive, ClipboardList, Edit, Inbox, KeyRound, Pause, Printer, QrCode, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import type { ChurchAssignment, ChurchFormSubmission, ChurchMemberRole, ChurchQrForm, ChurchServiceTeam } from "../../types";

type DetailKind = "qrcode" | "designacao" | "equipe" | "permissao" | "pessoa" | "inbox";

const configs: Record<DetailKind, { back: string; title: string; eyebrow: string; icon: LucideIcon; editable?: boolean }> = {
  qrcode: { back: "/gestao-igreja/qrcodes", title: "Detalhe do QR Code", eyebrow: "QR/formulario", icon: QrCode, editable: true },
  designacao: { back: "/gestao-igreja/designacoes", title: "Detalhe da designacao", eyebrow: "Atividade de servico", icon: ClipboardList, editable: true },
  equipe: { back: "/gestao-igreja/equipes", title: "Detalhe da equipe", eyebrow: "Equipe operacional", icon: Users, editable: true },
  permissao: { back: "/gestao-igreja/permissoes", title: "Detalhe da permissao", eyebrow: "Papel operacional", icon: KeyRound, editable: true },
  pessoa: { back: "/gestao-igreja/pessoas", title: "Detalhe da pessoa", eyebrow: "Pessoa e escopos", icon: Users },
  inbox: { back: "/gestao-igreja/inbox", title: "Detalhe do pedido", eyebrow: "Inbox e cuidado", icon: Inbox },
};

type DetailData = {
  title: string;
  description: string;
  status?: string;
  fields: Array<[string, string]>;
  sensitive?: boolean;
  empty?: boolean;
};

export default function ChurchManagementDetailPage({ kind }: { kind: DetailKind }) {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const config = configs[kind];
  const Icon = config.icon;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DetailData | null>(null);
  const [actionFeedback, setActionFeedback] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    loadDetail(kind, id)
      .then((detail) => {
        if (isMounted) setData(detail);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Nao foi possivel carregar o detalhe.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id, kind]);

  const editHref = useMemo(() => {
    if (!config.editable) return null;
    const base = kind === "qrcode" ? "qrcodes" : kind === "designacao" ? "designacoes" : kind === "equipe" ? "equipes" : "permissoes";
    return `/gestao-igreja/${base}/${id}/editar`;
  }, [config.editable, id, kind]);

  const detail = data ?? getEmptyDetail(kind, id);

  const runQuickAction = async (action: "pause" | "archive" | "remove") => {
    if (!id) return;
    if (!isUuid(id)) {
      setActionFeedback("Acao disponivel apenas para registros reais gravados no banco.");
      return;
    }
    try {
      if (kind === "qrcode") {
        const updated = await churchManagementService.updateQrForm(id, { status: action === "archive" ? "archived" : "paused" });
        setData(mapQr(updated, id));
      } else if (kind === "equipe") {
        const updated = await churchManagementService.updateTeam(id, { status: action === "archive" ? "archived" : "paused" });
        setData(mapTeam(updated, id));
      } else if (kind === "designacao") {
        const updated = await churchManagementService.updateAssignment(id, { status: action === "remove" ? "removed" : "paused" });
        setData(mapAssignment(updated, id));
      }
      setActionFeedback("Acao aplicada com sucesso.");
    } catch (error) {
      setActionFeedback(error instanceof Error ? error.message : "Nao foi possivel aplicar a acao.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
          <Link href={config.back} className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
            <Icon size={15} className="text-[#d8b15f]" />
            {config.eyebrow}
          </div>
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-normal sm:text-5xl">{detail.title || config.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{detail.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {kind === "qrcode" ? (
                <Link href={`/gestao-igreja/qrcodes/${id}/imprimir`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/15">
                  <Printer size={16} />
                  Imprimir
                </Link>
              ) : null}
              {editHref ? (
                <Link href={editHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-slate-100">
                  <Edit size={16} />
                  Editar
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          {loading ? <p className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Carregando detalhe...</p> : null}
          {error ? <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{error}</p> : null}
          <dl className="grid gap-3 md:grid-cols-2">
            {detail.fields.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">{value || "Nao informado"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-black">Status</h2>
            </div>
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">{detail.status ?? "Ativo"}</p>
            {detail.sensitive ? <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">Conteudo sensivel. Exibir apenas para papeis autorizados.</p> : null}
          </section>
          {kind === "qrcode" || kind === "equipe" || kind === "designacao" ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-4 flex items-center gap-3">
                <Pause size={22} className="text-[#9a7a2f]" />
                <h2 className="text-xl font-black">Acoes rapidas</h2>
              </div>
              <div className="grid gap-3">
                <button type="button" onClick={() => runQuickAction("pause")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                  <Pause size={16} />
                  Pausar
                </button>
                {kind === "qrcode" || kind === "equipe" ? (
                  <button type="button" onClick={() => runQuickAction("archive")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                    <Archive size={16} />
                    Arquivar
                  </button>
                ) : (
                  <button type="button" onClick={() => runQuickAction("remove")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                    <Archive size={16} />
                    Remover
                  </button>
                )}
              </div>
              {actionFeedback ? <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">{actionFeedback}</p> : null}
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function loadDetail(kind: DetailKind, id: string): Promise<DetailData> {
  if (kind === "permissao" && !isUuid(id)) return getEmptyDetail(kind, id);
  if (kind === "qrcode") return mapQr(await churchManagementService.getQrForm(id), id);
  if (kind === "designacao") return mapAssignment(await churchManagementService.getAssignment(id), id);
  if (kind === "equipe") return mapTeam(await churchManagementService.getTeam(id), id);
  if (kind === "permissao") return mapRole(await churchManagementService.getRole(id), id);
  if (kind === "inbox") return mapSubmission(await churchManagementService.getSubmission(id), id);
  return getEmptyDetail(kind, id);
}

function mapQr(item: ChurchQrForm | null, id: string): DetailData {
  if (!item) return getEmptyDetail("qrcode", id);
  return {
    title: item.title,
    description: item.description || "Formulario publico da igreja.",
    status: item.status,
    fields: [["Token", item.token], ["Tipo", item.formType], ["Destino", item.destination], ["Scans", String(item.scansCount)], ["Envios", String(item.submissionsCount)], ["Privacidade", item.privacyText]],
  };
}

function mapAssignment(item: ChurchAssignment | null, id: string): DetailData {
  if (!item) return getEmptyDetail("designacao", id);
  return {
    title: item.title,
    description: item.description,
    status: item.status,
    fields: [["Escopo", item.scopeType], ["Voluntario", item.assigneeUserId ?? ""], ["Lider", item.leaderUserId ?? ""], ["Inicio", item.startsAt ?? ""], ["Feedback publico", item.publicFeedback]],
  };
}

function mapTeam(item: ChurchServiceTeam | null, id: string): DetailData {
  if (!item) return getEmptyDetail("equipe", id);
  return {
    title: item.name,
    description: item.description,
    status: item.status,
    fields: [["Area", item.area], ["Lider", item.leaderId ?? ""], ["Capacidade", item.capacity ? String(item.capacity) : ""], ["Slug", item.slug]],
  };
}

function mapRole(item: ChurchMemberRole | null, id: string): DetailData {
  if (!item) return getEmptyDetail("permissao", id);
  return {
    title: item.role,
    description: "Papel operacional da igreja separado do plano comercial.",
    status: item.status,
    fields: [["Usuario", item.userId], ["Escopo", item.scopeType], ["ID do escopo", item.scopeId ?? ""], ["Concedido em", item.grantedAt], ["Revogado em", item.revokedAt ?? ""]],
    sensitive: item.role === "pastor",
  };
}

function mapSubmission(item: ChurchFormSubmission | null, id: string): DetailData {
  if (!item) return getEmptyDetail("inbox", id);
  return {
    title: item.internalSummary || "Pedido recebido",
    description: item.publicFeedback || item.publicStatus,
    status: item.status,
    sensitive: item.isSensitive,
    fields: [["Tipo", String(item.formType)], ["Nome", item.submitterName ?? ""], ["Contato", item.submitterContact ?? ""], ["Prioridade", item.priority], ["Proxima acao", item.nextAction], ["Status publico", item.publicStatus]],
  };
}

function getEmptyDetail(kind: DetailKind, id: string): DetailData {
  if (kind === "pessoa") {
    return { title: `Pessoa ${id.slice(0, 8)}`, description: "Detalhe operacional da pessoa baseado em papeis e escopos reais.", status: "Nao carregado", fields: [["Usuario", id], ["Origem", "Roles da igreja"]], empty: true };
  }
  return {
    title: configs[kind].title,
    description: "Registro nao encontrado na base real ou schema ainda nao aplicado.",
    status: "Nao encontrado",
    fields: [["ID solicitado", id], ["Origem", "Banco da Gestao da Igreja"]],
    empty: true,
  };
}
