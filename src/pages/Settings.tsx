import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-700">Ayarlar</h2>
        <p className="text-gray-500 mt-2">Bu modül yakında eklenecek</p>
      </div>
    </div>
  );
};

export default Settings;