"use client";

import ProtectedRoute from '../../../../components/ProtectedRoute';
import BookStudyPage from '../../../../views/BookStudyPage';
import CultoPlusPageShell from '../../../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><BookStudyPage /></ProtectedRoute></CultoPlusPageShell>
  );
}
