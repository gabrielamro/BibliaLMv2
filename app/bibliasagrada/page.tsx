import type { Metadata } from 'next';
import ReaderPage from '../../views/ReaderPage';

export const metadata: Metadata = {
  title: 'Bíblia Sagrada | Culto+',
  description: 'Leia a Bíblia, acompanhe sua jornada diária e conecte estudo, oração e vida na igreja pelo Culto+.',
  applicationName: 'Culto+',
  keywords: ['Culto+', 'Bíblia Sagrada', 'leitura bíblica', 'oração', 'plano de leitura', 'igreja'],
};

export default function Page() {
  return (
    <ReaderPage />
  );
}
