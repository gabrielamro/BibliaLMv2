import type { Metadata } from 'next';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';
import TracksPage from '../../views/TracksPage';

export const metadata: Metadata = {
  title: 'Trilhas de Estudo Bíblico | Culto+',
  description: 'Séries guiadas de versículos e estudos bíblicos com propósitos de aprendizado e transformação no Culto+.',
  applicationName: 'Culto+',
};

export default function Page() {
  return (
    <CultoPlusPageShell>
      <TracksPage />
    </CultoPlusPageShell>
  );
}
