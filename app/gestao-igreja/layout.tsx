"use client";

import { ReactNode } from "react";
import ChurchManagementAccessGate from "../../components/church-management/ChurchManagementAccessGate";
import ChurchManagementShell from "../../components/church-management/ChurchManagementShell";

export default function ChurchManagementLayout({ children }: { children: ReactNode }) {
  // O menu pertence ao contexto da gestão e deve permanecer visível durante
  // validação, ausência de vínculo ou solicitação de responsabilidade.
  return <ChurchManagementShell><ChurchManagementAccessGate>{children}</ChurchManagementAccessGate></ChurchManagementShell>;
}
