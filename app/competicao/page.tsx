"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import ManaCompetitionPage from '../../views/ManaCompetitionPage';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><ManaCompetitionPage /></ProtectedRoute></CultoPlusPageShell>
  );
}
