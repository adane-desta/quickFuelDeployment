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
    const { data, error } = await supabase.from('car_classes').select('*').order('name');
    if (error) {
      toast.error('Failed to load car classes');
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (carClass: CarClass) => {
    setEditingId(carClass.id);
    setEditForm({
      name: carClass.name,
      description: carClass.description || '',
      weekly_fuel_limit: carClass.weekly_fuel_limit,
    });
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('car_classes')
      .update({
        name: editForm.name,
        description: editForm.description,
        weekly_fuel_limit: editForm.weekly_fuel_limit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Updated successfully');
      loadClasses();
      setEditingId(null);
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('car_classes')
      .update({ is_active: !currentActive })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      loadClasses();
    }
  };

  const handleAdd = async () => {
    if (!newClass.name || newClass.weekly_fuel_limit <= 0) {
      toast.error('Name and valid limit required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('car_classes').insert({
      name: newClass.name,
      description: newClass.description,
      weekly_fuel_limit: newClass.weekly_fuel_limit,
    });
    if (error) {
      toast.error('Failed to add');
    } else {
      toast.success('Car class added');
      setIsAddOpen(false);
      setNewClass({ name: '', description: '', weekly_fuel_limit: 0 });
      loadClasses();
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Car Classes & Fuel Limits</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600"><Plus className="w-4 h-4 mr-1" /> Add Class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Car Class</DialogTitle>
              <DialogDescription>Enter the details for the new vehicle class.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Name *</Label><Input value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} /></div>
              <div><Label>Description</Label><Input value={newClass.description} onChange={e => setNewClass({...newClass, description: e.target.value})} /></div>
              <div><Label>Weekly Fuel Limit (Liters) *</Label><Input type="number" value={newClass.weekly_fuel_limit} onChange={e => setNewClass({...newClass, weekly_fuel_limit: parseInt(e.target.value)})} /></div>
              <Button onClick={handleAdd} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Add Class</Button>
            </div>
          </DialogContent>
        </Dialog>
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
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
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
    </div>
  );
}