// src/hooks/useRealtimeSubscription.ts
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Filter = {
  column: string;
  value: string;
};

/**
 * A generic hook to subscribe to real‑time changes on a Supabase table.
 *
 * @param table - Table name (e.g., 'reservations')
 * @param filter - Object with column and value to filter (e.g., { column: 'station_id', value: stationId })
 * @param onUpdate - Callback triggered on any change (INSERT, UPDATE, DELETE)
 * @param deps - Additional dependencies to re‑create the subscription (optional)
 */
export function useRealtimeSubscription<T = any>(
  table: string,
  filter: Filter | null,
  onUpdate: (payload: RealtimePostgresChangesPayload<T>) => void,
  deps: any[] = []
) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Build channel name
    let channelName = `${table}`;
    if (filter) {
      channelName += `-${filter.column}-${filter.value}`;
    } else {
      channelName += `-all`;
    }

    let query = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        onUpdate(payload);
      });

    // Apply filter if provided
    if (filter) {
      query = query.on('postgres_changes', { event: '*', schema: 'public', table, filter: `${filter.column}=eq.${filter.value}` }, (payload) => {
        onUpdate(payload);
      });
    }

    const channel = query.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, filter?.column, filter?.value, ...deps]);
}