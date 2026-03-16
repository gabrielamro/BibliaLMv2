import React from "react";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Users,
  Shield,
  HeartHandshake,
  Target,
  Quote,
  ChevronDown,
  PenTool,
  Mic,
  Image as ImageIcon,
  MessageCircle,
} from "lucide-react";
import SEO from "../components/SEO";

type CTAProps = {
  href: string;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
  iconRight?: React.ReactNode;
};

function CTAButton({ href, variant = "primary", children, iconRight }: CTAProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const primary =
    "bg-[#c5a059] text-[#1e1b18] hover:brightness-95 focus-visible:ring-[#c5a059] focus-visible:ring-offset-[#fdfbf7]";
  const secondary =
    "border border-black/10 bg-white/60 text-[#1e1b18] hover:bg-white focus-visible:ring-[#c5a059] focus-visible:ring-offset-[#fdfbf7] dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-[#1e1b18]";
  return (
    <a className={`${base} ${variant === "primary" ? primary : secondary}`} href={href}>
      {children}
      {iconRight ? <span className="opacity-90">{iconRight}</span> : null}
    </a>
  );
}

function SectionTag({ icon, children }: { icon: React.ReactNode; children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs font-semibold text-black/70 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-white/70">
      {icon}
      {children}
    </span>
  );
}

function Card({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:shadow-md dark:border-white/15 dark:bg-white/5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm transition group-hover:shadow dark:border-white/15 dark:bg-white/10">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1e1b18] dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-black/70 dark:text-white/70">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function Principle({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white/10 p-3">{icon}</div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  k,
  title,
  desc,
}: {
  k: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5">
      <div className="absolute -right-6 -top-10 select-none text-[90px] font-semibold text-black/5 dark:text-white/5">
        {k}
      </div>
      <div className="relative">
        <h3 className="text-base font-semibold text-[#1e1b18] dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-black/70 dark:text-white/70">{desc}</p>
      </div>
    </div>
  );
}

export default function FaithTechAIPage() {
  return (
    <main className="min-h-screen bg-[#fdfbf7] text-[#1e1b18] dark:bg-[#0f0d0b] dark:text-white overflow-y-auto">
      <SEO title="FaithTech AI" description="A nova geração da tecnologia espiritual." />
      {/* Subtle paper-like gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_500px_at_50%_-5%,rgba(197,160,89,0.22),transparent_55%)] dark:bg-[radial-gradient(1100px_500px_at_50%_-5%,rgba(197,160,89,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(93,64,55,0.07),transparent_50%)] dark:bg-[radial-gradient(900px_500px_at_20%_20%,rgba(93,64,55,0.12),transparent_50%)]" />
      </div>

      {/* Container */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 pb-32">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2.25rem] border border-black/10 bg-white/60 p-8 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5 sm:p-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTag icon={<Sparkles className="h-4 w-4" />}>Nova categoria</SectionTag>
              <SectionTag icon={<BookOpen className="h-4 w-4" />}>Formação espiritual</SectionTag>
              <SectionTag icon={<Users className="h-4 w-4" />}>Comunidade</SectionTag>
            </div>

            <div className="max-w-3xl">
              <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
                FaithTech AI
                <span className="block text-black/70 dark:text-white/70">
                  A nova geração da tecnologia espiritual
                </span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-black/70 dark:text-white/70 sm:text-lg">
                Onde Inteligência Artificial encontra formação espiritual profunda — com reverência,
                responsabilidade e comunidade no centro.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CTAButton href="#/intro" variant="primary" iconRight={<ArrowRight className="h-4 w-4" />}>
                  Conheça o BíbliaLM
                </CTAButton>
                <CTAButton href="#manifesto" variant="secondary" iconRight={<ChevronDown className="h-4 w-4" />}>
                  Explorar o conceito
                </CTAButton>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section id="manifesto" className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-2 lg:gap-10">
          <div className="rounded-[2rem] border border-black/10 bg-white/60 p-8 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <SectionTag icon={<Target className="h-4 w-4" />}>O problema</SectionTag>
            </div>
            <h2 className="mt-5 font-serif text-3xl leading-tight sm:text-4xl">
              A espiritualidade digital ficou para trás.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-black/70 dark:text-white/70 sm:text-base">
              Enquanto a tecnologia evoluiu para interpretar, criar e personalizar experiências,
              grande parte do digital cristão permaneceu passivo — com pouca interação, baixa
              profundidade e comunidades fragmentadas.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-black/70 dark:text-white/70">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl border border-black/10 bg-white p-2 shadow-sm dark:border-white/15 dark:bg-white/10">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span>Leitura sem diálogo e sem contexto.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl border border-black/10 bg-white p-2 shadow-sm dark:border-white/15 dark:bg-white/10">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span>Conteúdo genérico, sem acompanhamento de jornada.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl border border-black/10 bg-white p-2 shadow-sm dark:border-white/15 dark:bg-white/10">
                  <Users className="h-4 w-4" />
                </span>
                <span>Comunidade dispersa e pouco assistida.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl border border-black/10 bg-white p-2 shadow-sm dark:border-white/15 dark:bg-white/10">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span>Criação limitada (arte/áudio/estudos) e pouco integrada ao dia a dia.</span>
              </li>
            </ul>

            <div className="mt-7 rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/70 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white/70">
              <span className="font-semibold text-[#1e1b18] dark:text-white">
                A tecnologia evoluiu.
              </span>{" "}
              A experiência espiritual digital precisa acompanhar — com profundidade, guardrails e
              propósito.
            </div>
          </div>

          <div className="grid gap-6">
            <Card
              icon={<Sparkles className="h-5 w-5" />}
              title="Uma nova categoria"
              desc="FaithTech AI não é apenas “app bíblico”. É uma plataforma generativa, interativa e comunitária."
            />
             <Card
              icon={<Shield className="h-5 w-5" />}
              title="Alinhamento Ético"
              desc="IA com guardrails teológicos, focada na ortodoxia e na edificação, não na alucinação."
            />
             <Card
              icon={<HeartHandshake className="h-5 w-5" />}
              title="Centrado no Humano"
              desc="A tecnologia serve para aprofundar a relação humana com o divino, não para substituí-la."
            />
          </div>
        </section>
      </div>
    </main>
  );
}