"use client";

import ProtectedRoute from '../../../../components/ProtectedRoute';
import CultoPlusWorkspacePage from '../../../../views/CultoPlusWorkspacePage';

export default function Page() {
  return (
    <ProtectedRoute>
      <CultoPlusWorkspacePage initialMode="create" />
    </ProtectedRoute>
  );
}
