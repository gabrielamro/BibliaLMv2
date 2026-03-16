"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import UserProfilePage from '../../../views/UserProfilePage';

export default function Page() {
  return (
    <ProtectedRoute><UserProfilePage /></ProtectedRoute>
  );
}
