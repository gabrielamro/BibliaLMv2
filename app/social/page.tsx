import type { Metadata } from 'next';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';
import SocialFeedPage from '../../views/social/SocialFeedPage';

export const metadata: Metadata = {
  title: 'Reino | Culto+',
  description: 'Compartilhe reflexões, acompanhe sua igreja e fortaleça vínculos na comunidade do Culto+.',
  applicationName: 'Culto+',
};

export default function Page() {
  return (
    <CultoPlusPageShell>
      <SocialFeedPage />
    </CultoPlusPageShell>
  );
}
