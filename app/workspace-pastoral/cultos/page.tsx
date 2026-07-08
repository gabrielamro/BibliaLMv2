"use client";

import ProtectedRoute from '../../../components/ProtectedRoute';
import CultoPlusWorkspacePage from '../../../views/CultoPlusWorkspacePage';
import { useSearchParams } from '../../../utils/router';

export default function Page() {
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';
  const initialServiceId = searchParams.get('serviceId');
  const initialEdit = searchParams.get('edit') === '1';

  return (
    <ProtectedRoute>
      <CultoPlusWorkspacePage initialView={initialView} initialServiceId={initialServiceId} initialEdit={initialEdit} />
    </ProtectedRoute>
  );
}
