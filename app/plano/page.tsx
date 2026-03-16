"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import ReadingPlanDashboardPage from '../../views/ReadingPlanDashboardPage';

export default function Page() {
  return (
    <ProtectedRoute><ReadingPlanDashboardPage /></ProtectedRoute>
  );
}
