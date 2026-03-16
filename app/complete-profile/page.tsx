"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import CompleteProfilePage from '../../views/CompleteProfilePage';

export default function Page() {
  return (
    <ProtectedRoute><CompleteProfilePage /></ProtectedRoute>
  );
}
