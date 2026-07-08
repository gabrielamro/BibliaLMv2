"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from '../services/supabase';
import { PrayerRequest } from '../types';

const MOCK_PRAYERS: PrayerRequest[] = [
  {
    id: 'mock-1',
    userId: 'user-1',
    userName: 'Família Santos',
    content: 'Peço oração pela saúde do meu pai que fará uma cirurgia amanhã.',
    createdAt: new Date().toISOString(),
    intercessorsCount: 12,
    intercessors: [],
    targetType: 'global',
    targetId: 'global',
    churchId: '',
  },
  {
    id: 'mock-2',
    userId: 'user-2',
    userName: 'Lucas M.',
    content: 'Oração por provisão e uma nova porta de emprego.',
    createdAt: new Date().toISOString(),
    intercessorsCount: 7,
    intercessors: [],
    targetType: 'global',
    targetId: 'global',
    churchId: '',
  },
];

export function usePrayerWall(churchId?: string, limit = 2) {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPrayers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const canUpdate = () => mountedRef.current && requestId === requestIdRef.current;

    if (!mountedRef.current) return;
    setIsLoading(true);
    try {
      let data: PrayerRequest[] = [];
      if (churchId) {
        data = await dbService.getUnifiedChurchMural(churchId);
      } else {
        // Busca global via prayer_requests (sem filtro de target)
        data = await dbService.getPrayerRequests('global', 'global');
      }
      if (!canUpdate()) return;
      setPrayers(data.slice(0, limit));
    } catch {
      if (!canUpdate()) return;
      setPrayers(MOCK_PRAYERS.slice(0, limit));
    } finally {
      if (canUpdate()) setIsLoading(false);
    }
  }, [churchId, limit]);

  useEffect(() => {
    mountedRef.current = true;
    loadPrayers();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadPrayers]);

  const intercede = useCallback(async (prayerId: string, uid: string, isActive: boolean) => {
    setPrayers(prev =>
      prev.map(p =>
        p.id === prayerId
          ? {
              ...p,
              intercessorsCount: isActive ? p.intercessorsCount + 1 : Math.max(0, p.intercessorsCount - 1),
              intercessors: isActive
                ? [...p.intercessors, uid]
                : p.intercessors.filter(i => i !== uid),
            }
          : p
      )
    );
    try {
      await dbService.togglePrayerIntercession(prayerId, uid, isActive);
    } catch {
      // reverter em caso de erro
      loadPrayers();
    }
  }, [loadPrayers]);

  return { prayers, isLoading, intercede, reload: loadPrayers };
}
