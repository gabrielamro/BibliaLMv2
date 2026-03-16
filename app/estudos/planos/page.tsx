"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import WorkspacePage from '../../../views/WorkspacePage';

export default function Page() {
  return (
    <ProtectedRoute><WorkspacePage /></ProtectedRoute>
  );
}
