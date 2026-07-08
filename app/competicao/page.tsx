"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import ManaCompetitionPage from '../../views/ManaCompetitionPage';

export default function Page() {
  return (
    <ProtectedRoute><ManaCompetitionPage /></ProtectedRoute>
  );
}
