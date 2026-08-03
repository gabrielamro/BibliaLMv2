"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import BibleDashboardPage from '../../views/BibleDashboardPage';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><BibleDashboardPage /></ProtectedRoute></CultoPlusPageShell>
  );
}
