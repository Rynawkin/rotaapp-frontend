// frontend/src/pages/LocationUpdateRequests.tsx

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { MapPin, User, Clock, CheckCircle, XCircle } from 'lucide-react';

interface LocationUpdateRequest {
  id: number;
  journeyId: number;
  journeyName: string;
  customerId: number;
  customerName: string;
  currentLatitude: number;
  currentLongitude: number;
  currentAddress: string;
  requestedLatitude: number;
  requestedLongitude: number;
  requestedAddress: string;
  reason: string;
  requestedByName: string;
  createdAt: string;
}

const LocationUpdateRequests: React.FC = () => {
  const [requests, setRequests] = useState<LocationUpdateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/workspace/location-update-requests/pending');
      setRequests(response.data);
    } catch (error) {
      console.error('Talepler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // Her 30 saniyede bir yenile
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId: number, updateFutureStops: boolean) => {
    try {
      await api.post(`/workspace/location-update-requests/${requestId}/approve`, {
        updateFutureStops
      });
      alert('Konum güncelleme talebi onaylandı');
      loadRequests();
    } catch (error) {
      alert('Talep onaylanamadı');
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId) return;
    
    try {
      await api.post(`/workspace/location-update-requests/${selectedRequestId}/reject`, {
        reason: rejectReason
      });
      alert('Talep reddedildi');
      setRejectModalOpen(false);
      setRejectReason('');
      setSelectedRequestId(null);
      loadRequests();
    } catch (error) {
      alert('Talep reddedilemedi');
    }
  };

  const openRejectModal = (requestId: number) => {
    setSelectedRequestId(requestId);
    setRejectModalOpen(true);
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Konum Güncelleme Talepleri ({requests.length})
        </h1>
        <button
          onClick={loadRequests}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Yenile
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Bekleyen konum güncelleme talebi bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.customerName}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {request.requestedByName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(request.createdAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Bekliyor
                </span>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Güncelleme Nedeni:</p>
                <p className="text-gray-900">{request.reason}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Mevcut Konum
                  </h4>
                  <p className="text-sm text-gray-900 mb-1">{request.currentAddress}</p>
                  <p className="text-xs text-gray-500">
                    Lat: {request.currentLatitude.toFixed(6)}, Lng: {request.currentLongitude.toFixed(6)}
                  </p>
                </div>

                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Talep Edilen Konum
                  </h4>
                  <p className="text-sm text-gray-900 mb-1">{request.requestedAddress}</p>
                  <p className="text-xs text-gray-500">
                    Lat: {request.requestedLatitude.toFixed(6)}, Lng: {request.requestedLongitude.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    id={`future-${request.id}`}
                    className="rounded"
                  />
                  <span>Gelecekteki rotaları da güncelle</span>
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const checkbox = document.getElementById(`future-${request.id}`) as HTMLInputElement;
                      handleApprove(request.id, checkbox?.checked || false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Onayla
                  </button>
                  <button
                    onClick={() => openRejectModal(request.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Talebi Reddet</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Reddetme nedenini girin..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectReason('');
                  setSelectedRequestId(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationUpdateRequests;