// src/pages/Settings.tsx
import React from 'react';
import { Settings as SettingsIcon, Sliders, Shield } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">Sistem ve kullanıcı ayarlarını yönetin</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Sliders className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Ayarlar Modülü</h2>
        <p className="text-gray-500">Bu modül yakında eklenecek...</p>
      </div>
    </div>
  );
};

export default Settings;