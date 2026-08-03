import { redirect } from 'next/navigation';

interface LegacyCreateStudyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyCreateStudyPage({ searchParams }: LegacyCreateStudyPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  });
  redirect(`/criar-conteudo${query.size ? `?${query.toString()}` : ''}`);
}
