"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Church, Copy, Loader2, MapPin, Printer, QrCode, ShieldCheck, UserRound } from "lucide-react";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import type { Church as ChurchType, ChurchQrForm, UserProfile } from "../../types";

const formTypeLabels: Record<string, string> = {
  prayer: "Pedido de oracao",
  volunteer: "Vaga de voluntariado",
  visitor: "Visitante",
  pastor_care: "Cuidado pastoral",
  group: "Grupo ou celula",
  custom: "Formulario da igreja",
};

export default function ChurchQrPrintPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [origin, setOrigin] = useState("http://localhost:3010");
  const [form, setForm] = useState<ChurchQrForm | null>(null);
  const [church, setChurch] = useState<ChurchType | null>(null);
  const [creator, setCreator] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    churchManagementService.getQrForm(id)
      .then(async (loadedForm) => {
        if (!mounted) return;
        setForm(loadedForm);
        if (!loadedForm) {
          setError("QR Code nao encontrado.");
          return;
        }

        const [loadedChurch, loadedCreator] = await Promise.all([
          dbService.getChurchById(loadedForm.churchId).catch(() => null),
          loadedForm.createdBy ? dbService.getUserProfile(loadedForm.createdBy).catch(() => null) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setChurch(loadedChurch);
        setCreator(loadedCreator);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Nao foi possivel carregar o QR Code.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const publicUrl = form ? `${origin}/qr/${form.token}` : "";
  const qrImageUrl = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=920x920&data=${encodeURIComponent(publicUrl)}`
    : "";
  const leaderName = church?.pastorName || creator?.displayName || "Equipe responsavel";
  const churchLocation = [church?.location?.city, church?.location?.state].filter(Boolean).join(", ");
  const fieldsSummary = useMemo(() => summarizeFields(form), [form]);

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-900">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm font-black shadow-sm">
          <Loader2 className="animate-spin text-[#9a7a2f]" size={18} />
          Preparando pagina de impressao...
        </div>
      </main>
    );
  }

  if (error || !form) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-900">
        <section className="max-w-md rounded-lg bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black">Nao foi possivel montar a impressao</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">{error || "QR Code nao encontrado."}</p>
          <Link href="/gestao-igreja/qrcodes" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white">
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#e8edf2] px-4 py-6 text-slate-950 print:bg-white print:p-0">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html,
          body {
            width: 210mm;
            min-height: 297mm;
            background: #fff !important;
          }
          .print-hidden {
            display: none !important;
          }
          .poster-page {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid;
            overflow: hidden;
          }
        }
      `}</style>

      <div className="print-hidden mx-auto mb-5 flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/gestao-igreja/qrcodes" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black uppercase tracking-wider text-slate-700 shadow-sm">
          <ArrowLeft size={16} />
          QR Codes
        </Link>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyLink} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black uppercase tracking-wider text-slate-700 shadow-sm">
            <Copy size={16} />
            {copied ? "Copiado" : "Copiar link"}
          </button>
          <button onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white shadow-sm">
            <Printer size={16} />
            Imprimir A4
          </button>
        </div>
      </div>

      <article className="poster-page mx-auto flex h-[297mm] w-full max-w-[210mm] flex-col overflow-hidden bg-[#fbfaf5] shadow-2xl">
        <header className="relative bg-[#101827] px-8 pb-5 pt-6 text-white">
          <div className="absolute inset-x-0 bottom-0 h-2 bg-[#d8b15f]" />
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d8b15f]">{formTypeLabels[form.formType] ?? "Formulario da igreja"}</p>
              <h1 className="mt-2 max-w-[620px] text-[38px] font-black leading-[1.02] tracking-normal">{form.title}</h1>
              <p className="mt-2 max-w-[620px] text-sm font-semibold leading-5 text-slate-200">{form.description || "Use este QR Code para falar com a equipe da igreja de forma simples e segura."}</p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10">
              <Church size={30} className="text-[#d8b15f]" />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 px-8 py-3">
            <InfoLine icon={<Church size={17} />} label="Igreja" value={church?.name || "Igreja local"} />
            <InfoLine icon={<UserRound size={17} />} label="Lider responsavel" value={leaderName} />
            <InfoLine icon={<UserRound size={17} />} label="Criado por" value={creator?.displayName || form.createdBy || "Gestao da igreja"} />
            {churchLocation ? <InfoLine icon={<MapPin size={17} />} label="Local" value={churchLocation} /> : null}
        </section>

        <section className="flex flex-1 flex-col px-8 pb-4">
          <div className="rounded-lg border border-[#d8b15f]/70 bg-white p-4 text-center shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#d8b15f]/15 text-[#8a6a20]">
              <QrCode size={24} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#8a6a20]">Aponte a camera do celular</p>
            <h2 className="mt-1 text-4xl font-black leading-tight">Escaneie aqui</h2>
            <img src={qrImageUrl} alt={`QR Code para ${form.title}`} className="mx-auto my-3 aspect-square w-[355px] rounded-lg border-4 border-[#101827] bg-white p-3" />
            <p className="text-sm font-black text-slate-800">Leva menos de um minuto para responder.</p>
            <div className="mx-auto mt-2 max-w-[560px] rounded-lg bg-slate-100 px-4 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link do QR Code</p>
              <p className="mt-1 break-all text-[13px] font-black leading-5 text-slate-900">{publicUrl}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_0.9fr] gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Dados da vaga / formulario</p>
              <div className="mt-2 grid gap-1.5">
                <PosterField label="Tipo" value={formTypeLabels[form.formType] ?? form.formType} />
                <PosterField label="Destino" value={form.destination || "Inbox da igreja"} />
                <PosterField label="Status" value={form.status === "active" ? "Aberto para respostas" : form.status} />
                {fieldsSummary.map((field) => (
                  <PosterField key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="rounded-lg bg-[#101827] p-4 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b15f]">Convite</p>
                <h2 className="mt-1 text-xl font-black leading-tight">Seu talento pode servir pessoas.</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-200">
                Responda pelo QR Code. A equipe responsavel vai receber seus dados e orientar o proximo passo com cuidado.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  <p className="text-[11px] font-semibold leading-4">{form.privacyText || "Suas informacoes serao usadas apenas pela equipe responsavel da igreja."}</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-2 flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{church?.name || "BibliaLM Igreja"}</p>
            <p className="text-[11px] font-semibold text-slate-500">QR Code gerado para impressao em A4</p>
          </footer>
        </section>
      </article>
    </main>
  );
}

function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">{icon}</span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="mt-0.5 text-xs font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function PosterField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[98px_1fr] gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-xs font-bold leading-4 text-slate-900">{value || "Nao informado"}</p>
    </div>
  );
}

function summarizeFields(form: ChurchQrForm | null) {
  if (!form?.fields?.length) return [];
  return form.fields.slice(0, 2).map((field) => ({
    label: field.label,
    value: field.options?.length ? field.options.slice(0, 5).join(", ") : field.required ? "Obrigatorio" : "Opcional",
  }));
}
