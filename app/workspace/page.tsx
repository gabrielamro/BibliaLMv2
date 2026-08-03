"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import WorkspacePage from '../../views/WorkspacePage';
import PastoralWorkspaceShell from '../../components/workspace/PastoralWorkspaceShell';

export default function Page() {
  return (
    <PastoralWorkspaceShell><ProtectedRoute><WorkspacePage /></ProtectedRoute></PastoralWorkspaceShell>
  );
}
