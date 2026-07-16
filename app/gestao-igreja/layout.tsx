"use client";

import { ReactNode } from "react";
import ChurchManagementAccessGate from "../../components/church-management/ChurchManagementAccessGate";
import ChurchManagementShell from "../../components/church-management/ChurchManagementShell";

export default function ChurchManagementLayout({ children }: { children: ReactNode }) {
  return <ChurchManagementAccessGate><ChurchManagementShell>{children}</ChurchManagementShell></ChurchManagementAccessGate>;
}
