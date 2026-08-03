"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import PersonalCultoJournalPage from '../../../views/PersonalCultoJournalPage';
import CultoPlusPageShell from '../../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell>
      <ProtectedRoute><PersonalCultoJournalPage /></ProtectedRoute>
    </CultoPlusPageShell>
  );
}
