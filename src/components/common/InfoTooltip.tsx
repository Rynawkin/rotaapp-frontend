// src/components/common/InfoTooltip.tsx

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  content: string;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isVisible && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="font-semibold mb-1">{title}</div>
          <div className="text-gray-300 text-xs">{content}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Yaygın kullanılan tooltip'ler için hazır metinler
export const TOOLTIP_TEXTS = {
  SLA: {
    title: 'SLA Nedir?',
    content: 'Service Level Agreement (Hizmet Seviyesi Anlaşması): Zamanında teslimat oranını gösterir. %90 ve üzeri mükemmel performans olarak kabul edilir.'
  },
  ORIGINAL_PLAN: {
    title: 'Orijinal Plan',
    content: 'Sefer başlamadan önce optimize edilmiş ilk planlanan varış saati. Bu saat değişmez ve gecikme hesaplamalarında referans olarak kullanılır.'
  },
  CURRENT_PLAN: {
    title: 'Güncel Plan',
    content: 'Sefer sırasında trafik, durak eklemeleri gibi durumlar sonucu güncellenen tahmini varış saati.'
  },
  ACTUAL_DELAY: {
    title: 'Gerçek Gecikme',
    content: 'Orijinal planlanan saat ile gerçekleşen varış saati arasındaki fark. Negatif değer erken varışı gösterir.'
  },
  ESTIMATED_DELAY: {
    title: 'Tahmini Gecikme',
    content: 'Henüz varış yapılmadığı için orijinal plan ile güncel plan arasındaki tahmini gecikme.'
  },
  ON_TIME_DELIVERY: {
    title: 'Zamanında Teslimat',
    content: 'Planlanan saate göre ±5 dakika içinde teslim edilen duraklar zamanında teslimat olarak kabul edilir.'
  },
  AVERAGE_DELAY: {
    title: 'Ortalama Gecikme',
    content: 'Tüm durakların toplam gecikmesinin durak sayısına bölümü. Sefer performansını değerlendirmek için kullanılır.'
  }
};
