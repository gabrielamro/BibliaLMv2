import type { Metadata } from 'next';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';
import GuidedPrayersPage from '../../views/GuidedPrayersPage';

export const metadata: Metadata = {
  title: 'Orações | Culto+',
  description: 'Encontre orações guiadas por tema e fortaleça sua vida de oração no Culto+.',
  applicationName: 'Culto+',
};

export default function Page() {
  return (
    <CultoPlusPageShell>
      <GuidedPrayersPage />
    </CultoPlusPageShell>
  );
}
