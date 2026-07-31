import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ churchSlug: string }> }) {
  const { churchSlug } = await params;
  redirect(`/igreja/${encodeURIComponent(churchSlug)}`);
}
