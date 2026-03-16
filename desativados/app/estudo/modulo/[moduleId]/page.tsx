"use client";

import ProtectedRoute from '../../../../components/ProtectedRoute';
import ModulePlayerPage from '../../../../views/ModulePlayerPage';

export default function Page() {
  return (
    <ProtectedRoute><ModulePlayerPage /></ProtectedRoute>
  );
}
