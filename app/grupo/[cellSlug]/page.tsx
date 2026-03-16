"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import CellForumPage from '../../../views/public/CellForumPage';

export default function Page() {
  return (
    <ProtectedRoute><CellForumPage /></ProtectedRoute>
  );
}
