import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  redirect(`/u/${encodeURIComponent(username)}`);
}
