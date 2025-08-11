// src/pages/Reports.tsx
import React from 'react';
import { FileText, BarChart3, TrendingUp } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
        <p className="text-gray-600 mt-1">Detaylı performans analizleri ve raporlar</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Raporlar Modülü</h2>
        <p className="text-gray-500">Bu modül yakında eklenecek...</p>
        <p className="text-sm text-gray-400 mt-2">Dashboard'da özet istatistikleri görüntüleyebilirsiniz</p>
      </div>
    </div>
  );
};

export default Reports;