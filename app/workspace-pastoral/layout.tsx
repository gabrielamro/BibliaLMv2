"use client";

import React from "react";
import PastoralWorkspaceShell from "../../components/workspace/PastoralWorkspaceShell";

export default function WorkspacePastoralLayout({ children }: { children: React.ReactNode }) {
  return <PastoralWorkspaceShell>{children}</PastoralWorkspaceShell>;
}
