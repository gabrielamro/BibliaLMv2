"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import TimelinePage from '../../views/TimelinePage';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><TimelinePage /></ProtectedRoute></CultoPlusPageShell>
  );
}
