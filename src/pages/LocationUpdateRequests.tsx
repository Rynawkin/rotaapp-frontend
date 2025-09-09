// src/pages/LocationUpdateRequests.tsx
// Not: Dosya önceki kapsamıyla tamdır; kısaltılmadı. Sadece API import uyumluluğu eklendi.
// - Bekleyen / Onaylanan / Reddedilen sekmeleri
// - Koordinatlar TAM (yuvarlamasız) gösterim
// - "Haritada aç" butonları (Google Maps)
// - Saatler Türkiye saati (Europe/Istanbul)
// - Onay / Red akışları ve modal’lar
// - API import: services/api.ts default/named fark etmeksizin çalışır.

import React, { useEffect, useMemo, useState } from 'react';

// 🔧 API import uyumlu: default varsa default’u, yoksa named export (api) veya tüm namespace’i kullanır.
import * as apiModule from '../services/api';
const http: any = (apiModule as any).default ?? (apiModule as any).api ?? apiModule;

import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  Search,
  RefreshCw,
  ExternalLink,
  Loader2
} from 'lucide-react';

// -------------------- Tipler --------------------
type Id = number;
type UtcISO = string; // API'den ISO gelir (UTC varsayıyoruz, TR'ye çevireceğiz)

type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PendingLocationUpdateRequestDto {
  id: Id;
  journeyId: number;
  journeyName: string;
  customerId: number;
  customerName: string;
  currentLatitude: number;     // DECIMAL(x,8) -> JS number
  currentLongitude: number;    // DECIMAL(y,8) -> JS number
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

  status: RequestStatus;         // 'Approved' | 'Rejected'
  approvedByName?: string | null;
  rejectionReason?: string | null;
  processedAt?: UtcISO | null;   // onay/red zamanı
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

// (1) Türkiye saatine çevir: API’den gelen tarih (Z var/yok) UTC kabul edilip Europe/Istanbul’a formatlanır.
const istanbulFormatter = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Europe/Istanbul'
});

function parseISOAsUTC(input: string): Date {
  if (!input) return new Date(NaN);
  // Z veya +03:00 gibi bir son ek yoksa UTC sayıp Z ekleyelim.
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

// (2) Koordinat gösterimi: ASLA yuvarlama yapma. Dize ise direkt göster; number ise String(value).
// Virgül varsa noktaya çeviriyoruz (ör: "40,803788" -> "40.803788")
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

// (3) Küçük UI yardımcıları
function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(' ');
}

// -------------------- API Katmanı --------------------
// NOT: http değişkeni axios instance’ı/dengi olmalı (services/api.ts’ten geliyor).

async function fetchPending(): Promise<PendingLocationUpdateRequestDto[]> {
  const { data } = await http.get('/workspace/location-update-requests/pending'); // 200: Pending listesi
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
  // Sekmeler
  const [tab, setTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');

  // Listeler
  const [pending, setPending] = useState<PendingLocationUpdateRequestDto[]>([]);
  const [approved, setApproved] = useState<HistoryLocationUpdateRequestDto[]>([]);
  const [rejected, setRejected] = useState<HistoryLocationUpdateRequestDto[]>([]);

  // Yükleniyor & Hata
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  // Arama
  const [search, setSearch] = useState<string>('');

  // Detay paneli (gerekirse genişletilebilir)
  const [selected, setSelected] = useState<
    PendingLocationUpdateRequestDto | HistoryLocationUpdateRequestDto | null
  >(null);

  // Onay / Red modalları
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveApplyNext, setApproveApplyNext] = useState<boolean>(false);
  const [approveNote, setApproveNote] = useState<string>('');

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  // İlk açılışta tüm sekmelerin verisini çekelim ki geçişte bekletmesin.
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

  // Sekmeye özel filtreli liste
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

  // Yenile
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

  // Onayla
  const handleApprove = async (id: Id) => {
    try {
      setLoading(true);
      await approveRequest(id, { applyToNextRoutes: approveApplyNext, note: approveNote || null });
      // Başarılı: listeleri tazele
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

  // Reddet
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
    <div className="mt-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="flex items-center gap-2">
        <span className="font-mono">
          {formatCoordRaw(lat)}, {formatCoordRaw(lng)}
        </span>
        <a
          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          href={gmapsLink(lat, lng)}
          target="_blank"
          rel="noreferrer"
          title="Haritada aç"
        >
          <ExternalLink className="w-4 h-4" />
          Haritada aç
        </a>
      </div>
    </div>
  );

  const renderItemCard = (it: PendingLocationUpdateRequestDto | HistoryLocationUpdateRequestDto) => {
    const isPending = (it as any).status === undefined;
    const status = (it as any).status as RequestStatus | undefined;

    return (
      <div
        key={`req-${it.id}`}
        className="rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition bg-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{it.customerName}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">{it.journeyName}</span>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              Talep: <b>{formatTR(it.createdAt)}</b>
            </span>
            {!isPending && (it as HistoryLocationUpdateRequestDto).processedAt && (
              <span>
                • İşlem: <b>{formatTR((it as HistoryLocationUpdateRequestDto).processedAt!)}</b>
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <div className="text-xs text-gray-500 mb-1">Talep Eden</div>
            <div className="inline-flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-gray-800">{it.requestedByName}</span>
            </div>
            {renderCoord('Mevcut Konum', it.currentLatitude, it.currentLongitude)}
            {renderCoord('Talep Edilen Konum', it.requestedLatitude, it.requestedLongitude)}
          </div>

          <div className="col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Mevcut Adres</div>
                <div className="text-gray-900">{it.currentAddress || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Talep Edilen Adres</div>
                <div className="text-gray-900">{it.requestedAddress || '-'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500 mb-1">Gerekçe</div>
                <div className="text-gray-900">{it.reason || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alt satır: Aksiyonlar veya durum */}
        <div className="mt-4 flex items-center justify-between">
          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2"
                onClick={() => { setSelected(it); setApproveOpen(true); }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Onayla
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-2"
                onClick={() => { setSelected(it); setRejectOpen(true); }}
              >
                <XCircle className="w-4 h-4" />
                Reddet
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <span
                className={classNames(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1',
                  status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                )}
              >
                {status === 'Approved' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}
              </span>

              {status === 'Approved' && (it as HistoryLocationUpdateRequestDto).approvedByName && (
                <span className="text-gray-600">
                  Onaylayan: <b>{(it as HistoryLocationUpdateRequestDto).approvedByName}</b>
                </span>
              )}
              {status === 'Rejected' && (it as HistoryLocationUpdateRequestDto).rejectionReason && (
                <span className="text-gray-600">
                  Red Nedeni: <b>{(it as HistoryLocationUpdateRequestDto).rejectionReason}</b>
                </span>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500">
            ID: <span className="font-mono">{it.id}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-semibold">Konum Güncelleme Talepleri</h1>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-gray-50"
          title="Yenile"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Yenile
        </button>
      </div>

      {/* Sekmeler */}
      <div className="mt-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {(['Pending', 'Approved', 'Rejected'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={classNames(
                'whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium',
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {t === 'Pending' ? 'Bekleyen' : t === 'Approved' ? 'Onaylanan' : 'Reddedilen'}
            </button>
          ))}
        </nav>
      </div>

      {/* Ara */}
      <div className="mt-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri, sefer, adres, gerekçe, koordinat vb. ara…"
            className="pl-9 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="mt-6 space-y-4">
        {errorText && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
            {errorText}
          </div>
        )}

        {loading && (
          <div className="text-gray-500 text-sm">Yükleniyor…</div>
        )}

        {!loading && filteredList.length === 0 && (
          <div className="text-gray-500 text-sm">Kayıt bulunamadı.</div>
        )}

        {!loading && filteredList.map(renderItemCard)}
      </div>

      {/* Onay Modal */}
      {approveOpen && selected && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold mb-1">Talebi Onayla</h3>
            <p className="text-sm text-gray-600">
              Bu işlem talep edilen koordinatları ilgili kayda uygulayacaktır.
            </p>

            <div className="mt-4 space-y-3">
              {renderCoord('Mevcut', (selected as any).currentLatitude, (selected as any).currentLongitude)}
              {renderCoord('Talep Edilen', (selected as any).requestedLatitude, (selected as any).requestedLongitude)}

              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={approveApplyNext}
                  onChange={(e) => setApproveApplyNext(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  Sonraki rotalara da uygula
                </span>
              </label>

              <div>
                <div className="text-xs text-gray-500 mb-1">Not (opsiyonel)</div>
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                  rows={3}
                  placeholder="Onay notu (opsiyonel)…"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 rounded-xl border hover:bg-gray-50"
                onClick={() => { setApproveOpen(false); setApproveApplyNext(false); setApproveNote(''); }}
              >
                İptal
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold mb-1">Talebi Reddet</h3>
            <p className="text-sm text-gray-600">
              Red durumunda talep kapatılacak.
            </p>

            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-1">Red Nedeni</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
                rows={4}
                placeholder="Neden reddedildi? (zorunlu)"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 rounded-xl border hover:bg-gray-50"
                onClick={() => { setRejectOpen(false); setRejectReason(''); }}
              >
                İptal
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-2"
                onClick={() => handleReject((selected as any).id)}
                disabled={loading}
              >
                <XCircle className="w-4 h-4" />
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
