import React, { useState } from 'react';
import { 
  GripVertical, 
  X, 
  MapPin, 
  Phone, 
  Clock,
  Star,
  Edit2,
  Save,
  XCircle,
  AlertCircle,
  Timer,
  CheckCircle,
  ArrowRight,
  Calendar,
  Camera,
  FileSignature
} from 'lucide-react';
import { Customer } from '@/types';

interface StopData {
  customer: Customer;
  overrideTimeWindow?: { start: string; end: string };
  overridePriority?: 'high' | 'normal' | 'low';
  serviceTime?: number;
  signatureRequired?: boolean;
  photoRequired?: boolean;
  stopNotes?: string;
  estimatedArrivalTime?: string;
  estimatedDepartureTime?: string;
}

interface StopsListProps {
  stops: StopData[];
  excludedStops?: Array<{
    stopData: StopData;
    reason: string;
    timeWindowConflict: string;
  }>;
  optimizationStatus: 'none' | 'success' | 'partial';
  onRemove: (customerId: string) => void;
  onReorder: (stops: StopData[]) => void;
  onUpdateStop: (index: number, updates: Partial<StopData>) => void;
  onExcludedStopEdit?: (customerId: string) => void;
  onMoveExcludedToStops?: (excluded: any) => void;
}

const StopsList: React.FC<StopsListProps> = ({ 
  stops, 
  excludedStops = [],
  optimizationStatus,
  onRemove, 
  onReorder,
  onUpdateStop,
  onExcludedStopEdit,
  onMoveExcludedToStops
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<StopData>>({});
  const [hasTimeWindowOverride, setHasTimeWindowOverride] = useState(false);
  const [timeWindowError, setTimeWindowError] = useState<string>('');
  const [initialTimeWindowSet, setInitialTimeWindowSet] = useState(false);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const draggedStop = stops[draggedIndex];
    const newStops = [...stops];
    
    // Remove from old position
    newStops.splice(draggedIndex, 1);
    
    // Insert at new position
    if (draggedIndex < dropIndex) {
      newStops.splice(dropIndex - 1, 0, draggedStop);
    } else {
      newStops.splice(dropIndex, 0, draggedStop);
    }
    
    onReorder(newStops);
    setDraggedIndex(null);
  };

  // Edit handlers
  const startEdit = (index: number) => {
    const stop = stops[index];
    setEditingIndex(index);
    setTimeWindowError('');
    setInitialTimeWindowSet(false);
    
    // Override varsa göster, yoksa boş başlat
    const hasOverride = !!(stop.overrideTimeWindow?.start || stop.overrideTimeWindow?.end);
    setHasTimeWindowOverride(hasOverride);
    
    setEditData({
      overrideTimeWindow: hasOverride ? stop.overrideTimeWindow : undefined,
      overridePriority: stop.overridePriority || stop.customer.priority,
      serviceTime: stop.serviceTime || stop.customer.estimatedServiceTime || 10,
      signatureRequired: stop.signatureRequired || false,
      photoRequired: stop.photoRequired || false,
      stopNotes: stop.stopNotes || ''
    });
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const updates = { ...editData };
      
      // Time window validation
      if (hasTimeWindowOverride && updates.overrideTimeWindow) {
        const { start, end } = updates.overrideTimeWindow;
        
        // İkisi de dolu veya ikisi de boş olmalı
        if ((start && !end) || (!start && end)) {
          // Otomatik tamamla
          if (start && !end) {
            const [hours, minutes] = start.split(':').map(Number);
            const endHours = (hours + 1) % 24;
            updates.overrideTimeWindow.end = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          } else if (!start && end) {
            const [hours, minutes] = end.split(':').map(Number);
            let startHours = hours - 1;
            if (startHours < 0) startHours = 23;
            updates.overrideTimeWindow.start = `${startHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
        
        // 00:00 kontrolü
        if (updates.overrideTimeWindow.start === '00:00') {
          updates.overrideTimeWindow.start = '00:01';
        }
        
        // Mantık kontrolü
        const startMinutes = parseInt(updates.overrideTimeWindow.start.split(':')[0]) * 60 + 
                           parseInt(updates.overrideTimeWindow.start.split(':')[1]);
        const endMinutes = parseInt(updates.overrideTimeWindow.end.split(':')[0]) * 60 + 
                         parseInt(updates.overrideTimeWindow.end.split(':')[1]);
        
        if (startMinutes >= endMinutes) {
          alert('Bitiş saati, başlangıç saatinden sonra olmalıdır!');
          return;
        }
      } else {
        delete updates.overrideTimeWindow;
      }
      
      // Müşteri varsayılanı ile aynıysa override'ı kaldır
      const stop = stops[editingIndex];
      if (updates.overrideTimeWindow) {
        if (updates.overrideTimeWindow.start === stop.customer.timeWindow?.start &&
            updates.overrideTimeWindow.end === stop.customer.timeWindow?.end) {
          delete updates.overrideTimeWindow;
        }
      }
      
      onUpdateStop(editingIndex, updates);
      setEditingIndex(null);
      setEditData({});
      setHasTimeWindowOverride(false);
      setTimeWindowError('');
      setInitialTimeWindowSet(false);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditData({});
    setHasTimeWindowOverride(false);
    setTimeWindowError('');
    setInitialTimeWindowSet(false);
  };

  // Time window input değişikliklerini handle et - DÜZELTME
  const handleTimeWindowChange = (field: 'start' | 'end', value: string) => {
    const currentTimeWindow = editData.overrideTimeWindow || { start: '', end: '' };
    const newTimeWindow = { ...currentTimeWindow, [field]: value };
    
    // 00:00 kontrolü
    if (value === '00:00') {
      setTimeWindowError('00:00 yerine 00:01 kullanmanız önerilir.');
    } else {
      setTimeWindowError('');
    }
    
    // Otomatik tamamlama SADECE ilk değer girildiğinde ve diğer alan boşsa
    if (!initialTimeWindowSet) {
      if (field === 'start' && value && !currentTimeWindow.end) {
        // İlk kez başlangıç girildi, end boş
        const [hours, minutes] = value.split(':').map(Number);
        const endHours = (hours + 1) % 24;
        newTimeWindow.end = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        setTimeWindowError('Bitiş saati otomatik ayarlandı. İstediğiniz gibi değiştirebilirsiniz.');
        setInitialTimeWindowSet(true);
      } else if (field === 'end' && value && !currentTimeWindow.start) {
        // İlk kez bitiş girildi, start boş
        const [hours, minutes] = value.split(':').map(Number);
        let startHours = hours - 1;
        if (startHours < 0) startHours = 23;
        newTimeWindow.start = `${startHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        setTimeWindowError('Başlangıç saati otomatik ayarlandı. İstediğiniz gibi değiştirebilirsiniz.');
        setInitialTimeWindowSet(true);
      }
    }
    
    // Mantık kontrolü - sadece ikisi de doluysa
    if (newTimeWindow.start && newTimeWindow.end) {
      const startMinutes = parseInt(newTimeWindow.start.split(':')[0]) * 60 + 
                         parseInt(newTimeWindow.start.split(':')[1]);
      const endMinutes = parseInt(newTimeWindow.end.split(':')[0]) * 60 + 
                       parseInt(newTimeWindow.end.split(':')[1]);
      
      if (startMinutes >= endMinutes) {
        setTimeWindowError('Bitiş saati, başlangıç saatinden sonra olmalıdır.');
      }
    }
    
    setEditData({
      ...editData,
      overrideTimeWindow: newTimeWindow
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // ETA formatını düzelt (HH:mm:ss veya HH:mm formatında göster)
  const formatETA = (etaString?: string): string => {
    if (!etaString) return '';
    // Backend'den HH:mm:ss formatında geliyor, sadece HH:mm göster
    return etaString.substring(0, 5);
  };

  return (
    <div className="space-y-4">
      {/* Optimize edilmiş duraklar başlığı */}
      {stops.length > 0 && (
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          optimizationStatus === 'success' ? 'bg-green-50 border border-green-200' :
          optimizationStatus === 'partial' ? 'bg-green-50 border border-green-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <h3 className={`font-medium flex items-center ${
            optimizationStatus === 'success' ? 'text-green-700' :
            optimizationStatus === 'partial' ? 'text-green-700' :
            'text-gray-700'
          }`}>
            {optimizationStatus !== 'none' && (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {optimizationStatus === 'none' ? 'Duraklar' : 'Optimize Edilmiş Duraklar'}
          </h3>
          {optimizationStatus !== 'none' && (
            <span className="text-xs text-green-600 font-medium">
              {stops.length} durak başarıyla optimize edildi
            </span>
          )}
        </div>
      )}

      {/* Mevcut stops listesi */}
      <div className="space-y-2">
        {stops.map((stop, index) => {
          const isEditing = editingIndex === index;
          const effectivePriority = stop.overridePriority || stop.customer.priority;
          const effectiveTimeWindow = stop.overrideTimeWindow || stop.customer.timeWindow;
          const effectiveServiceTime = stop.serviceTime || stop.customer.estimatedServiceTime || 10;
          
          // Değişiklik kontrolü
          const isTimeWindowOverridden = stop.overrideTimeWindow && 
            (stop.overrideTimeWindow.start !== stop.customer.timeWindow?.start || 
             stop.overrideTimeWindow.end !== stop.customer.timeWindow?.end);
          
          const isServiceTimeOverridden = stop.serviceTime && 
            stop.serviceTime !== (stop.customer.estimatedServiceTime || 10);
          
          const isPriorityOverridden = stop.overridePriority && 
            stop.overridePriority !== stop.customer.priority;

          return (
            <div
              key={stop.customer.id}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`bg-gray-50 rounded-lg p-4 cursor-move hover:bg-gray-100 transition-colors ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start">
                {/* Drag Handle */}
                <div className="mr-3">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>

                {/* Order Number */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm mr-3">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1">
                  {!isEditing ? (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {stop.customer.name}
                            <span className="ml-2 text-xs text-gray-500">
                              ({stop.customer.code})
                            </span>
                          </h4>
                          
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600 flex items-start">
                              <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                              {stop.customer.address}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="flex items-center text-gray-500">
                                <Phone className="w-4 h-4 mr-1" />
                                {stop.customer.phone}
                              </span>
                              
                              {effectiveTimeWindow && (
                                <span className="flex items-center text-gray-500">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {effectiveTimeWindow.start} - {effectiveTimeWindow.end}
                                  {isTimeWindowOverridden && (
                                    <span className="ml-1 text-xs text-orange-600">(düzenlenmiş)</span>
                                  )}
                                </span>
                              )}
                              
                              <span className="flex items-center text-gray-500">
                                <Timer className="w-4 h-4 mr-1" />
                                {effectiveServiceTime} dk
                                {isServiceTimeOverridden && (
                                  <span className="ml-1 text-xs text-orange-600">(düzenlenmiş)</span>
                                )}
                              </span>
                            </div>

                            {/* ETA Bilgileri */}
                            {optimizationStatus !== 'none' && (stop.estimatedArrivalTime || stop.estimatedDepartureTime) && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center text-blue-700">
                                    <Calendar className="w-4 h-4 mr-1.5" />
                                    <span className="font-medium">Tahmini Varış Saatleri:</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                                  {stop.estimatedArrivalTime && (
                                    <div className="flex items-center">
                                      <span className="text-gray-600">Varış:</span>
                                      <span className="ml-1.5 font-semibold text-blue-900">
                                        {formatETA(stop.estimatedArrivalTime)}
                                      </span>
                                    </div>
                                  )}
                                  {stop.estimatedDepartureTime && (
                                    <div className="flex items-center">
                                      <span className="text-gray-600">Ayrılış:</span>
                                      <span className="ml-1.5 font-semibold text-blue-900">
                                        {formatETA(stop.estimatedDepartureTime)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {index > 0 && stops[index - 1].estimatedDepartureTime && (
                                  <div className="mt-2 pt-2 border-t border-blue-200">
                                    <div className="flex items-center text-xs text-blue-600">
                                      <ArrowRight className="w-3 h-3 mr-1" />
                                      <span>
                                        Önceki duraktan {formatETA(stops[index - 1].estimatedDepartureTime)} ayrılış
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(effectivePriority)}`}>
                                {effectivePriority === 'high' && <Star className="w-3 h-3 mr-1" />}
                                {effectivePriority === 'high' ? 'Yüksek' : effectivePriority === 'normal' ? 'Normal' : 'Düşük'}
                                {isPriorityOverridden && (
                                  <span className="ml-1">(düzenlenmiş)</span>
                                )}
                              </span>

                              {/* Proof Requirements Badges */}
                              {stop.signatureRequired && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                  <FileSignature className="w-3 h-3 mr-1" />
                                  İmza Zorunlu
                                </span>
                              )}
                              {stop.photoRequired && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                  <Camera className="w-3 h-3 mr-1" />
                                  Fotoğraf Zorunlu
                                </span>
                              )}
                            </div>

                            {(stop.customer.notes || stop.stopNotes) && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                                {stop.stopNotes && (
                                  <div>
                                    <strong>Durak Notu:</strong> {stop.stopNotes}
                                  </div>
                                )}
                                {stop.customer.notes && (
                                  <div className={stop.stopNotes ? 'mt-1' : ''}>
                                    <strong>Müşteri Notu:</strong> {stop.customer.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-3 flex items-start space-x-1">
                          <button
                            onClick={() => startEdit(index)}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => onRemove(stop.customer.id)}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors"
                            title="Kaldır"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {stop.customer.name} - Düzenleniyor
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={saveEdit}
                            className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                            title="Kaydet"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700"
                            title="İptal"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Priority Override */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Öncelik
                          </label>
                          <select
                            value={editData.overridePriority || stop.customer.priority}
                            onChange={(e) => setEditData({
                              ...editData,
                              overridePriority: e.target.value as 'high' | 'normal' | 'low'
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">Düşük</option>
                            <option value="normal">Normal</option>
                            <option value="high">Yüksek</option>
                          </select>
                        </div>

                        {/* Service Time */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Servis Süresi (dk)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editData.serviceTime || stop.customer.estimatedServiceTime || 10}
                            onChange={(e) => setEditData({
                              ...editData,
                              serviceTime: parseInt(e.target.value)
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Proof of Delivery Requirements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-blue-50 rounded">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editData.signatureRequired ?? false}
                            onChange={(e) => setEditData({
                              ...editData,
                              signatureRequired: e.target.checked
                            })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">
                            İmza Zorunlu
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editData.photoRequired ?? false}
                            onChange={(e) => setEditData({
                              ...editData,
                              photoRequired: e.target.checked
                            })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">
                            Fotoğraf Zorunlu
                          </span>
                        </label>
                      </div>

                      {/* Time Window Override Checkbox */}
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hasTimeWindowOverride}
                            onChange={(e) => {
                              setHasTimeWindowOverride(e.target.checked);
                              setTimeWindowError('');
                              setInitialTimeWindowSet(false);
                              if (!e.target.checked) {
                                setEditData({
                                  ...editData,
                                  overrideTimeWindow: undefined
                                });
                              } else {
                                setEditData({
                                  ...editData,
                                  overrideTimeWindow: {
                                    start: stop.customer.timeWindow?.start || '',
                                    end: stop.customer.timeWindow?.end || ''
                                  }
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Bu durak için özel zaman penceresi tanımla
                          </span>
                        </label>
                        {stop.customer.timeWindow && (
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            Müşteri varsayılanı: {stop.customer.timeWindow.start} - {stop.customer.timeWindow.end}
                          </p>
                        )}
                      </div>

                      {/* Time Window Override Fields */}
                      {hasTimeWindowOverride && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Başlangıç Saati
                              </label>
                              <input
                                type="time"
                                value={editData.overrideTimeWindow?.start || ''}
                                onChange={(e) => handleTimeWindowChange('start', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Bitiş Saati
                              </label>
                              <input
                                type="time"
                                value={editData.overrideTimeWindow?.end || ''}
                                onChange={(e) => handleTimeWindowChange('end', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          
                          {/* Time Window Validation Mesajı */}
                          {timeWindowError && (
                            <div className={`p-2 rounded border ${
                              timeWindowError.includes('sonra olmalıdır') 
                                ? 'bg-red-50 border-red-200' 
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                              <p className={`text-xs flex items-center ${
                                timeWindowError.includes('sonra olmalıdır')
                                  ? 'text-red-700'
                                  : 'text-yellow-700'
                              }`}>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {timeWindowError}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stop Notes */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Bu Durak İçin Özel Not
                        </label>
                        <textarea
                          value={editData.stopNotes || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            stopNotes: e.target.value
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Bu teslimat için özel notlar..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stops.length === 0 && excludedStops.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>Henüz durak eklenmedi</p>
          <p className="text-sm mt-1">Yukarıdan müşteri seçerek başlayın</p>
        </div>
      )}

      {/* Dahil edilemeyen duraklar */}
      {excludedStops && excludedStops.length > 0 && (
        <>
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <h3 className="font-medium text-red-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Zaman Uyumsuzluğu Nedeniyle Dahil Edilemeyen Duraklar
            </h3>
            <p className="text-xs text-red-600 mt-1">
              Aşağıdaki duraklar belirlenen zaman aralıklarında teslim edilemiyor
            </p>
          </div>
          
          <div className="space-y-2">
            {excludedStops.map((excluded) => (
              <div
                key={excluded.stopData.customer.id}
                className="bg-red-50 border-2 border-red-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {excluded.stopData.customer.name}
                      <span className="ml-2 text-xs text-gray-500">
                        ({excluded.stopData.customer.code})
                      </span>
                    </h4>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {excluded.stopData.customer.address}
                    </p>
                    
                    <div className="mt-2 p-2 bg-white rounded">
                      <p className="text-sm text-red-600 font-medium">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {excluded.reason}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        {excluded.timeWindowConflict}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (onMoveExcludedToStops) {
                        onMoveExcludedToStops(excluded);
                      } else if (onExcludedStopEdit) {
                        onExcludedStopEdit(excluded.stopData.customer.id.toString());
                      }
                    }}
                    className="p-1.5 hover:bg-red-100 rounded transition-colors ml-3"
                    title="Zaman Penceresini Düzenle"
                  >
                    <Edit2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {stops.length > 0 && optimizationStatus === 'none' && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700 border border-yellow-200">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          <strong>Uyarı:</strong> Rotayı oluşturmadan önce durakları optimize etmeniz gerekmektedir.
        </div>
      )}
    </div>
  );
};

export default StopsList;