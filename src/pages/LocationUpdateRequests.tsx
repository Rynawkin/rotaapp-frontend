// frontend/src/pages/LocationUpdateRequests.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { MapPin, User, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

type StatusTab = 'Pending' | 'Approved' | 'Rejected';

type BaseItem = {
  id: number;
  journeyId: number;
  journeyName: string;
  customerId: number;
  customerName: string;
  currentLatitude: number;
  currentLongitude: number;
  currentAddress: string; // Talep sırasında sürücünün yazdığı/gelmiş olan adres – koordinat gibi görünüyorsa gizlenecek
  requestedLatitude: number;
  requestedLongitude: number;
  reason: string;
  requestedByName: string;
  createdAt: string; // ISO
};

type HistoryExtras = {
  status: 'Approved' | 'Rejected';
  approvedByName?: string;
  rejectionReason?: string;
  processedAt?: string; // ISO
};

type RequestItem = BaseItem & Partial<HistoryExtras>;

const fmtCoord = (n: number) =>
  // TR formatında virgüllü göster (ekranda); backend’e hep number (.) gider
  n.toLocaleString('tr-TR', { minimumFractionDigits: 6, maximumFractionDigits: 6 });

const looksLikeLatLngText = (s?: string) => {
  if (!s) return false;
  const t = s.trim();
  // "41.12345, 29.12345" veya virgüllü ondalık "41,123 - 29,123" gibi varyasyonları yakala
  return /^-?\d+([.,]\d+)?\s*,\s*-?\d+([.,]\d+)?$/.test(t);
};

const safeAddress = (s?: string) => (s && !looksLikeLatLngText(s) ? s : '—');

const StatusPill: React.FC<{ status: StatusTab | 'Approved' | 'Rejected' }> = ({ status }) => {
  if (status === 'Pending') {
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Bekliyor</span>;
  }
  if (status === 'Approved') {
    return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Onaylandı</span>;
  }
  return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Reddedildi</span>;
};

const LocationUpdateRequests: React.FC = () => {
  const [active, setActive] = useState<StatusTab>('Pending');

  const [pending, setPending] = useState<RequestItem[]>([]);
  const [approved, setApproved] = useState<RequestItem[]>([]);
  const [rejected, setRejected] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [applyFutureStops, setApplyFutureStops] = useState(true); // onay tikinin varsayılanı

  const list = useMemo(() => {
    if (active === 'Pending') return pending;
    if (active === 'Approved') return approved;
    return rejected;
  }, [active, pending, approved, rejected]);

  const load = async (which: StatusTab = active) => {
    setLoading(true);
    try {
      if (which === 'Pending') {
        // mevcut endpoint
        const res = await api.get('/workspace/location-update-requests/pending');
        setPending(res.data as RequestItem[]);
      } else {
        // history endpoint (backend’de /history?status=Approved|Rejected)
        const res = await api.get('/workspace/location-update-requests/history', {
          params: { status: which },
        });
        const data = (res.data ?? []) as RequestItem[];
        if (which === 'Approved') setApproved(data);
        if (which === 'Rejected') setRejected(data);
      }
    } catch (err) {
      console.error('Talepler yüklenemedi:', err);
      if (which === 'Pending') setPending([]);
      if (which === 'Approved') setApproved([]);
      if (which === 'Rejected') setRejected([]);
    } finally {
      setLoading(false);
    }
  };

  // ilk yükleme + 30sn’de bir sadece aktif sekmeyi yenile
  useEffect(() => {
    load(active);
    const id = setInterval(() => load(active), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleApprove = async (requestId: number) => {
    try {
      await api.post(`/workspace/location-update-requests/${requestId}/approve`, {
        updateFutureStops: applyFutureStops,
      });
      alert('Konum güncelleme talebi onaylandı');
      // onay sonrası bekleyen listeden düşer; aktif sekme Approved ise onu da yenileyelim
      await Promise.all([load('Pending'), active === 'Approved' ? load('Approved') : Promise.resolve()]);
    } catch (error) {
      alert('Talep onaylanamadı');
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequestId) return;
    try {
      await api.post(`/workspace/location-update-requests/${selectedRequestId}/reject`, {
        reason: rejectReason,
      });
      alert('Talep reddedildi');
      setRejectModalOpen(false);
      setRejectReason('');
      setSelectedRequestId(null);
      await Promise.all([load('Pending'), active === 'Rejected' ? load('Rejected') : Promise.resolve()]);
    } catch (error) {
      alert('Talep reddedilemedi');
    }
  };

  const openRejectModal = (requestId: number) => {
    setSelectedRequestId(requestId);
    setRejectModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Başlık + yenile */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Konum Güncelleme Talepleri</h1>
        <button
          onClick={() => load(active)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2">
        {(['Pending', 'Approved', 'Rejected'] as StatusTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium',
              active === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ].join(' ')}
          >
            {tab === 'Pending' ? 'Bekleyen' : tab === 'Approved' ? 'Onaylanan' : 'Reddedilen'}
          </button>
        ))}
      </div>

      {/* Açıklama satırı */}
      {active === 'Pending' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
          <p className="mb-1">
            <b>“Sonraki rotalara uygula”</b> tikliyse, onay sırasında **şimdiden oluşturulmuş** gelecekteki durakların
            koordinatları da güncellenmesi için backende <code>UpdateFutureStops=true</code> gönderilir. Müşteri kaydı
            zaten güncelleneceği için yeni oluşturulacak rotalar otomatik doğru koordinatla oluşur.
          </p>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-4">
        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              {active === 'Pending'
                ? 'Bekleyen konum güncelleme talebi bulunmuyor.'
                : active === 'Approved'
                ? 'Onaylanan talep bulunmuyor.'
                : 'Reddedilen talep bulunmuyor.'}
            </p>
          </div>
        ) : (
          list.map((r) => (
            <div key={r.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{r.customerName}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {r.requestedByName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(r.createdAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  {r.journeyName && (
                    <p className="text-sm text-gray-500 mt-1">Rota: {r.journeyName}</p>
                  )}
                </div>
                <StatusPill status={(r as any).status ?? active} />
              </div>

              {/* Neden */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Güncelleme Nedeni</p>
                <p className="text-gray-900">{r.reason || '—'}</p>
              </div>

              {/* Koordinatlar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    Sürücünün bulunduğu konum
                  </div>
                  <div className="text-gray-900 font-mono">
                    {fmtCoord(r.currentLatitude)}, {fmtCoord(r.currentLongitude)}
                  </div>
                  {/* Adres alanı koordinat gibi ise göstermiyoruz */}
                  <div className="text-sm text-gray-500 mt-1">Adres: {safeAddress(r.currentAddress)}</div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    Talep edilen yeni konum
                  </div>
                  <div className="text-gray-900 font-mono">
                    {fmtCoord(r.requestedLatitude)}, {fmtCoord(r.requestedLongitude)}
                  </div>
                  {/* NOT: İstenmediği için talep edilen adresi göstermiyoruz */}
                </div>
              </div>

              {/* Onay/Red butonları sadece Bekleyen'de */}
              {active === 'Pending' && (
                <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={applyFutureStops}
                      onChange={(e) => setApplyFutureStops(e.target.checked)}
                    />
                    Sonraki rotalara da uygula (varsa, önceden planlanmış durakların koordinatlarını günceller)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Onayla
                    </button>
                    <button
                      onClick={() => openRejectModal(r.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reddet
                    </button>
                  </div>
                </div>
              )}

              {/* Onaylanan/Reddedilen detayları */}
              {active !== 'Pending' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-600 mb-1">İşlem Tarihi</div>
                    <div className="text-gray-900">
                      {(r.processedAt && new Date(r.processedAt).toLocaleString('tr-TR')) || '—'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-600 mb-1">
                      {active === 'Approved' ? 'Onaylayan' : 'İşlemi Yapan'}
                    </div>
                    <div className="text-gray-900">{r.approvedByName || '—'}</div>
                  </div>
                  {active === 'Rejected' && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-600 mb-1">Red Nedeni</div>
                      <div className="text-gray-900">{r.rejectionReason || '—'}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Red Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Talebi Reddet</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Reddetme nedenini girin."
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
                onClick={handleRejectConfirm}
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
