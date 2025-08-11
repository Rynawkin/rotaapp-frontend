import React, { useState } from 'react';
import { 
  GripVertical, 
  X, 
  MapPin, 
  Phone, 
  Clock,
  AlertCircle,
  Star,
  Hash
} from 'lucide-react';
import { Customer } from '@/types';

interface StopsListProps {
  customers: Customer[];
  onRemove: (customerId: string) => void;
  onReorder: (customers: Customer[]) => void;
}

const StopsList: React.FC<StopsListProps> = ({
  customers,
  onRemove,
  onReorder
}) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedItem === null) return;
    if (draggedItem !== index) {
      setDragOverItem(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverItem !== null) {
      const newCustomers = [...customers];
      const draggedCustomer = newCustomers[draggedItem];
      
      // Remove dragged item
      newCustomers.splice(draggedItem, 1);
      
      // Insert at new position
      newCustomers.splice(dragOverItem, 0, draggedCustomer);
      
      onReorder(newCustomers);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'normal':
        return 'border-blue-200 bg-blue-50';
      case 'low':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek Öncelik';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Düşük Öncelik';
      default:
        return priority;
    }
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Henüz durak eklenmedi</p>
        <p className="text-sm mt-1">Yukarıdan müşteri arayarak durak ekleyin</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">
            Toplam: <strong className="text-gray-900">{customers.length} durak</strong>
          </span>
          <span className="text-gray-600">
            Tahmini süre: <strong className="text-gray-900">~{customers.length * 15} dk</strong>
          </span>
        </div>
        <p className="text-xs text-gray-500 flex items-center">
          <GripVertical className="w-4 h-4 mr-1" />
          Sıralamayı değiştirmek için sürükleyin
        </p>
      </div>

      {/* Stops List */}
      <div className="space-y-2">
        {customers.map((customer, index) => (
          <div
            key={customer.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            className={`
              relative p-4 bg-white border-2 rounded-lg transition-all cursor-move
              ${draggedItem === index ? 'opacity-50' : ''}
              ${dragOverItem === index ? 'border-blue-400 shadow-lg' : 'border-gray-200'}
              ${getPriorityColor(customer.priority)}
              hover:shadow-md
            `}
          >
            <div className="flex items-start">
              {/* Drag Handle and Order Number */}
              <div className="flex items-center mr-3">
                <GripVertical className="w-5 h-5 text-gray-400 mr-2" />
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 font-semibold text-sm">
                  {index + 1}
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex-1">
                {/* Name and Code */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center">
                      {customer.name}
                      <span className="ml-2 text-xs text-gray-500">({customer.code})</span>
                      {customer.priority === 'high' && (
                        <Star className={`w-4 h-4 ml-2 ${getPriorityIcon(customer.priority)}`} />
                      )}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(customer.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Address */}
                <div className="flex items-start text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{customer.address}</span>
                </div>

                {/* Additional Info */}
                <div className="flex items-center space-x-4 text-sm">
                  {/* Phone */}
                  <div className="flex items-center text-gray-500">
                    <Phone className="w-4 h-4 mr-1" />
                    <span>{customer.phone}</span>
                  </div>

                  {/* Time Window */}
                  {customer.timeWindow && (
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{customer.timeWindow.start} - {customer.timeWindow.end}</span>
                    </div>
                  )}

                  {/* Priority Badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    customer.priority === 'high' ? 'bg-red-100 text-red-700' :
                    customer.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getPriorityText(customer.priority)}
                  </span>
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {customer.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                      >
                        <Hash className="w-3 h-3 mr-0.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {customer.notes && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-start">
                    <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{customer.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Distance Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Mesafe ve süre bilgileri rota optimize edildikten sonra hesaplanacaktır.
        </p>
      </div>
    </div>
  );
};

export default StopsList;