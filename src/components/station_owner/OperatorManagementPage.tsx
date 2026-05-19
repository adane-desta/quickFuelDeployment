import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { stationService } from '../../lib/supabase/database';
import { notifyError } from '../../lib/utils/notifications';
import type { Station } from '../../types/advanced';
import { OperatorManagement } from './OperatorManagement';
import { Skeleton } from '../ui/skeleton';

export function OperatorManagementPage() {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStation();
    }
  }, [user]);

  const loadStation = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const allStations = await stationService.getAllStations();
      const ownedStation = allStations.find((s) => s.owner_id === user.id);
      setStation(ownedStation || null);
    } catch (error) {
      notifyError('Failed to load station', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">No station assigned to your account</p>
        </div>
      </div>
    );
  }

  return <OperatorManagement stationId={station.id} stationName={station?.name} />;
}