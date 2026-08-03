"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import PlanReaderPage from '../../../views/PlanReaderPage';
import CultoPlusPageShell from '../../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><PlanReaderPage /></ProtectedRoute></CultoPlusPageShell>
  );
}
