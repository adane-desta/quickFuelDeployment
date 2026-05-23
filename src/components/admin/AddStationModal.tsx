import { useState, useEffect } from 'react';
import { X, Loader2, Building2, MapPin, Phone, Mail, FileText, Clock, Calendar, AlertCircle, Fuel } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase/client';
import { validateEthiopianPhone, formatEthiopianPhone, validateEmail } from '../../lib/supabase/config';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Ethiopian / Jimma coordinate bounds
const MIN_LAT = 7.0;
const MAX_LAT = 10.0;
const MIN_LNG = 36.0;
const MAX_LNG = 40.0;

export function AddStationModal({ isOpen, onClose, onSuccess }: AddStationModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [fuelTypes, setFuelTypes] = useState<any[]>([]);
  const [loadingFuelTypes, setLoadingFuelTypes] = useState(true);

  const [formData, setFormData] = useState({
    // Station Details
    stationName: '',
    address: '',
    landmark: '',           // new field
    phone: '',
    latitude: '',
    longitude: '',
    businessLicense: '',
    operatingLicense: '',
    environmentalClearance: '',
    fireSafetyCertificate: '',
    licenseExpiryDate: '',
    numberOfPumps: '',
    vehiclesPerPumpPerSlot: '',
    openingTime: '06:00',
    closingTime: '22:00',
    is24Hours: false,
    operatingDays: WEEKDAYS,
    
    // Owner Details
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerBusinessLicense: '',
    
    // Fuel Inventory
    fuelStock: {} as Record<string, number>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) loadFuelTypes();
  }, [isOpen]);

  const loadFuelTypes = async () => {
    setLoadingFuelTypes(true);
    try {
      const { data, error } = await supabase
        .from('fuel_types')
        .select('id, name, code')
        .eq('is_active', true);
      if (error) throw error;
      setFuelTypes(data || []);
      const initialStock: Record<string, number> = {};
      (data || []).forEach(ft => { initialStock[ft.id] = 0; });
      setFormData(prev => ({ ...prev, fuelStock: initialStock }));
    } catch (error) {
      toast.error('Failed to load fuel types');
    } finally {
      setLoadingFuelTypes(false);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.stationName.trim()) newErrors.stationName = 'Station name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.landmark.trim()) newErrors.landmark = 'Landmark is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateEthiopianPhone(formData.phone)) {
      newErrors.phone = 'Invalid Ethiopian phone number (e.g., +251 912 345 678)';
    }
    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      newErrors.location = 'Location coordinates are required';
    } else {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        newErrors.location = 'Invalid coordinates (must be numbers)';
      } else if (lat < MIN_LAT || lat > MAX_LAT) {
        newErrors.location = `Latitude must be between ${MIN_LAT} and ${MAX_LAT}`;
      } else if (lng < MIN_LNG || lng > MAX_LNG) {
        newErrors.location = `Longitude must be between ${MIN_LNG} and ${MAX_LNG}`;
      }
    }
    if (!formData.businessLicense.trim()) newErrors.businessLicense = 'Business license number is required';
    if (!formData.numberOfPumps.trim() || parseInt(formData.numberOfPumps) <= 0) newErrors.numberOfPumps = 'Valid number of pumps is required';
    if (!formData.vehiclesPerPumpPerSlot.trim() || parseInt(formData.vehiclesPerPumpPerSlot) <= 0) newErrors.vehiclesPerPumpPerSlot = 'Valid vehicles per pump per slot is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = 'Email is required';
    } else if (!validateEmail(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Invalid email address';
    }
    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = 'Phone number is required';
    } else if (!validateEthiopianPhone(formData.ownerPhone)) {
      newErrors.ownerPhone = 'Invalid Ethiopian phone number';
    }
    if (!formData.ownerBusinessLicense.trim()) {
      newErrors.ownerBusinessLicense = 'Owner business license is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    for (const [id, stock] of Object.entries(formData.fuelStock)) {
      if (isNaN(stock) || stock < 0) {
        toast.error(`Invalid stock value for ${fuelTypes.find(ft => ft.id === id)?.name}`);
        return false;
      }
    }
    return true;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);

    try {
      const tempPassword = generateRandomPassword();
      const formattedOwnerPhone = formatEthiopianPhone(formData.ownerPhone);
      const formattedStationPhone = formatEthiopianPhone(formData.phone);

      // 1. Create station owner via edge function
      const { data: ownerData, error: ownerError } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.ownerEmail,
          password: tempPassword,
          full_name: formData.ownerName,
          phone: formattedOwnerPhone,
          role: 'station_owner',
          business_license_number: formData.ownerBusinessLicense,
        },
      });

      if (ownerError) throw new Error(ownerError.message);
      if (!ownerData.success) throw new Error(ownerData.error || 'Failed to create owner');

      const ownerId = ownerData.user_id;

      // 2. Create station
      const stationData = {
        name: formData.stationName,
        address: formData.address,
        landmark: formData.landmark,
        phone: formattedStationPhone,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        owner_id: ownerId,
        business_license_number: formData.businessLicense,
        operating_license_number: formData.operatingLicense || null,
        environmental_clearance_number: formData.environmentalClearance || null,
        fire_safety_certificate_number: formData.fireSafetyCertificate || null,
        license_expiry_date: formData.licenseExpiryDate || null,
        number_of_pumps: parseInt(formData.numberOfPumps),
        vehicles_per_pump_per_slot: parseInt(formData.vehiclesPerPumpPerSlot),
        opening_time: formData.is24Hours ? '00:00' : formData.openingTime,
        closing_time: formData.is24Hours ? '23:59' : formData.closingTime,
        is_24_hours: formData.is24Hours,
        operating_days: formData.operatingDays,
        is_verified: true, // admin created, auto-verify
        is_active: true,
      };

      const { data: station, error: stationError } = await supabase
        .from('stations')
        .insert(stationData)
        .select()
        .single();

      if (stationError) throw new Error(`Failed to create station: ${stationError.message}`);

      // 3. Insert fuel inventory
      const inventoryInserts = fuelTypes.map(ft => ({
        station_id: station.id,
        fuel_type_id: ft.id,
        current_stock: formData.fuelStock[ft.id] || 0,
        minimum_stock_threshold: 500,
        maximum_capacity: 10000,
        is_available: (formData.fuelStock[ft.id] || 0) > 500,
      }));

      const { error: inventoryError } = await supabase
        .from('station_fuel_inventory')
        .insert(inventoryInserts);

      if (inventoryError) {
        console.error('Inventory insert failed:', inventoryError);
        toast.warning('Station created but inventory setup failed. Please add fuel manually.');
      }

      // 4. Log activity
      await supabase.from('system_activity').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        user_role: 'admin',
        action: 'STATION_CREATED',
        description: `New station registered: ${formData.stationName}`,
        category: 'station',
        metadata: { stationName: formData.stationName, ownerEmail: formData.ownerEmail },
        success: true,
      });

      toast.success('Station registered successfully!');

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error(error);
      let friendlyMessage = 'Failed to register station. ';
      if (error.message.includes('duplicate key')) {
        if (error.message.includes('email')) friendlyMessage = 'Owner email already registered.';
        else if (error.message.includes('phone')) friendlyMessage = 'Phone number already used.';
        else friendlyMessage = 'Duplicate entry.';
      } else if (error.message.includes('invalid')) {
        friendlyMessage = error.message;
      } else {
        friendlyMessage = error.message || 'Please try again.';
      }
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      stationName: '', address: '', landmark: '', phone: '', latitude: '', longitude: '',
      businessLicense: '', operatingLicense: '', environmentalClearance: '', fireSafetyCertificate: '',
      licenseExpiryDate: '', numberOfPumps: '', vehiclesPerPumpPerSlot: '',
      openingTime: '06:00', closingTime: '22:00', is24Hours: false, operatingDays: WEEKDAYS,
      ownerName: '', ownerEmail: '', ownerPhone: '', ownerBusinessLicense: '',
      fuelStock: {},
    });
    setStep(1);
    setErrors({});
    loadFuelTypes();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFuelStockChange = (fuelTypeId: string, value: string) => {
    const num = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      fuelStock: { ...prev.fuelStock, [fuelTypeId]: num }
    }));
  };

  const toggleDay = (day: string) => {
    const newDays = formData.operatingDays.includes(day)
      ? formData.operatingDays.filter(d => d !== day)
      : [...formData.operatingDays, day];
    handleChange('operatingDays', newDays);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Station</h2>
              <p className="text-sm text-purple-100">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg" disabled={loading}>
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Station Details</h3>
              <div><Label>Station Name *</Label><Input value={formData.stationName} onChange={e => handleChange('stationName', e.target.value)} className={errors.stationName ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.stationName}</p></div>
              <div><Label>Address *</Label><Input value={formData.address} onChange={e => handleChange('address', e.target.value)} className={errors.address ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.address}</p></div>
              <div><Label>Landmark *</Label><Input value={formData.landmark} onChange={e => handleChange('landmark', e.target.value)} placeholder="Near Jimma University, etc." className={errors.landmark ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.landmark}</p></div>
              <div><Label>Phone *</Label><Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+251 912 345 678" className={errors.phone ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.phone}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Latitude *</Label><Input value={formData.latitude} onChange={e => handleChange('latitude', e.target.value)} placeholder="e.g., 9.0192" className={errors.location ? 'border-red-500' : ''} /></div>
                <div><Label>Longitude *</Label><Input value={formData.longitude} onChange={e => handleChange('longitude', e.target.value)} placeholder="e.g., 38.7525" className={errors.location ? 'border-red-500' : ''} /></div>
              </div>
              <p className="text-red-500 text-xs">{errors.location}</p>

              {/* Operating Hours */}
              <div><Label className="mb-2 block">Operating Schedule</Label>
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" id="is24Hours" checked={formData.is24Hours} onChange={e => handleChange('is24Hours', e.target.checked)} className="w-4 h-4" />
                  <Label htmlFor="is24Hours" className="cursor-pointer">24/7 Operation</Label>
                </div>
                {!formData.is24Hours && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Opening Time</Label><Input type="time" value={formData.openingTime} onChange={e => handleChange('openingTime', e.target.value)} /></div>
                    <div><Label>Closing Time</Label><Input type="time" value={formData.closingTime} onChange={e => handleChange('closingTime', e.target.value)} /></div>
                  </div>
                )}
              </div>

              <div><Label className="mb-2 block">Operating Days</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-full text-sm ${formData.operatingDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{day.slice(0,3)}</button>
                  ))}
                </div>
              </div>

              <div><Label>Business License Number *</Label><Input value={formData.businessLicense} onChange={e => handleChange('businessLicense', e.target.value)} className={errors.businessLicense ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.businessLicense}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Operating License Number</Label><Input value={formData.operatingLicense} onChange={e => handleChange('operatingLicense', e.target.value)} placeholder="Optional" /></div>
                <div><Label>License Expiry Date</Label><Input type="date" value={formData.licenseExpiryDate} onChange={e => handleChange('licenseExpiryDate', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Number of Pumps *</Label><Input type="number" value={formData.numberOfPumps} onChange={e => handleChange('numberOfPumps', e.target.value)} className={errors.numberOfPumps ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.numberOfPumps}</p></div>
                <div><Label>Vehicles per Pump per Slot *</Label><Input type="number" value={formData.vehiclesPerPumpPerSlot} onChange={e => handleChange('vehiclesPerPumpPerSlot', e.target.value)} className={errors.vehiclesPerPumpPerSlot ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.vehiclesPerPumpPerSlot}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Environmental Clearance No.</Label><Input value={formData.environmentalClearance} onChange={e => handleChange('environmentalClearance', e.target.value)} placeholder="Optional" /></div>
                <div><Label>Fire Safety Certificate No.</Label><Input value={formData.fireSafetyCertificate} onChange={e => handleChange('fireSafetyCertificate', e.target.value)} placeholder="Optional" /></div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800"><AlertCircle className="w-4 h-4 inline mr-1" /> Fuel inventory will be set in the next step.</div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Station Owner Details</h3>
              <div><Label>Owner Full Name *</Label><Input value={formData.ownerName} onChange={e => handleChange('ownerName', e.target.value)} className={errors.ownerName ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.ownerName}</p></div>
              <div><Label>Owner Email *</Label><Input type="email" value={formData.ownerEmail} onChange={e => handleChange('ownerEmail', e.target.value)} className={errors.ownerEmail ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.ownerEmail}</p><p className="text-xs text-gray-500">Login credentials will be sent to this email</p></div>
              <div><Label>Owner Phone *</Label><Input value={formData.ownerPhone} onChange={e => handleChange('ownerPhone', e.target.value)} placeholder="+251 912 345 678" className={errors.ownerPhone ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.ownerPhone}</p></div>
              <div><Label>Owner Business License *</Label><Input value={formData.ownerBusinessLicense} onChange={e => handleChange('ownerBusinessLicense', e.target.value)} className={errors.ownerBusinessLicense ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.ownerBusinessLicense}</p></div>
              <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-900">A temporary password will be generated and sent to the owner's email.</p></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Initial Fuel Inventory</h3>
              <p className="text-sm text-gray-600">Set starting stock for each fuel type (min threshold 500L, max capacity 10,000L).</p>
              {loadingFuelTypes ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                fuelTypes.map(ft => (
                  <div key={ft.id} className="border p-4 rounded-lg">
                    <Label className="font-semibold">{ft?.name} ({ft.code})</Label>
                    <Input type="number" min="0" step="100" value={formData.fuelStock[ft.id] || 0} onChange={e => handleFuelStockChange(ft.id, e.target.value)} placeholder="Liters" className="mt-1" />
                  </div>
                ))
              )}
              <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800"><AlertCircle className="w-4 h-4 inline mr-1" /> Stock can be adjusted later by the station owner.</div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between bg-gray-50">
          <div>{step > 1 && <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>Back</Button>}</div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-blue-600">Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Station & Owner
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}