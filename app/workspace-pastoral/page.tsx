"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import PastoralWorkspacePage from '../../views/PastoralWorkspacePage';

export default function Page() {
  return (
    <ProtectedRoute><PastoralWorkspacePage /></ProtectedRoute>
  );
}
