"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import CreateStudyPage from '../../views/CreateStudyPage';

export default function Page() {
  return (
    <ProtectedRoute><CreateStudyPage /></ProtectedRoute>
  );
}
