"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import MyScalesPage from '../../views/MyScalesPage';

export default function Page() {
  return (
    <ProtectedRoute>
      <MyScalesPage />
    </ProtectedRoute>
  );
}
