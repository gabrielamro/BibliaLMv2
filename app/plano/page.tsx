import type { Metadata } from 'next';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import ReadingPlanDashboardPage from '../../views/ReadingPlanDashboardPage';

export const metadata: Metadata = {
  title: 'Meta de Leitura | Culto+',
  description: 'Defina sua meta, acompanhe o progresso e avance em sua jornada de leitura bíblica no Culto+.',
  applicationName: 'Culto+',
};

export default function Page() {
  return (
    <CultoPlusPageShell>
      <ProtectedRoute><ReadingPlanDashboardPage /></ProtectedRoute>
    </CultoPlusPageShell>
  );
}
