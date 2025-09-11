// src/pages/LocationUpdateRequests.tsx
import React, { useEffect, useMemo, useState } from 'react';

import { api as http } from '../services/api';

import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  Search,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  Calendar,
  Navigation
} from 'lucide-react';

// -------------------- Tipler --------------------
type Id = number;
type UtcISO = string;
type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PendingLocationUpdateRequestDto {
  id: Id;
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
  createdAt: UtcISO;
}

export interface HistoryLocationUpdateRequestDto {
  id: Id;
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
  createdAt: UtcISO;
  status: RequestStatus;
  approvedByName?: string | null;
  rejectionReason?: string | null;
  processedAt?: UtcISO | null;
}

type HistoryStatusTab = 'Approved' | 'Rejected';
type ApprovePayload = {
  applyToNextRoutes: boolean;
  note?: string | null;
};
type RejectPayload = {
  rejectionReason: string;
};

// -------------------- Yardımcılar --------------------
const istanbulFormatter = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Europe/Istanbul'
});

function parseISOAsUTC(input: string): Date {
  if (!input) return new Date(NaN);
  const hasTZ = /Z$|[+\-]\d\d:\d\d$/.test(input);
  const iso = hasTZ ? input : (input + 'Z');
  return new Date(iso);
}

function formatTR(input?: string | null): string {
  if (!input) return '-';
  const d = parseISOAsUTC(input);
  if (isNaN(d.getTime())) return '-';
  return istanbulFormatter.format(d);
}

function formatCoordRaw(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : String(v);
  return s.replace(',', '.');
}

function gmapsLink(lat: number | string, lng: number | string): string {
  const la = formatCoordRaw(lat);
  const lo = formatCoordRaw(lng);
  return `https://www.google.com/maps?q=${la},${lo}`;
}

function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(' ');
}

// -------------------- API Katmanı --------------------
async function fetchPending(): Promise<PendingLocationUpdateRequestDto[]> {
  const { data } = await http.get('/workspace/location-update-requests/pending');
  return data ?? [];
}

async function fetchHistory(status: HistoryStatusTab): Promise<HistoryLocationUpdateRequestDto[]> {
  const { data } = await http.get('/workspace/location-update-requests/history', { params: { status }});
  return data ?? [];
}

async function approveRequest(id: Id, payload: ApprovePayload): Promise<void> {
  await http.post(`/workspace/location-update-requests/${id}/approve`, payload);
}

async function rejectRequest(id: Id, payload: RejectPayload): Promise<void> {
  await http.post(`/workspace/location-update-requests/${id}/reject`, payload);
}

// -------------------- Bileşen --------------------
const LocationUpdateRequests: React.FC = () => {
  const [tab, setTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [pending, setPending] = useState<PendingLocationUpdateRequestDto[]>([]);
  const [approved, setApproved] = useState<HistoryLocationUpdateRequestDto[]>([]);
  const [rejected, setRejected] = useState<HistoryLocationUpdateRequestDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selected, setSelected] = useState<
    PendingLocationUpdateRequestDto | HistoryLocationUpdateRequestDto | null
  >(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveApplyNext, setApproveApplyNext] = useState<boolean>(false);
  const [approveNote, setApproveNote] = useState<string>('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorText('');
      try {
        const [p, a, r] = await Promise.all([
          fetchPending(),
          fetchHistory('Approved'),
          fetchHistory('Rejected'),
        ]);
        setPending(p);
        setApproved(a);
        setRejected(r);
      } catch (err: any) {
        console.error('İlk yükleme hatası:', err);
        setErrorText('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list =
      tab === 'Pending' ? pending :
      tab === 'Approved' ? approved : rejected;

    if (!q) return list;

    const textOf = (it: any) => [
      it?.journeyName, it?.customerName, it?.requestedByName,
      it?.reason, it?.currentAddress, it?.requestedAddress,
      formatCoordRaw(it?.currentLatitude),
      formatCoordRaw(it?.currentLongitude),
      formatCoordRaw(it?.requestedLatitude),
      formatCoordRaw(it?.requestedLongitude),
      formatTR(it?.createdAt),
      formatTR((it as any)?.processedAt)
    ].filter(Boolean).join(' ').toLowerCase();

    return list.filter(x => textOf(x).includes(q));
  }, [tab, pending, approved, rejected, search]);

  const refresh = async () => {
    setLoading(true);
    setErrorText('');
    try {
      if (tab === 'Pending') {
        setPending(await fetchPending());
      } else if (tab === 'Approved') {
        setApproved(await fetchHistory('Approved'));
      } else {
        setRejected(await fetchHistory('Rejected'));
      }
    } catch (err: any) {
      console.error('Yenileme hatası:', err);
      setErrorText('Veriler yenilenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: Id) => {
    try {
      setLoading(true);
      await approveRequest(id, { applyToNextRoutes: approveApplyNext, note: approveNote || null });
      const [p, a] = await Promise.all([fetchPending(), fetchHistory('Approved')]);
      setPending(p);
      setApproved(a);
      setApproveOpen(false);
      setSelected(null);
      setApproveApplyNext(false);
      setApproveNote('');
    } catch (err: any) {
      console.error('Onay hatası:', err);
      alert('Onay işlemi başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: Id) => {
    if (!rejectReason.trim()) {
      alert('Lütfen bir red nedeni girin.');
      return;
    }
    try {
      setLoading(true);
      await rejectRequest(id, { rejectionReason: rejectReason.trim() });
      const [p, r] = await Promise.all([fetchPending(), fetchHistory('Rejected')]);
      setPending(p);
      setRejected(r);
      setRejectOpen(false);
      setSelected(null);
      setRejectReason('');
    } catch (err: any) {
      console.error('Red hatası:', err);
      alert('Red işlemi başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // ------------ Render Yardımcı Parçalar ------------
  const renderCoord = (label: string, lat: number, lng: number) => (
    <div className="space-y-1">
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-gray-800">
          {formatCoordRaw(lat)}, {formatCoordRaw(lng)}
        </span>
        <button
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
          onClick={() => window.open(gmapsLink(lat, lng), '_blank')}
          type="button"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Harita</span>
        </button>
      </div>
    </div>
  );

  const renderItemCard = (it: PendingLocationUpdateRequestDto | HistoryLocationUpdateRequestDto) => {
    const isPending = (it as any).status === undefined;
    const status = (it as any).status as RequestStatus | undefined;

    return (
      <div
        key={`req-${it.id}`}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        {/* Üst Başlık */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={classNames(
                "px-2 py-1 rounded-full text-xs font-medium",
                isPending ? "bg-yellow-100 text-yellow-800" :
                status === 'Approved' ? "bg-green-100 text-green-800" :
                "bg-red-100 text-red-800"
              )}>
                {isPending ? 'Bekliyor' : status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}
              </div>
              <span className="text-xs text-gray-500">#{it.id}</span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {it.customerName}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Navigation className="w-4 h-4 text-gray-400" />
                <span>{it.journeyName}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-gray-400" />
                <span>{it.requestedByName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatTR(it.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* İçerik Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
          {/* Sol Kolon - Mevcut Konum */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Mevcut Konum
            </h4>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Adres</div>
                <div className="text-sm text-gray-800">{it.currentAddress || '-'}</div>
              </div>
              {renderCoord('Koordinatlar', it.currentLatitude, it.currentLongitude)}
            </div>
          </div>

          {/* Sağ Kolon - Talep Edilen Konum */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Talep Edilen Konum
            </h4>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Adres</div>
                <div className="text-sm text-gray-800">{it.requestedAddress || '-'}</div>
              </div>
              {renderCoord('Koordinatlar', it.requestedLatitude, it.requestedLongitude)}
            </div>
          </div>
        </div>

        {/* Gerekçe */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-700 mb-1">Güncelleme Gerekçesi</div>
              <div className="text-sm text-gray-800">{it.reason || '-'}</div>
            </div>
          </div>
        </div>

        {/* Alt Aksiyonlar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                onClick={() => { setSelected(it); setApproveOpen(true); }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Onayla
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                onClick={() => { setSelected(it); setRejectOpen(true); }}
              >
                <XCircle className="w-4 h-4" />
                Reddet
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              {status === 'Approved' && (it as HistoryLocationUpdateRequestDto).approvedByName && (
                <div className="text-gray-600">
                  <span className="font-medium">Onaylayan:</span> {(it as HistoryLocationUpdateRequestDto).approvedByName}
                  {(it as HistoryLocationUpdateRequestDto).processedAt && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({formatTR((it as HistoryLocationUpdateRequestDto).processedAt!)})
                    </span>
                  )}
                </div>
              )}
              {status === 'Rejected' && (it as HistoryLocationUpdateRequestDto).rejectionReason && (
                <div className="text-gray-600">
                  <span className="font-medium">Red Nedeni:</span> {(it as HistoryLocationUpdateRequestDto).rejectionReason}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Başlık */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Konum Güncelleme Talepleri</h1>
              <p className="text-sm text-gray-600 mt-1">Müşteri konum güncelleme taleplerini yönetin</p>
            </div>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Yenile
            </button>
          </div>
        </div>

        {/* Sekmeler ve Arama */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Sekmeler */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex gap-8">
              {(['Pending', 'Approved', 'Rejected'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={classNames(
                    'whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium transition-colors',
                    tab === t
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {t === 'Pending' && <Clock className="w-4 h-4" />}
                    {t === 'Approved' && <CheckCircle2 className="w-4 h-4" />}
                    {t === 'Rejected' && <XCircle className="w-4 h-4" />}
                    <span>{t === 'Pending' ? 'Bekleyen' : t === 'Approved' ? 'Onaylanan' : 'Reddedilen'}</span>
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {tab === 'Pending' ? pending.length : tab === 'Approved' ? approved.length : rejected.length}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Arama */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Müşteri, sefer, adres veya koordinat ara..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="space-y-4">
          {errorText && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {errorText}
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          )}

          {!loading && filteredList.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Kayıt bulunamadı</p>
            </div>
          )}

          {!loading && filteredList.map(renderItemCard)}
        </div>

        {/* Onay Modal */}
        {approveOpen && selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Talebi Onayla</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-xs font-medium text-gray-600">Mevcut Konum:</span>
                        <p className="font-mono text-sm">{formatCoordRaw((selected as any).currentLatitude)}, {formatCoordRaw((selected as any).currentLongitude)}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-600">Yeni Konum:</span>
                        <p className="font-mono text-sm text-blue-600 font-medium">
                          {formatCoordRaw((selected as any).requestedLatitude)}, {formatCoordRaw((selected as any).requestedLongitude)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approveApplyNext}
                      onChange={(e) => setApproveApplyNext(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Sonraki rotalara da uygula
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Not (opsiyonel)
                    </label>
                    <textarea
                      value={approveNote}
                      onChange={(e) => setApproveNote(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Onay notu..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                <button
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  onClick={() => { setApproveOpen(false); setApproveApplyNext(false); setApproveNote(''); }}
                >
                  İptal
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                  onClick={() => handleApprove((selected as any).id)}
                  disabled={loading}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Onayla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Red Modal */}
        {rejectOpen && selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Talebi Reddet</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Red Nedeni <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={4}
                    placeholder="Red nedenini açıklayın..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                <button
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  onClick={() => { setRejectOpen(false); setRejectReason(''); }}
                >
                  İptal
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium"
                  onClick={() => handleReject((selected as any).id)}
                  disabled={loading || !rejectReason.trim()}
                >
                  <XCircle className="w-4 h-4" />
                  Reddet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationUpdateRequests;