import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit2, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CarClass {
  id: string;
  name: string;
  description: string;
  weekly_fuel_limit: number;
  is_active: boolean;
}

export function CarClassManagement() {
  const [classes, setClasses] = useState<CarClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', weekly_fuel_limit: 0 });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '', weekly_fuel_limit: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('car_classes').select('*').order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error('Failed to load car classes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Car Classes & Fuel Limits</h1>

      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {classes.map(c => (
          <Card key={c.id} className="p-5">
            {editingId === c.id ? (
              <div className="space-y-3">
                <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                <Input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                <Input type="number" value={editForm.weekly_fuel_limit} onChange={e => setEditForm({...editForm, weekly_fuel_limit: parseInt(e.target.value)})} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveEdit(c.id)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{c.name}</h3>
                    <p className="text-sm text-gray-500">{c.description || '—'}</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Weekly Fuel Limit</p>
                  <p className="text-2xl font-bold text-blue-700">{c.weekly_fuel_limit} Liters</p>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}