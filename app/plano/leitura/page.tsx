"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import PlanReaderPage from '../../../views/PlanReaderPage';

export default function Page() {
  return (
    <ProtectedRoute><PlanReaderPage /></ProtectedRoute>
  );
}
