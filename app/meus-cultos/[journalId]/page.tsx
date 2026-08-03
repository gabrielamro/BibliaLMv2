"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import PersonalCultoJournalPage from '../../../views/PersonalCultoJournalPage';
import CultoPlusPageShell from '../../../components/CultoPlusPageShell';

type PageProps = {
  params: {
    journalId: string;
  };
};

export default function Page({ params }: PageProps) {
  return (
    <CultoPlusPageShell>
      <ProtectedRoute><PersonalCultoJournalPage journalId={params.journalId} /></ProtectedRoute>
    </CultoPlusPageShell>
  );
}
