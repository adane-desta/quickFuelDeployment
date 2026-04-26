import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { AddDriverModal } from './AddDriverModal';
import { Card } from '../ui/card';

export function AddDriverPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Add New Driver</h1>
        <p className="text-gray-600">Register a new driver with vehicle class and weekly fuel limit</p>
      </div>
      <Card className="p-8 text-center">
        <p className="text-gray-600 mb-4">Click the button below to register a new driver.</p>
        <Button onClick={() => setIsModalOpen(true)} className="bg-green-600">
          <Plus className="w-4 h-4 mr-2" /> Register Driver
        </Button>
      </Card>
      <AddDriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
}