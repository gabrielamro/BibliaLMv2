import type { Metadata } from 'next';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';
import QuizPage from '../../views/QuizPage';

export const metadata: Metadata = {
  title: 'Quiz Bíblico - Desafio da Sabedoria | Culto+',
  description: 'Teste seus conhecimentos bíblicos, acompanhe seu progresso e aprenda no Culto+.',
  applicationName: 'Culto+',
};

export default function Page() {
  return (
    <CultoPlusPageShell>
      <QuizPage />
    </CultoPlusPageShell>
  );
}
