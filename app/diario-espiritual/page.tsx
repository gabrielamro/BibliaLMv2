import type { Metadata } from 'next';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import SpiritualJournalPage from '../../views/SpiritualJournalPage';

export const metadata: Metadata = {
  title: 'Diário Espiritual | Culto+',
  description: 'Sua linha do tempo privada de oração, reflexão, compromissos e caminhada com Deus no Culto+.',
  applicationName: 'Culto+',
};

export default function Page() {
  return (
    <CultoPlusPageShell>
      <ProtectedRoute>
        <SpiritualJournalPage />
      </ProtectedRoute>
    </CultoPlusPageShell>
  );
}
