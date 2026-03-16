"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import NotesPage from '../../views/NotesPage';

export default function Page() {
  return (
    <ProtectedRoute><NotesPage /></ProtectedRoute>
  );
}
