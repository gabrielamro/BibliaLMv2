import { notFound, redirect } from 'next/navigation';

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

  redirect(`/u/${encodeURIComponent(resolvedParams.username)}`);
}
