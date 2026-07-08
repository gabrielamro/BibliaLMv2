import { notFound } from 'next/navigation';
import PublicUserProfilePage from '../../views/public/PublicUserProfilePage';

const REMOVED_ROUTE_SLUGS = new Set([
  'fonte-conhecimento',
  'trilhas',
  'notes',
  'artes-sacras',
  'pulpito',
]);

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;

  if (REMOVED_ROUTE_SLUGS.has(resolvedParams.username)) {
    notFound();
  }

  return (
    <PublicUserProfilePage />
  );
}
