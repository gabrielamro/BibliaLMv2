"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import WorkspacePage from '../../views/WorkspacePage';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><WorkspacePage /></ProtectedRoute></CultoPlusPageShell>
  );
}
