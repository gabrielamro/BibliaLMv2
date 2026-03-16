"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import SystemIntegrityPage from '../../views/SystemIntegrityPage';

export default function Page() {
  return (
    <ProtectedRoute><SystemIntegrityPage /></ProtectedRoute>
  );
}
