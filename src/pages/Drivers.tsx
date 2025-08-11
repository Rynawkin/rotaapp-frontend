import React from 'react';
import { Users } from 'lucide-react';

const Drivers: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-700">Sürücüler</h2>
        <p className="text-gray-500 mt-2">Bu modül yakında eklenecek</p>
      </div>
    </div>
  );
};

export default Drivers;