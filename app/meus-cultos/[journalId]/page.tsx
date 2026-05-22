"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import PersonalCultoJournalPage from '../../../views/PersonalCultoJournalPage';

type PageProps = {
  params: {
    journalId: string;
  };
};

export default function Page({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <PersonalCultoJournalPage journalId={params.journalId} />
    </ProtectedRoute>
  );
}
