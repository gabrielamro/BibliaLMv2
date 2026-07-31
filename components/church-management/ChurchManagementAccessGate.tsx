"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Church, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { churchManagementService } from "../../services/churchManagementService";
import { dbService } from "../../services/supabase";
import type { ChurchMemberRole, ChurchOperationalRole } from "../../types";
import { canAccessChurchManagement, DEFAULT_CHURCH_MANAGEMENT_ROLES } from "../../utils/churchManagementRules";
import { getChurchManagementAccessDecision, getGeneralProfileType, isGeneralManager, isGeneralPastor } from "../../utils/profileAccess";

export default function ChurchManagementAccessGate({
  children,
  allowedRoles = DEFAULT_CHURCH_MANAGEMENT_ROLES,
}: {
  children: ReactNode;
  allowedRoles?: ChurchOperationalRole[];
}) {
  const { currentUser, userProfile, loading, openLogin, updateProfile } = useAuth();
  const [roles, setRoles] = useState<ChurchMemberRole[]>([]);
  const [isChurchAdmin, setIsChurchAdmin] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [approvedChurch, setApprovedChurch] = useState<{ id: string; slug?: string } | null>(null);
  const activeChurchId = userProfile?.churchData?.churchId ?? approvedChurch?.id;
  const activeChurchSlug = userProfile?.churchData?.churchSlug ?? approvedChurch?.slug;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? userProfile?.uid;
  const isAdmin = userProfile?.subscriptionTier === "admin";
  const profileType = getGeneralProfileType(userProfile);
  const profileLabel = profileType === "manager" ? "Gestor" : profileType === "pastor" ? "Pastor" : "Usuario";

  useEffect(() => {
    if (!currentUserId || isAdmin) {
      setHasCheckedAccess(true);
      return;
    }

    let isMounted = true;
    setIsCheckingRoles(true);
    setHasCheckedAccess(false);
    setRoleError(null);

    const loadAccess = async () => {
      let churchId = activeChurchId;
      let churchSlug = activeChurchSlug;

      if (!churchId) {
        const approved = await dbService.getApprovedChurchResponsibility(currentUserId);
        if (approved) {
          churchId = approved.id;
          churchSlug = approved.slug;
          if (isMounted) {
            setApprovedChurch({ id: approved.id, slug: approved.slug });
            updateProfile({
              churchData: {
                churchId: approved.id,
                churchName: approved.name || "Sua Igreja",
                churchSlug: approved.slug || "",
              }
            }).catch((err) => console.error("Erro ao sincronizar igreja no perfil:", err));
          }
        }
      }

      if (!churchId) return { items: [] as ChurchMemberRole[], church: null, churchId: null, churchSlug };

      const [items, church] = await Promise.all([
        churchManagementService.listRoles(churchId, { limit: 100 }),
        dbService.getChurchById(churchId),
      ]);
      return { items, church, churchId, churchSlug: church?.slug ?? churchSlug };
    };

    loadAccess()
      .then(({ items, church }) => {
        if (!isMounted) return;
        setRoles(items);
        setIsChurchAdmin(Array.isArray(church?.admins) && church.admins.includes(currentUserId));
      })
      .catch((error) => {
        if (!isMounted) return;
        setRoles([]);
        setIsChurchAdmin(false);
        setRoleError(error?.message || "Nao foi possivel validar seu papel na igreja.");
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingRoles(false);
          setHasCheckedAccess(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeChurchId, activeChurchSlug, currentUserId, isAdmin]);

  const hasAllowedRole = useMemo(() => {
    return canAccessChurchManagement({
      userId: currentUserId,
      roles,
      allowedRoles,
      isPlatformAdmin: isAdmin,
      isChurchAdmin,
    });
  }, [allowedRoles, currentUserId, isAdmin, isChurchAdmin, roles]);

  const accessDecision = getChurchManagementAccessDecision({
    isLoading: loading || isCheckingRoles || !hasCheckedAccess,
    isAuthenticated: Boolean(currentUser),
    hasActiveChurch: Boolean(activeChurchId),
    hasAllowedRole,
    profile: userProfile,
  });

  if (accessDecision === "loading") {
    return (
      <AccessShell icon="check">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Validando acesso</p>
        <h1 className="mt-3 text-2xl font-black">Carregando Gestao da Igreja</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Estamos conferindo sua igreja e seu papel operacional.
        </p>
      </AccessShell>
    );
  }

  if (accessDecision === "login_required") {
    return (
      <AccessShell>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Login necessario</p>
        <h1 className="mt-3 text-2xl font-black">Entre para acessar a gestao</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          A Gestao da Igreja usa papeis operacionais por igreja e nao fica aberta para visitantes.
        </p>
        <button
          type="button"
          onClick={() => openLogin("/gestao-igreja")}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white dark:bg-white dark:text-slate-950"
        >
          Entrar
        </button>
      </AccessShell>
    );
  }

  if (accessDecision === "management_intent_needs_church" || accessDecision === "needs_church_link") {
    if (accessDecision === "management_intent_needs_church") {
      return (
        <AccessShell icon="church">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{profileLabel} sem igreja vinculada</p>
          <h1 className="mt-3 text-2xl font-black">Escolha a igreja que voce deseja apoiar</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Seu perfil geral ja esta marcado como {profileLabel.toLowerCase()}, mas a gestao real precisa de uma igreja e de permissao operacional aprovada.
          </p>
          <div className="mt-6 grid gap-3">
            <Link href="/social/igrejas" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white dark:bg-white dark:text-slate-950">
              Buscar igreja
            </Link>
            <Link href="/complete-profile" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 dark:border-white/10 dark:text-slate-200">
              Vincular no perfil
            </Link>
          </div>
        </AccessShell>
      );
    }

    return (
      <AccessShell>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Igreja nao vinculada</p>
        <h1 className="mt-3 text-2xl font-black">Vincule seu perfil a uma igreja</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          O modulo precisa de uma igreja ativa para carregar roles, QR Codes, inbox e designacoes.
        </p>
        <Link href="/complete-profile" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white dark:bg-white dark:text-slate-950">
          Completar perfil
        </Link>
      </AccessShell>
    );
  }

  if (accessDecision === "management_intent_waiting_authorization" || accessDecision === "operational_role_required") {
    return (
      <AccessShell>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{accessDecision === "management_intent_waiting_authorization" ? `${profileLabel} aguardando autorizacao` : "Acesso restrito"}</p>
        <h1 className="mt-3 text-2xl font-black">Papel operacional necessario</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {accessDecision === "management_intent_waiting_authorization"
            ? `Seu perfil geral como ${profileLabel.toLowerCase()} nao concede administracao automaticamente. Solicite responsabilidade nesta igreja ou aguarde um gestor conceder seu papel.`
            : "Esta area exige papel ativo de gestor da igreja ou lider dentro do escopo recebido."}
        </p>
        {roleError ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            {roleError}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3">
          {activeChurchSlug ? (
            <Link href={`/social/igreja/${activeChurchSlug}`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white dark:bg-white dark:text-slate-950">
              Solicitar responsabilidade
            </Link>
          ) : null}
          <Link href="/meus-cultos" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 dark:border-white/10 dark:text-slate-200">
            Ir para Minha Igreja
          </Link>
        </div>
      </AccessShell>
    );
  }

  return <>{children}</>;
}

function AccessShell({ children, icon = "lock" }: { children: ReactNode; icon?: "lock" | "check" | "church" }) {
  const Icon = icon === "check" ? ShieldCheck : icon === "church" ? Church : Lock;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-5 text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Icon size={24} />
        </span>
        {children}
      </section>
    </main>
  );
}
