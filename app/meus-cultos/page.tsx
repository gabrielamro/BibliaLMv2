"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import MyCultosPage from '../../views/MyCultosPage';

export default function Page() {
  return (
    <ProtectedRoute>
      <MyCultosPage />
    </ProtectedRoute>
  );
}
