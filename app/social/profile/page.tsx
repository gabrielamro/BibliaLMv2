"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import UserProfilePage from '../../../views/UserProfilePage';
import CultoPlusPageShell from '../../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><UserProfilePage /></ProtectedRoute></CultoPlusPageShell>
  );
}
