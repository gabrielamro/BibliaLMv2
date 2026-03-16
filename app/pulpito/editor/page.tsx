"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import SermonBuilderPage from '../../../views/SermonBuilderPage';

export default function Page() {
  return (
    <ProtectedRoute><SermonBuilderPage /></ProtectedRoute>
  );
}
