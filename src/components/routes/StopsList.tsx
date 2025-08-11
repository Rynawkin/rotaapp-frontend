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
  Timer
} from 'lucide-react';
import { Customer } from '@/types';

interface StopData {
  customer: Customer;
  overrideTimeWindow?: { start: string; end: string };
  overridePriority?: 'high' | 'normal' | 'low';
  serviceTime?: number;
  stopNotes?: string;
}

interface StopsListProps {
  stops: StopData[];
  onRemove: (customerId: string) => void;
  onReorder: (stops: StopData[]) => void;
  onUpdateStop: (index: number, updates: Partial<StopData>) => void;
}

const StopsList: React.FC<StopsListProps> = ({ 
  stops, 
  onRemove, 
  onReorder,
  onUpdateStop 
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<StopData>>({});

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
    setEditData({
      overrideTimeWindow: stop.overrideTimeWindow || stop.customer.timeWindow,
      overridePriority: stop.overridePriority || stop.customer.priority,
      serviceTime: stop.serviceTime || stop.customer.estimatedServiceTime || 10,
      stopNotes: stop.stopNotes || ''
    });
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      onUpdateStop(editingIndex, editData);
      setEditingIndex(null);
      setEditData({});
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditData({});
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

  return (
    <div className="space-y-2">
      {stops.map((stop, index) => {
        const isEditing = editingIndex === index;
        const effectivePriority = stop.overridePriority || stop.customer.priority;
        const effectiveTimeWindow = stop.overrideTimeWindow || stop.customer.timeWindow;
        const effectiveServiceTime = stop.serviceTime || stop.customer.estimatedServiceTime || 10;

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
                                {stop.overrideTimeWindow && (
                                  <span className="ml-1 text-xs text-orange-600">(düzenlenmiş)</span>
                                )}
                              </span>
                            )}
                            
                            <span className="flex items-center text-gray-500">
                              <Timer className="w-4 h-4 mr-1" />
                              {effectiveServiceTime} dk
                              {stop.serviceTime && (
                                <span className="ml-1 text-xs text-orange-600">(düzenlenmiş)</span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(effectivePriority)}`}>
                              {effectivePriority === 'high' && <Star className="w-3 h-3 mr-1" />}
                              {effectivePriority === 'high' ? 'Yüksek' : effectivePriority === 'normal' ? 'Normal' : 'Düşük'}
                              {stop.overridePriority && (
                                <span className="ml-1">(düzenlenmiş)</span>
                              )}
                            </span>
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

                      {/* Time Window Override */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Başlangıç Saati
                        </label>
                        <input
                          type="time"
                          value={editData.overrideTimeWindow?.start || stop.customer.timeWindow?.start || '09:00'}
                          onChange={(e) => setEditData({
                            ...editData,
                            overrideTimeWindow: {
                              start: e.target.value,
                              end: editData.overrideTimeWindow?.end || stop.customer.timeWindow?.end || '17:00'
                            }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Bitiş Saati
                        </label>
                        <input
                          type="time"
                          value={editData.overrideTimeWindow?.end || stop.customer.timeWindow?.end || '17:00'}
                          onChange={(e) => setEditData({
                            ...editData,
                            overrideTimeWindow: {
                              start: editData.overrideTimeWindow?.start || stop.customer.timeWindow?.start || '09:00',
                              end: e.target.value
                            }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

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

      {stops.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>Henüz durak eklenmedi</p>
          <p className="text-sm mt-1">Yukarıdan müşteri seçerek başlayın</p>
        </div>
      )}

      {stops.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          <strong>İpucu:</strong> Durakları sürükleyerek sırayı değiştirebilir, düzenle butonuna tıklayarak her durak için özel ayarlar yapabilirsiniz.
        </div>
      )}
    </div>
  );
};

export default StopsList;