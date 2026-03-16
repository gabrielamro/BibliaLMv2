"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import TimelinePage from '../../views/TimelinePage';

export default function Page() {
  return (
    <ProtectedRoute><TimelinePage /></ProtectedRoute>
  );
}
