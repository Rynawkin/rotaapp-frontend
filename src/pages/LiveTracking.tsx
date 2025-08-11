// src/pages/LiveTracking.tsx
import React from 'react';
import { MapPin, Navigation, Activity } from 'lucide-react';

const LiveTracking: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Canlı Takip</h1>
        <p className="text-gray-600 mt-1">Tüm aktif seferleri haritada takip edin</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Navigation className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Canlı Takip Modülü</h2>
        <p className="text-gray-500">Bu modül yakında eklenecek...</p>
        <p className="text-sm text-gray-400 mt-2">Journeys modülünden simülasyon ile test edebilirsiniz</p>
      </div>
    </div>
  );
};

export default LiveTracking;