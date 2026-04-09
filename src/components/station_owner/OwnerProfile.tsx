import React from 'react';
import { User, Mail, Phone, Building2, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface OwnerProfileProps {
  onLogout: () => void;
}

export function OwnerProfile({ onLogout }: OwnerProfileProps) {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h2>

      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="size-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium">{user?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{user?.phoneNumber || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="size-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Station</p>
                <p className="font-medium">{user?.stationName || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4 text-red-700">Danger Zone</h3>
          <Button variant="destructive" onClick={onLogout}>
            <LogOut className="size-4 mr-2" />
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
}
