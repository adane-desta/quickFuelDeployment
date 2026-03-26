import React from 'react';
import { Bell, Truck, Users, AlertCircle } from 'lucide-react';
import { Card } from '../ui/card';

export function OwnerNotifications() {
  const notifications = [
    {
      id: 1,
      type: 'delivery',
      icon: Truck,
      title: 'Delivery Approved',
      message: 'Your fuel delivery request for Diesel has been approved',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      type: 'operator',
      icon: Users,
      title: 'New Operator Request',
      message: 'John Doe has requested access as an operator',
      time: '5 hours ago',
      read: true,
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Notifications</h2>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="size-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No notifications</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <Card
                key={notif.id}
                className={`p-4 ${!notif.read ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center ${
                    !notif.read ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <Icon className={`size-5 ${!notif.read ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{notif.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{notif.time}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
