import { redirect } from 'next/navigation';

/** Landing `/culto` removida — favoritos e links antigos vão para o painel pessoal. */
export default function CultoIndexRedirectPage() {
  redirect('/meus-cultos');
}
