import type { Metadata } from 'next';

import CultoPlusIntroPage from '../../components/CultoPlusIntroPage';

export const metadata: Metadata = {
    title: 'Culto+ — Fé que conecta. Igreja que se move.',
    description: 'Bíblia, jornada espiritual, comunidade, cultos, voluntariado, cuidado pastoral e gestão da igreja em um único ecossistema.',
};

export default function Intro() {
    return <CultoPlusIntroPage />;
}

