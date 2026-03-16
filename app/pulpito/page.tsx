"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import PulpitDashboardPage from '../../views/PulpitDashboardPage';

export default function Page() {
  return (
    <ProtectedRoute><PulpitDashboardPage /></ProtectedRoute>
  );
}
