"use client";

import CultoPlusOnePage from '../../../components/culto-plus/CultoPlusOnePage';
import { useParams } from '../../../utils/router';

export default function Page() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  return <CultoPlusOnePage serviceSlug={decodeURIComponent(serviceSlug)} />;
}
