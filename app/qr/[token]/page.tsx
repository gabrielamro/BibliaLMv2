"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CultoPlusBrand from "../../../components/CultoPlusBrand";
import ChurchQrPublicFormPreview from "../../../components/church-management/ChurchQrPublicFormPreview";
import { churchManagementService } from "../../../services/churchManagementService";
import type { ChurchQrForm } from "../../../types";

export default function ChurchQrPublicPage() {
  const params = useParams<{ token: string }>();
  const [form, setForm] = useState<ChurchQrForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const token = decodeURIComponent(params.token ?? "");

    setLoading(true);
    churchManagementService.getQrFormByToken(token)
      .then(async (loadedForm) => {
        if (!isMounted) return;
        setForm(loadedForm);

        if (loadedForm && loadedForm.churchId !== "preview") {
          const scanKey = `biblialm.qr.scan.${loadedForm.id}`;
          const alreadyCounted = typeof window !== "undefined" && window.sessionStorage.getItem(scanKey);
          if (!alreadyCounted) {
            await churchManagementService.recordQrFormScan(loadedForm.id);
            window.sessionStorage.setItem(scanKey, "1");
          }
        }
      })
      .catch(() => {
        if (isMounted) setForm(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params.token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf8f3] px-5 text-slate-950 dark:bg-[#08060b] dark:text-white">
        <section className="w-full max-w-md rounded-3xl border border-[#eadfd2] bg-white p-7 text-center shadow-xl shadow-[#321b50]/5 dark:border-white/10 dark:bg-white/[0.04]">
          <CultoPlusBrand className="mx-auto mb-6 !h-14" />
          <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Carregando formulario</p>
          <h1 className="mt-3 text-2xl font-black">Preparando envio</h1>
        </section>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf8f3] px-5 text-slate-950 dark:bg-[#08060b] dark:text-white">
        <section className="w-full max-w-md rounded-3xl border border-[#eadfd2] bg-white p-7 text-center shadow-xl shadow-[#321b50]/5 dark:border-white/10 dark:bg-white/[0.04]">
          <CultoPlusBrand className="mx-auto mb-6 !h-14" />
          <h1 className="text-2xl font-black">Formulario indisponivel</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Este link pode ter expirado ou sido pausado pela igreja.
          </p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#321b50] px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-[#4d2878] dark:bg-white dark:text-slate-950">
            Voltar ao Culto+
          </Link>
        </section>
      </main>
    );
  }

  return <ChurchQrPublicFormPreview form={form} />;
}
