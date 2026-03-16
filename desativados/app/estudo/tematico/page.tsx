"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import ThematicStudiesPage from '../../../views/ThematicStudiesPage';

export default function Page() {
  return (
    <ProtectedRoute><ThematicStudiesPage /></ProtectedRoute>
  );
}
