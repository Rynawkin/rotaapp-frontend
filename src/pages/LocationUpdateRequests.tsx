// frontend/src/pages/LocationUpdateRequests.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { MapPin, User, Clock, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';

type ISODateString = string;

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
  createdAt: ISODateString;
}

const formatDate = (iso: ISODateString) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const LocationUpdateRequests: React.FC = () => {
  const [requests, setRequests] = useState<LocationUpdateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Per-row "future stops" switch (default true)
  const [updateFutureStopsMap, setUpdateFutureStopsMap] = useState<Record<number, boolean>>({});

  const setDefaultFutureStopsIfMissing = (items: LocationUpdateRequest[]) => {
    setUpdateFutureStopsMap(prev => {
      const next = { ...prev };
      for (const r of items) {
        if (next[r.id] === undefined) next[r.id] = true;
      }
      return next;
    });
  };

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      // BE: GET /api/workspace/location-update-requests/pending
      const res = await api.get('/workspace/location-update-requests/pending');
      const data = Array.isArray(res?.data) ? res.data as LocationUpdateRequest[] : [];
      setRequests(data);
      setDefaultFutureStopsIfMissing(data);
      setLastUpdatedAt(new Date());
    } catch (err: any) {
      // Axios-vari error decode
      const status = err?.response?.status;
      const msg =
        status === 401
          ? 'Yetkisiz. Lütfen giriş yapın.'
          : status === 403
          ? 'Bu sayfayı görüntüleme yetkiniz yok (dispatcher/admin).'
          : `Talepler yüklenemedi. Sunucu hatası${status ? ` (HTTP ${status})` : ''}.`;
      setError(msg);
      // Loglamak istersen:
      // console.error('Error fetching pending location requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // 30 sn'de bir yenile
    const int = setInterval(loadRequests, 30000);
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openRejectModal = (requestId: number) => {
    setSelectedRequestId(requestId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedRequestId(null);
    setRejectReason('');
  };

  const handleApprove = async (requestId: number) => {
    try {
      const updateFutureStops = !!updateFutureStopsMap[requestId];
      await api.post(`/workspace/location-update-requests/${requestId}/approve`, {
        updateFutureStops,
      });
      // Basit bildirim
      alert('Konum güncelleme talebi onaylandı.');
      // Listeyi tazele
      loadRequests();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 400
          ? 'Talep onaylanamadı (geçersiz istek).'
          : status === 404
          ? 'Talep bulunamadı.'
          : `Talep onaylanamadı${status ? ` (HTTP ${status})` : ''}.`;
      alert(msg);
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId) return;
    if (!rejectReason.trim()) {
      alert('Lütfen red sebebi giriniz.');
      return;
    }
    try {
      await api.post(`/workspace/location-update-requests/${selectedRequestId}/reject`, {
        reason: rejectReason,
      });
      alert('Talep reddedildi.');
      closeRejectModal();
      loadRequests();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 400
          ? 'Talep reddedilemedi (geçersiz istek).'
          : status === 404
          ? 'Talep bulunamadı.'
          : `Talep reddedilemedi${status ? ` (HTTP ${status})` : ''}.`;
      alert(msg);
    }
  };

  const googleMapsLink = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`;

  const hasData = requests.length > 0;

  const headerRight = useMemo(() => {
    return (
      <div className="flex items-center gap-2">
        {lastUpdatedAt && (
          <span className="text-xs text-gray-500">
            Son güncelleme: {lastUpdatedAt.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={loadRequests}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          title="Yenile"
        >
          <RefreshCcw className="w-4 h-4" />
          Yenile
        </button>
      </div>
    );
  }, [lastUpdatedAt]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Konum Güncelleme Talepleri {hasData ? `(${requests.length})` : ''}
        </h1>
        {headerRight}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !hasData && !error && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasData && (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
          <p className="text-gray-600">Bekleyen konum güncelleme talebi bulunmuyor.</p>
        </div>
      )}

      {/* List */}
      {!loading && !error && hasData && (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-900">Talep #{r.id}</span> •{' '}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(r.createdAt)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700">
                    <div>
                      <span className="font-medium">Sefer:</span>{' '}
                      {r.journeyName || `Journey #${r.journeyId}`}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Müşteri:</span> {r.customerName || `#${r.customerId}`}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Talep Eden:</span> {r.requestedByName}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold">Mevcut Konum</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <div>{r.currentAddress}</div>
                        <div className="text-gray-500">
                          ({r.currentLatitude.toFixed(6)}, {r.currentLongitude.toFixed(6)})
                        </div>
                        <a
                          className="text-blue-600 hover:underline"
                          href={googleMapsLink(r.currentLatitude, r.currentLongitude)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Haritada aç
                        </a>
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold">Önerilen Yeni Konum</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <div>{r.requestedAddress}</div>
                        <div className="text-gray-500">
                          ({r.requestedLatitude.toFixed(6)}, {r.requestedLongitude.toFixed(6)})
                        </div>
                        <a
                          className="text-blue-600 hover:underline"
                          href={googleMapsLink(r.requestedLatitude, r.requestedLongitude)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Haritada aç
                        </a>
                      </div>
                    </div>
                  </div>

                  {r.reason && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Sebep:</span> {r.reason}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-64 shrink-0">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!updateFutureStopsMap[r.id]}
                        onChange={(e) =>
                          setUpdateFutureStopsMap((prev) => ({
                            ...prev,
                            [r.id]: e.target.checked,
                          }))
                        }
                      />
                      Gelecek durakları da güncelle
                    </label>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                        title="Onayla"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Onayla
                      </button>

                      <button
                        onClick={() => openRejectModal(r.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                        title="Reddet"
                      >
                        <XCircle className="w-4 h-4" />
                        Reddet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeRejectModal}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Talebi Reddet</h2>
            <p className="mt-1 text-sm text-gray-600">
              Lütfen red sebebini belirtiniz.
            </p>

            <textarea
              className="mt-3 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Red sebebi..."
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeRejectModal}
                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
              >
                Vazgeç
              </button>
              <button
                onClick={handleReject}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
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
