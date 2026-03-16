"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import TracksManagerPage from '../../../views/TracksManagerPage';

export default function Page() {
  return (
    <ProtectedRoute><TracksManagerPage /></ProtectedRoute>
  );
}
