"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import RoutinePage from '../../views/RoutinePage';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><RoutinePage /></ProtectedRoute></CultoPlusPageShell>
  );
}
