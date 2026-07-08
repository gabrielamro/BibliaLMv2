"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Inbox,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchFormSubmission, ChurchSubmissionPriority, ChurchSubmissionStatus } from "../../types";
import {
  ALL_CHURCH_VOLUNTEER_CATEGORIES,
  getVolunteerCategoryByKey,
  inferVolunteerCategory,
  type ChurchVolunteerCategoryKey,
} from "../../utils/churchVolunteerCategories";

const stages: Array<{ key: ChurchSubmissionStatus | "open"; label: string; text: string }> = [
  { key: "received", label: "Recebido", text: "Interesse chegou pelo QR/formulario e precisa de triagem." },
  { key: "assigned", label: "Atribuido", text: "Ja existe responsavel para conversar com a pessoa." },
  { key: "in_progress", label: "Em acompanhamento", text: "Lideranca esta avaliando equipe, disponibilidade e proximo passo." },
  { key: "waiting_member", label: "Aguardando membro", text: "A igreja ja retornou e aguarda resposta." },
  { key: "closed", label: "Encerrado", text: "Fluxo concluido, arquivado ou resolvido." },
];

export default function ChurchVolunteerPipelinePage() {
  const { currentUser, userProfile } = useAuth();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? "";
  const [items, setItems] = useState<ChurchFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ChurchVolunteerCategoryKey | "all">("all");

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.listSubmissions(activeChurchId, { limit: 100 })
      .then((submissions) => {
        if (!isMounted) return;
        setItems(submissions.filter((item) => item.formType === "volunteer"));
      })
      .catch(() => {
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const categorizedItems = useMemo(() => items.map((item) => ({
    item,
    category: inferVolunteerCategory(item),
  })), [items]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<ChurchVolunteerCategoryKey, number>();
    for (const entry of categorizedItems) {
      counts.set(entry.category.key, (counts.get(entry.category.key) ?? 0) + 1);
    }
    return counts;
  }, [categorizedItems]);

  const filteredItems = useMemo(() => (
    selectedCategory === "all"
      ? categorizedItems
      : categorizedItems.filter((entry) => entry.category.key === selectedCategory)
  ), [categorizedItems, selectedCategory]);

  const metrics = useMemo(() => {
    const open = items.filter((item) => item.status !== "closed" && item.status !== "archived").length;
    const noOwner = items.filter((item) => !item.assignedTo && item.status !== "closed" && item.status !== "archived").length;
    const urgent = items.filter((item) => item.priority === "high" || item.priority === "urgent").length;
    return [
      ["Interesses", String(items.length)],
      ["Abertos", String(open)],
      ["Sem responsavel", String(noOwner)],
      ["Prioridade alta", String(urgent)],
    ];
  }, [items]);

  const selectedCategoryMeta = selectedCategory === "all" ? null : getVolunteerCategoryByKey(selectedCategory);

  const updateVolunteer = async (submission: ChurchFormSubmission, updates: { status?: ChurchSubmissionStatus; priority?: ChurchSubmissionPriority; assignedTo?: string | null; nextAction?: string; publicStatus?: string; publicFeedback?: string }) => {
    try {
      const updated = await churchManagementService.updateSubmissionStatus(submission.id, updates);
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setFeedback("Pipeline de voluntariado atualizado.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel atualizar o interesse agora.");
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
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <UserCheck size={15} className="text-[#d8b15f]" />
                Pipeline de voluntariado
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">Do interesse ao servico</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Acompanhe quem se ofereceu para servir, atribua responsavel, avance status e mantenha retorno seguro em Minha Igreja.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/15 bg-white/8 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</p>
                  <p className="mt-3 text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl min-w-0 gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              Carregando interesses de voluntariado...
            </div>
          ) : null}

          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-black">Categorias de voluntarios</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Filtre interesses pelo ministerio/cargo informado no QR de voluntariado.
                </p>
              </div>
              <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-slate-200">
                {filteredItems.length} visiveis
              </span>
            </div>
            <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs font-black uppercase tracking-wider transition ${selectedCategory === "all" ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"}`}
              >
                Todos
                <span className="ml-2 rounded-md bg-white/15 px-2 py-1">{items.length}</span>
              </button>
              {ALL_CHURCH_VOLUNTEER_CATEGORIES.map((category) => {
                const count = categoryCounts.get(category.key) ?? 0;
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setSelectedCategory(category.key)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs font-black uppercase tracking-wider transition ${selectedCategory === category.key ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"}`}
                  >
                    {category.shortTitle}
                    <span className="ml-2 rounded-md bg-white/15 px-2 py-1">{count}</span>
                  </button>
                );
              })}
            </div>
            {selectedCategoryMeta ? (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {selectedCategoryMeta.description}
              </p>
            ) : null}
          </section>

          {stages.map((stage) => {
            const stageItems = filteredItems.filter(({ item }) => stage.key === "closed" ? ["closed", "archived"].includes(item.status) : item.status === stage.key);
            return (
              <section key={stage.key} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black">{stage.label}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{stage.text}</p>
                  </div>
                  <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {stageItems.length}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {stageItems.map(({ item, category }) => (
                    <article key={item.id} className="min-w-0 rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-lg font-black">{item.submitterName || item.submitterContact || "Interessado em voluntariado"}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {item.internalSummary || item.publicFeedback || "Pessoa demonstrou interesse em servir."}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                            <span className="rounded-lg bg-[#d8b15f]/15 px-2 py-1 text-[#7a5a13] dark:text-[#f3d28a]">{category.shortTitle}</span>
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700 dark:bg-white/10 dark:text-slate-200">{item.priority}</span>
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700 dark:bg-white/10 dark:text-slate-200">{item.assignedTo ? "Com responsavel" : "Sem responsavel"}</span>
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700 dark:bg-white/10 dark:text-slate-200">{item.publicStatus}</span>
                          </div>
                        </div>
                        <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:w-64 xl:shrink-0 xl:grid-cols-1">
                          <Link href={`/gestao-igreja/inbox/${item.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                            Ver detalhe
                            <ChevronRight size={14} />
                          </Link>
                          {!item.assignedTo ? (
                            <button type="button" onClick={() => updateVolunteer(item, { assignedTo: currentUserId || null, status: "assigned", publicStatus: "Encaminhado para lideranca", nextAction: "Responsavel deve conversar com o voluntario" })} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                              Atribuir a mim
                            </button>
                          ) : null}
                          {item.status === "assigned" ? (
                            <button type="button" onClick={() => updateVolunteer(item, { status: "in_progress", publicStatus: "Em acompanhamento", nextAction: "Avaliar equipe e disponibilidade" })} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                              Iniciar acompanhamento
                            </button>
                          ) : null}
                          {item.status === "in_progress" ? (
                            <button type="button" onClick={() => updateVolunteer(item, { status: "waiting_member", publicStatus: "Aguardando sua resposta", publicFeedback: "A lideranca entrou em contato sobre seu interesse em servir.", nextAction: "Aguardar retorno do voluntario" })} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                              Aguardar membro
                            </button>
                          ) : null}
                          {item.status === "waiting_member" ? (
                            <button type="button" onClick={() => updateVolunteer(item, { status: "closed", publicStatus: "Encerrado", publicFeedback: "Obrigado por caminhar conosco. A igreja registrou este acompanhamento.", nextAction: "Sem acao pendente" })} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                              Encerrar
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                  {!isLoading && stageItems.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Nenhum interesse nesta etapa.
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="min-w-0 space-y-4">
          {feedback ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold leading-7 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              {feedback}
            </section>
          ) : null}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <Inbox size={24} className="text-[#9a7a2f]" />
            <h2 className="mt-4 text-xl font-black">Como alimentar o pipeline</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Crie um QR/formulario do tipo Voluntariado. Cada envio entra na inbox e aparece aqui como interesse real.
            </p>
            <Link href="/gestao-igreja/qrcodes/novo" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
              Criar QR de voluntariado
            </Link>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <ShieldCheck size={24} className="text-emerald-600 dark:text-emerald-300" />
            <h2 className="mt-4 text-xl font-black">Guarda-corpos</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {[
                "Interesse em servir nao concede permissao automaticamente.",
                "Aprovar voluntario deve virar designacao, equipe ou role em etapas separadas.",
                "O membro ve retorno publico em Minha Igreja, nao notas internas.",
              ].map((item) => (
                <p key={item} className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <ClipboardList size={24} className="text-slate-700 dark:text-slate-200" />
            <h2 className="mt-4 text-xl font-black">Depois da aprovacao</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/gestao-igreja/designacoes/nova" className="inline-flex min-h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                Criar designacao
                <ChevronRight size={14} />
              </Link>
              <Link href="/gestao-igreja/equipes/nova" className="inline-flex min-h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                Criar equipe
                <ChevronRight size={14} />
              </Link>
              <Link href="/gestao-igreja/permissoes/nova" className="inline-flex min-h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                Conceder role
                <ChevronRight size={14} />
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
