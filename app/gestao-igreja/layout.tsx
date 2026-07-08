"use client";

import { ReactNode } from "react";
import ChurchManagementAccessGate from "../../components/church-management/ChurchManagementAccessGate";

export default function ChurchManagementLayout({ children }: { children: ReactNode }) {
  return <ChurchManagementAccessGate>{children}</ChurchManagementAccessGate>;
}
