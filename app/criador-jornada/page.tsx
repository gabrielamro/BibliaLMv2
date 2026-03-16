"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import PlanBuilderPage from '../../views/PlanBuilderPage';

export default function Page() {
  return (
    <ProtectedRoute><PlanBuilderPage /></ProtectedRoute>
  );
}
