"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import PrayersManagerPage from '../../../views/PrayersManagerPage';

export default function Page() {
  return (
    <ProtectedRoute><PrayersManagerPage /></ProtectedRoute>
  );
}
