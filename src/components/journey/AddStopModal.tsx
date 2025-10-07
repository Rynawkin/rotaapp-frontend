// src/components/journey/AddStopModal.tsx
import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, Plus } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { journeyService } from '@/services/journey.service';
import { toast } from 'react-hot-toast';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyId: number;
  onStopAdded: () => void;
  activeStopCustomerIds?: number[]; // ✅ Seferdeki aktif durakların müşteri ID'leri
}

interface Customer {
  id: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  serviceTime?: string; // ✅ Müşterinin varsayılan servis süresi
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  journeyId,
  onStopAdded,
  activeStopCustomerIds = []
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [serviceTimeMinutes, setServiceTimeMinutes] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // ✅ Zaman aralığı (arrive between)
  const [arriveBetweenStart, setArriveBetweenStart] = useState('');
  const [arriveBetweenEnd, setArriveBetweenEnd] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setAddress(customer.address || '');
        setLatitude(customer.latitude || '');
        setLongitude(customer.longitude || '');

        // ✅ Müşteri servis süresini otomatik doldur (eğer varsa)
        if (customer.serviceTime) {
          // serviceTime "hh:mm:ss" formatında, dakikaya çevir
          const parts = customer.serviceTime.split(':');
          if (parts.length >= 2) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            setServiceTimeMinutes(hours * 60 + minutes);
          }
        }
      }
    }
  }, [selectedCustomerId, customers]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Müşteriler yüklenemedi');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error('Lütfen bir müşteri seçin');
      return;
    }

    if (!address.trim()) {
      toast.error('Lütfen adres girin');
      return;
    }

    if (latitude === '' || longitude === '') {
      toast.error('Lütfen konum bilgilerini girin');
      return;
    }

    try {
      setSubmitting(true);

      await journeyService.addStopToActiveJourney(
        journeyId,
        selectedCustomerId,
        address.trim(),
        Number(latitude),
        Number(longitude),
        serviceTimeMinutes ? Number(serviceTimeMinutes) : undefined,
        notes.trim() || undefined,
        arriveBetweenStart || undefined,
        arriveBetweenEnd || undefined
      );

      toast.success('Durak başarıyla eklendi! Optimizasyon gerekiyor.');
      onStopAdded();
      handleClose();
    } catch (error: any) {
      console.error('Error adding stop:', error);
      toast.error(error.message || 'Durak eklenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomerId(null);
    setAddress('');
    setLatitude('');
    setLongitude('');
    setServiceTimeMinutes('');
    setNotes('');
    setArriveBetweenStart('');
    setArriveBetweenEnd('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Yeni Durak Ekle</h2>
              <p className="text-sm text-gray-600">Aktif sefere yeni durak ekleyin</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri <span className="text-red-500">*</span>
            </label>
            {loadingCustomers ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              >
                <option value="">Müşteri seçin...</option>
                {customers.map((customer) => {
                  const isActiveInJourney = activeStopCustomerIds.includes(customer.id);
                  return (
                    <option
                      key={customer.id}
                      value={customer.id}
                      disabled={isActiveInJourney}
                    >
                      {customer.name} {isActiveInJourney ? '(Seferde aktif)' : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres <span className="text-red-500">*</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Teslimat adresi..."
              required
              disabled={submitting}
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlem <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="40.7128"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boylam <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="29.0469"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Service Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servis Süresi (dakika)
            </label>
            <input
              type="number"
              min="0"
              value={serviceTimeMinutes}
              onChange={(e) => setServiceTimeMinutes(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Varsayılan süre kullanılacak"
              disabled={submitting}
            />
          </div>

          {/* ✅ YENİ: Zaman Aralığı (Arrive Between) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Varış Zaman Aralığı (İsteğe Bağlı)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Başlangıç Saati</label>
                <input
                  type="time"
                  value={arriveBetweenStart}
                  onChange={(e) => setArriveBetweenStart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Bitiş Saati</label>
                <input
                  type="time"
                  value={arriveBetweenEnd}
                  onChange={(e) => setArriveBetweenEnd(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Örnek: 09:00 - 12:00 arası teslimat
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notlar
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="İsteğe bağlı notlar..."
              disabled={submitting}
            />
          </div>

          {/* Info Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Not:</strong> Durak eklendikten sonra rotanın yeniden optimize edilmesi gerekecektir.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ekleniyor...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Durak Ekle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
