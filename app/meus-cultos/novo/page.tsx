"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import PersonalCultoJournalPage from '../../../views/PersonalCultoJournalPage';

export default function Page() {
  return (
    <ProtectedRoute>
      <PersonalCultoJournalPage />
    </ProtectedRoute>
  );
}
