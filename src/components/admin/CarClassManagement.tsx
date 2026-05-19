import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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

  const handleEdit = (carClass: CarClass) => {
    setEditingId(carClass.id);
    setEditForm({
      name: carClass?.name,
      description: carClass.description || '',
      weekly_fuel_limit: carClass.weekly_fuel_limit,
    });
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('car_classes')
        .update({
          name: editForm?.name,
          description: editForm.description,
          weekly_fuel_limit: editForm.weekly_fuel_limit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Updated successfully');
      await loadClasses();
      setEditingId(null);
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('car_classes')
        .update({ is_active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      await loadClasses();
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const handleAdd = async () => {
    if (!newClass?.name || newClass.weekly_fuel_limit <= 0) {
      toast.error('Name and valid limit required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('car_classes').insert({
        name: newClass?.name,
        description: newClass.description,
        weekly_fuel_limit: newClass.weekly_fuel_limit,
      });
      if (error) throw error;
      toast.success('Car class added');
      setIsAddOpen(false);
      setNewClass({ name: '', description: '', weekly_fuel_limit: 0 });
      await loadClasses();
    } catch (error: any) {
      toast.error('Failed to add: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Car Classes & Fuel Limits</h1>
        <Button onClick={() => setIsAddOpen(true)} className="bg-green-600">
          <Plus className="w-4 h-4 mr-1" /> Add Class
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {classes.map(c => (
          <Card key={c.id} className="p-5">
            {editingId === c.id ? (
              <div className="space-y-3">
                <Input value={editForm?.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
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
                    <h3 className="text-xl font-bold">{c?.name}</h3>
                    <p className="text-sm text-gray-500">{c.description || '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(c)} className="p-1 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleToggleActive(c.id, c.is_active)} className={`px-2 py-1 rounded text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
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

      {/* Custom Add Class Modal (styled like OperatorManagement) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Car Class</h2>
                  <p className="text-sm text-green-100">Define a vehicle category & fuel limit</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Form fields */}
            <div className="p-6 space-y-4">
              <div>
                <Label>Class Name *</Label>
                <Input
                  value={newClass?.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="e.g., Sedan, SUV, Mini-Bus"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="Optional description"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Weekly Fuel Limit (Liters) *</Label>
                <Input
                  type="number"
                  value={newClass.weekly_fuel_limit}
                  onChange={(e) => setNewClass({ ...newClass, weekly_fuel_limit: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 50"
                  className="mt-1"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
                <p className="font-medium mb-1">About fuel limits:</p>
                <ul className="text-xs space-y-1 text-blue-800">
                  <li>• This limit applies per vehicle per week</li>
                  <li>• Used to restrict over‑consumption</li>
                  <li>• Can be changed later</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Class
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}