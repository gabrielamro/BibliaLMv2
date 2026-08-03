export type ActiveCultoSession = {
  href: string;
  title: string;
  expiresAt: number;
};

const ACTIVE_CULTO_STORAGE_KEY = 'cultoplus:active-culto';
const ACTIVE_CULTO_COOKIE_KEY = 'cultoplus_active_culto';
export const ACTIVE_CULTO_CHANGED_EVENT = 'cultoplus:active-culto-changed';

export const storeActiveCultoSession = ({
  href,
  title,
  endsAt,
}: {
  href: string;
  title: string;
  endsAt?: string;
}) => {
  if (typeof window === 'undefined' || !href.startsWith('/culto/')) return;

  const serviceEnd = endsAt ? new Date(endsAt).getTime() : Number.NaN;
  const fallbackExpiry = Date.now() + 8 * 60 * 60 * 1000;
  const expiresAt = Number.isFinite(serviceEnd)
    ? Math.max(serviceEnd + 3 * 60 * 60 * 1000, Date.now() + 60 * 60 * 1000)
    : fallbackExpiry;

  const session: ActiveCultoSession = { href, title, expiresAt };
  const serializedSession = JSON.stringify(session);
  try {
    window.localStorage?.setItem(ACTIVE_CULTO_STORAGE_KEY, serializedSession);
  } catch {
    // Cookies keep the return shortcut available when storage is restricted.
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${ACTIVE_CULTO_COOKIE_KEY}=${encodeURIComponent(serializedSession)}; path=/; max-age=${Math.max(60, Math.floor((expiresAt - Date.now()) / 1000))}; samesite=lax`;
  }
  window.dispatchEvent(new CustomEvent(ACTIVE_CULTO_CHANGED_EVENT, { detail: session }));
};

export const readActiveCultoSession = (): ActiveCultoSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const storedSession = window.localStorage?.getItem(ACTIVE_CULTO_STORAGE_KEY);
    const cookieSession = (typeof document !== 'undefined' ? document.cookie : '')
      .split('; ')
      .find((item) => item.startsWith(`${ACTIVE_CULTO_COOKIE_KEY}=`))
      ?.slice(ACTIVE_CULTO_COOKIE_KEY.length + 1);
    const parsed = JSON.parse(storedSession || (cookieSession ? decodeURIComponent(cookieSession) : 'null')) as ActiveCultoSession | null;
    if (!parsed?.href?.startsWith('/culto/') || !parsed.title || parsed.expiresAt <= Date.now()) {
      window.localStorage?.removeItem(ACTIVE_CULTO_STORAGE_KEY);
      if (typeof document !== 'undefined') {
        document.cookie = `${ACTIVE_CULTO_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
      }
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
