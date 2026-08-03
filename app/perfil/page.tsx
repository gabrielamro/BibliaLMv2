"use client";

import ProtectedRoute from '../../components/ProtectedRoute';
import PublicUserProfilePage from '../../views/public/PublicUserProfilePage';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><ProtectedRoute><PublicUserProfilePage /></ProtectedRoute></CultoPlusPageShell>
  );
}
