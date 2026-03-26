import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { stationService } from '../../lib/supabase/database';
import { notifyError } from '../../lib/utils/notifications';
import type { Station } from '../../types/advanced';
import { EditStationForm } from './EditStationForm';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';

export function EditStationFormWrapper() {
  const navigate = useNavigate();
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
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-4">
        <Card className="p-8 text-center">
          <p className="text-gray-600">No station assigned to your account</p>
        </Card>
      </div>
    );
  }

  return <EditStationForm stationId={station.id} onSuccess={() => navigate('/owner')} />;
}
