"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import ChurchOnboardingPage from '../../../views/ChurchOnboardingPage';

export default function Page() {
  return (
    <ProtectedRoute><ChurchOnboardingPage /></ProtectedRoute>
  );
}
