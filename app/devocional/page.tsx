import type { Metadata } from 'next';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';
import DevotionalPage from '../../views/DevotionalPage';

export const metadata: Metadata = {
  title: 'Pão Diário | Culto+',
  description: 'Uma porção diária de reflexão bíblica, oração e prática para viver sua fé no Culto+.',
  applicationName: 'Culto+',
};

export default function Page() {
  return (
    <CultoPlusPageShell>
      <DevotionalPage />
    </CultoPlusPageShell>
  );
}
