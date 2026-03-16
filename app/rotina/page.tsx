"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import RoutinePage from '../../views/RoutinePage';

export default function Page() {
  return (
    <ProtectedRoute><RoutinePage /></ProtectedRoute>
  );
}
