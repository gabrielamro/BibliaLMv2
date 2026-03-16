"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import BibleDashboardPage from '../../views/BibleDashboardPage';

export default function Page() {
  return (
    <ProtectedRoute><BibleDashboardPage /></ProtectedRoute>
  );
}
