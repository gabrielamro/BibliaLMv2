import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ cellSlug: string }> }) {
  const { cellSlug } = await params;
  redirect(`/grupo/${encodeURIComponent(cellSlug)}`);
}
