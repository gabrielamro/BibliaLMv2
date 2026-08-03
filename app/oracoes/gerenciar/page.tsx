"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import PrayersManagerPage from '../../../views/PrayersManagerPage';
import PastoralWorkspaceShell from '../../../components/workspace/PastoralWorkspaceShell';

export default function Page() {
  return (
    <PastoralWorkspaceShell><ProtectedRoute><PrayersManagerPage /></ProtectedRoute></PastoralWorkspaceShell>
  );
}
