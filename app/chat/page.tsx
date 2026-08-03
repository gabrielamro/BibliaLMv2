"use client";

import ChatPage from '../../views/ChatPage';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell compactDesktop><ChatPage /></CultoPlusPageShell>
  );
}
