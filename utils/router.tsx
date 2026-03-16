"use client";

import { useRouter as useNextRouter, usePathname, useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';

// Custom useNavigate matching React Router signature
export function useNavigate() {
    const router = useNextRouter();
    return (path: string | number, options?: { state?: any, replace?: boolean }) => {
        if (typeof path === 'number') {
            if (path === -1) {
                router.back();
            }
            return;
        }

        if (options?.state) {
            try {
                sessionStorage.setItem('rn_state', JSON.stringify(options.state));
                window.dispatchEvent(new Event('rn_state_change'));
            } catch (e) { }
        }

        if (options?.replace) {
            router.replace(path);
        } else {
            router.push(path);
        }
    };
}

// Custom useLocation
export function useLocation(): { pathname: string, search: string, state: any } {
    const pathname = usePathname();
    const searchParams = useNextSearchParams();
    const [state, setState] = useState<any>(null);

    useEffect(() => {
        const checkState = () => {
            try {
                const s = sessionStorage.getItem('rn_state');
                if (s) {
                    setState(JSON.parse(s));
                    sessionStorage.removeItem('rn_state'); // consume it
                }
            } catch (e) { }
        };

        checkState();
        window.addEventListener('rn_state_change', checkState);
        return () => window.removeEventListener('rn_state_change', checkState);
    }, [pathname]);

    return {
        pathname: pathname || '',
        search: searchParams?.toString() ? '?' + searchParams.toString() : '',
        state
    };
}

// Custom useSearchParams
export function useSearchParams() {
    const router = useNextRouter();
    const pathname = usePathname();
    const sp = useNextSearchParams();
    const q = new URLSearchParams(sp?.toString() || "");

    const setSp = (params: any, options?: { replace?: boolean }) => {
        const nextSp = new URLSearchParams(q.toString());
        if (params instanceof URLSearchParams) {
            params.forEach((v, k) => nextSp.set(k, v));
        } else {
            Object.entries(params).forEach(([k, v]) => {
                if (v === undefined || v === null) {
                    nextSp.delete(k);
                } else {
                    nextSp.set(k, String(v));
                }
            });
        }
        const url = `${pathname}?${nextSp.toString()}`;
        if (options?.replace) {
            router.replace(url);
        } else {
            router.push(url);
        }
    };
    return [q, setSp] as const;
}

// Custom useParams
export function useParams<T = Record<string, string>>(): T {
    const p = useNextParams();
    return (p || {}) as T;
}

// Custom Navigate component
export function Navigate({ to, replace, state }: { to: string, replace?: boolean, state?: any }) {
    const router = useNextRouter();
    useEffect(() => {
        if (state) {
            try {
                sessionStorage.setItem('rn_state', JSON.stringify(state));
            } catch (e) { }
        }
        if (replace) {
            router.replace(to);
        } else {
            router.push(to);
        }
    }, [to, replace, router, state]);
    return null;
}
