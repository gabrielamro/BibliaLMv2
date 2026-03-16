"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import PublicUserProfilePage from '../../views/public/PublicUserProfilePage';

export default function Page() {
  return (
    <ProtectedRoute><PublicUserProfilePage /></ProtectedRoute>
  );
}
