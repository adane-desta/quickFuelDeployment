import { useState, useEffect } from 'react';
import { X, Loader2, User, Mail, Phone, MapPin, Car, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase/client';
import { validateEthiopianPhone, formatEthiopianPhone, validateEmail } from '../../lib/supabase/config';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CarClass {
  id: string;
  name: string;
  description: string;
  weekly_fuel_limit: number;
}

export function AddDriverModal({ isOpen, onClose, onSuccess }: AddDriverModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [carClasses, setCarClasses] = useState<CarClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    licenseNumber: '',
    carClassId: '',
    vehicleModel: '',
    plateNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) loadCarClasses();
  }, [isOpen]);

  const loadCarClasses = async () => {
    setLoadingClasses(true);
    const { data, error } = await supabase
      .from('car_classes')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) {
      console.error(error);
      toast.error('Failed to load car classes');
    } else {
      setCarClasses(data || []);
    }
    setLoadingClasses(false);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!validateEthiopianPhone(formData.phone)) newErrors.phone = 'Invalid Ethiopian phone';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.carClassId) newErrors.carClassId = 'Please select a car class';
    if (!formData.vehicleModel.trim()) newErrors.vehicleModel = 'Vehicle model is required';
    if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => setStep(step - 1);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    return password;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const tempPassword = generateRandomPassword();
      const formattedPhone = formatEthiopianPhone(formData.phone);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formattedPhone,
            role: 'driver',
            address: formData.address,
            license_number: formData.licenseNumber,
            car_class_id: formData.carClassId,
            vehicle_model: formData.vehicleModel,
            plate_number: formData.plateNumber,
          },
          emailRedirectTo: undefined,
        },
      });
      if (authError) throw authError;

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error: updateError } = await supabase
        .from('users')
        .update({
          car_class_id: formData.carClassId,
          vehicle_model: formData.vehicleModel,
          plate_number: formData.plateNumber,
          license_number: formData.licenseNumber,
          address: formData.address,
        })
        .eq('id', authData.user.id);
      if (updateError) console.warn('Update error:', updateError);

      toast.success('Driver registered successfully!', {
        description: `Email: ${formData.email}\nTemporary Password: ${tempPassword}`,
        duration: 10000,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error('Registration failed', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '', email: '', phone: '', address: '', licenseNumber: '',
      carClassId: '', vehicleModel: '', plateNumber: '',
    });
    setStep(1);
    setErrors({});
  };

  if (!isOpen) return null;

  const selectedClass = carClasses.find(c => c.id === formData.carClassId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Register Driver</h2>
              <p className="text-sm text-purple-100">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-6 h-6 text-white" /></button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div><Label>Full Name *</Label><Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={errors.fullName ? 'border-red-500' : ''} /></div>
              <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={errors.email ? 'border-red-500' : ''} /></div>
              <div><Label>Phone *</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+251 912 345 678" className={errors.phone ? 'border-red-500' : ''} /></div>
              <div><Label>Address *</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={errors.address ? 'border-red-500' : ''} /></div>
              <div><Label>Driver's License Number *</Label><Input value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} className={errors.licenseNumber ? 'border-red-500' : ''} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vehicle Information</h3>
              <div>
                <Label>Car Class *</Label>
                {loadingClasses ? (
                  <div className="flex items-center gap-2 p-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading classes...</div>
                ) : (
                  <Select value={formData.carClassId} onValueChange={val => setFormData({...formData, carClassId: val})}>
                    <SelectTrigger className={errors.carClassId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select car class" />
                    </SelectTrigger>
                    <SelectContent>
                      {carClasses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} – {c.weekly_fuel_limit} L/week</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedClass && <p className="text-xs text-gray-500 mt-1">Weekly fuel limit: {selectedClass.weekly_fuel_limit} liters</p>}
              </div>
              <div><Label>Vehicle Model *</Label><Input value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} /></div>
              <div><Label>Plate Number *</Label><Input value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})} placeholder="AA-3-12345" /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Submit</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Full Name:</strong> {formData.fullName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Address:</strong> {formData.address}</p>
                <p><strong>License:</strong> {formData.licenseNumber}</p>
                <p><strong>Car Class:</strong> {selectedClass?.name} ({selectedClass?.weekly_fuel_limit} L/week)</p>
                <p><strong>Vehicle:</strong> {formData.vehicleModel} – {formData.plateNumber}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">A temporary password will be generated and shown after registration. The driver can change it after first login.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between bg-gray-50">
          <div>
            {step > 1 && <Button variant="outline" onClick={handleBack} disabled={loading}>Back</Button>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            {step < 3 ? (
              <Button onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-blue-600">Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Register Driver
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}