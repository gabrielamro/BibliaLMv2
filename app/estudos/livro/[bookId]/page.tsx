"use client";

import ProtectedRoute from '../../../../components/ProtectedRoute';
import BookStudyPage from '../../../../views/BookStudyPage';

export default function Page() {
  return (
    <ProtectedRoute><BookStudyPage /></ProtectedRoute>
  );
}
