// src/pages/LocationUpdateRequests.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import {
  CheckCircle2,
  XCircle,
  MapPin,
  RefreshCw,
  Clock3,
  Loader2,
  AlertTriangle,
  Filter,
  ExternalLink
} from 'lucide-react';

/**
 * Bu sayfa, Şoför Konum Güncelleme Taleplerinin yönetimi için admin/dispatcher panelidir.
 * - Bekleyen talepler (onayla / reddet)
 * - Geçmiş: Onaylananlar, Reddedilenler
 * - TR saat dilimi gösterimi
 * - Koordinatları tam (yuvarlamasız) gösterim + Haritada aç butonu
 * - "Sonraki rotalara da uygula" seçeneği
 *
 * ÖNEMLİ: Koordinatlar asla toFixed / toLocaleString ile formatlanmıyor.
 *         Her zaman Number.toString() veya gelen string olduğu gibi gösteriliyor.
 */

// === Types ===
type Status = 'Pending' | 'Approved' | 'Rejected';

export interface LocationUpdateRequestDto {
  id: number;
  workspaceId?: number;
  journeyId: number;
  journeyName: string;

  journeyStopId?: number | null;
  customerId: number;
  customerName: string;

  currentLatitude: number | string;
  currentLongitude: number | string;
  // Adres alanları bilinçli olarak gösterilmeyecek; koordinat yeterli
  currentAddress?: string | null;

  requestedLatitude: number | string;
  requestedLongitude: number | string;
  requestedAddress?: string | null;

  reason?: string | null;

  requestedById?: string | null;
  requestedByName: string;

  approvedById?: string | null;
  approvedByName?: string | null;
  rejectionReason?: string | null;

  createdAt: string;   // ISO
  updatedAt?: string | null;
  processedAt?: string | null;

  status: Status;
}

// === Helpers ===

// TR/İstanbul saat diliminde tarih/saat
const trDateTime = new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

// Null/undefined güvenli tarih formatlayıcı
function formatTR(iso?: string | null): string {
  if (!iso) return '-';
  // Backend UTC ISO (Z) gönderiyorsa doğru +03 gösterilir
  return trDateTime.format(new Date(iso));
}

// Sayıyı/stringi olduğu gibi (YUVARLAMADAN) yazıya çevir
function exactNumberString(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    // DİKKAT: toFixed, toLocaleString vb. KULLANMIYORUZ.
    // .toString() JS tarafından bilimsel gösterime kaçmadan güvenle verir (double hassasiyeti kadar)
    return v.toString();
  }
  // String ise aynen koru (virgül gelse bile DOKUNMA)
  return (v as string).trim();
}

// Google Maps linki üret (harita parametresi noktayla çalışır)
function toGoogleMaps(lat: number | string, lng: number | string): string {
  const latRaw = exactNumberString(lat).replace(',', '.');
  const lngRaw = exactNumberString(lng).replace(',', '.');
  return `https://www.google.com/maps?q=${latRaw},${lngRaw}`;
}

// Erişilebilir buton
function SmallButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props;
  return (
    <button
      {...rest}
      className={
        'inline-flex items-center gap-1 px-2 py-1 text-sm rounded border hover:bg-gray-50 ' +
        className
      }
    />
  );
}

// === API ===

async function fetchPending(): Promise<LocationUpdateRequestDto[]> {
  const { data } = await api.get('/workspace/location-update-requests/pending');
  return data;
}

async function fetchHistory(status: Exclude<Status, 'Pending'>): Promise<LocationUpdateRequestDto[]> {
  const { data } = await api.get('/workspace/location-update-requests/history', {
    params: { status }
  });
  return data;
}

async function approveRequest(
  id: number,
  payload: { applyToNextRoutes: boolean }
): Promise<void> {
  await api.post(`/workspace/location-update-requests/${id}/approve`, payload);
}

async function rejectRequest(
  id: number,
  payload: { rejectionReason: string }
): Promise<void> {
  await api.post(`/workspace/location-update-requests/${id}/reject`, payload);
}

// === UI ===

type TabKey = 'pending' | 'approved' | 'rejected';

export default function LocationUpdateRequestsPage() {
  const [active, setActive] = useState<TabKey>('pending');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LocationUpdateRequestDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setError(null);
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    try {
      let data: LocationUpdateRequestDto[] = [];
      if (tab === 'pending') {
        data = await fetchPending();
      } else if (tab === 'approved') {
        data = await fetchHistory('Approved');
      } else {
        data = await fetchHistory('Rejected');
      }
      // Güvenlik: koordinatları stringe çevirme YAPMIYORUZ; ham değeri koruyoruz.
      setItems(data ?? []);
    } catch (e: any) {
      console.error('Talepler yüklenemedi:', e);
      setError(e?.message || 'Talepler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(active);
    return () => controllerRef.current?.abort();
  }, [active, load]);

  const hasData = items && items.length > 0;

  return (
    <div className="p-4 md:p-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Konum Güncelleme Talepleri</h1>
        <div className="flex items-center gap-2">
          <SmallButton onClick={() => load(active)}>
            <RefreshCw className="w-4 h-4" />
            Yenile
          </SmallButton>
        </div>
      </header>

      <nav className="flex gap-2 mb-4">
        <TabButton active={active === 'pending'} onClick={() => setActive('pending')}>
          Bekleyenler
        </TabButton>
        <TabButton active={active === 'approved'} onClick={() => setActive('approved')}>
          Onaylananlar
        </TabButton>
        <TabButton active={active === 'rejected'} onClick={() => setActive('rejected')}>
          Reddedilenler
        </TabButton>
      </nav>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded p-3">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Yükleniyor...
        </div>
      ) : !hasData ? (
        <div className="text-gray-600">Bu sekmede gösterilecek talep bulunamadı.</div>
      ) : (
        <RequestsTable
          tab={active}
          rows={items}
          onActionDone={() => load(active)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'px-3 py-1.5 rounded border ' +
        (active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'border-gray-300 hover:bg-gray-50')
      }
    >
      {children}
    </button>
  );
}

function RequestsTable({
  tab,
  rows,
  onActionDone
}: {
  tab: TabKey;
  rows: LocationUpdateRequestDto[];
  onActionDone: () => void;
}) {
  return (
    <div className="overflow-auto border rounded">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr className="text-left">
            <Th>ID</Th>
            <Th>Sefer</Th>
            <Th>Müşteri</Th>
            <Th>Mevcut Koordinat</Th>
            <Th>Talep Edilen Koordinat</Th>
            <Th>Gerekçe</Th>
            <Th>Talep Eden</Th>
            <Th>Talep Saati</Th>
            {tab !== 'pending' && <Th>İşlem</Th>}
            {tab !== 'pending' && <Th>İşlem Saati</Th>}
            {tab !== 'pending' && <Th>İşlemi Yapan</Th>}
            {tab === 'pending' && <Th className="text-right">İşlemler</Th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <Td>{r.id}</Td>
              <Td>
                <div className="flex flex-col">
                  <span className="font-medium">#{r.journeyId}</span>
                  <span className="text-gray-600">{r.journeyName}</span>
                </div>
              </Td>
              <Td>
                <div className="flex flex-col">
                  <span className="font-medium">#{r.customerId}</span>
                  <span className="text-gray-600">{r.customerName}</span>
                </div>
              </Td>

              {/* Mevcut koordinat + Haritada Aç */}
              <Td>
                <CoordCell
                  lat={r.currentLatitude}
                  lng={r.currentLongitude}
                  label="Mevcut"
                />
              </Td>

              {/* Talep edilen koordinat + Haritada Aç */}
              <Td>
                <CoordCell
                  lat={r.requestedLatitude}
                  lng={r.requestedLongitude}
                  label="Talep"
                />
              </Td>

              <Td style={{ maxWidth: 280 }}>
                {r.reason ? <span title={r.reason}>{r.reason}</span> : '-'}
              </Td>

              <Td>{r.requestedByName || '-'}</Td>
              <Td>
                <span title={r.createdAt}>{formatTR(r.createdAt)}</span>
              </Td>

              {tab !== 'pending' && (
                <>
                  <Td className={r.status === 'Approved' ? 'text-green-700' : 'text-red-700'}>
                    {r.status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}
                  </Td>
                  <Td>
                    <span title={r.processedAt || ''}>
                      {formatTR(r.processedAt || null)}
                    </span>
                  </Td>
                  <Td>
                    {r.status === 'Approved'
                      ? r.approvedByName || '-'
                      : r.rejectionReason || '-'}
                  </Td>
                </>
              )}

              {tab === 'pending' && (
                <Td className="text-right">
                  <ApproveRejectControls row={r} onDone={onActionDone} />
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={'px-3 py-2 font-medium text-gray-700 ' + className}>{children}</th>
  );
}
function Td({
  children,
  className = '',
  style
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td className={'px-3 py-2 align-top ' + className} style={style}>
      {children}
    </td>
  );
}

/**
 * Koordinat hücresi:
 * - Tam sayı gösterimi (yuvarlama YOK)
 * - "Haritada aç" (Google Maps) butonu
 */
function CoordCell({
  lat,
  lng,
  label
}: {
  lat: number | string;
  lng: number | string;
  label: string;
}) {
  const latText = useMemo(() => exactNumberString(lat), [lat]);
  const lngText = useMemo(() => exactNumberString(lng), [lng]);
  const mapsUrl = useMemo(() => toGoogleMaps(lat, lng), [lat, lng]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col">
        <span className="tabular-nums">{latText}</span>
        <span className="tabular-nums">{lngText}</span>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded border hover:bg-gray-50"
        title={`${label} konumu haritada aç`}
      >
        <MapPin className="w-4 h-4" />
        <span>Haritada aç</span>
        <ExternalLink className="w-3 h-3 opacity-70" />
      </a>
    </div>
  );
}

function ApproveRejectControls({
  row,
  onDone
}: {
  row: LocationUpdateRequestDto;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [applyToNext, setApplyToNext] = useState(true);
  const rejectReasonRef = useRef<HTMLTextAreaElement | null>(null);

  const doApprove = async () => {
    if (busy) return;
    setBusy('approve');
    try {
      await approveRequest(row.id, { applyToNextRoutes: !!applyToNext });
      onDone();
    } catch (e: any) {
      console.error('Onay hatası:', e);
      alert('Onaylanamadı. Lütfen tekrar deneyin.');
    } finally {
      setBusy(null);
    }
  };

  const doReject = async () => {
    if (busy) return;
    const reason = (rejectReasonRef.current?.value || '').trim();
    if (!reason) {
      alert('Reddetmek için gerekçe girin.');
      return;
    }
    setBusy('reject');
    try {
      await rejectRequest(row.id, { rejectionReason: reason });
      onDone();
    } catch (e: any) {
      console.error('Red hatası:', e);
      alert('Reddedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={applyToNext}
          onChange={(e) => setApplyToNext(e.target.checked)}
        />
        <span>Sonraki rotalara da uygula</span>
      </label>

      <div className="flex items-center gap-2">
        <SmallButton
          onClick={doApprove}
          disabled={busy !== null}
          className="border-green-600 text-green-700"
          title="Onayla"
        >
          {busy === 'approve' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Onayla
        </SmallButton>

        <SmallButton
          onClick={doReject}
          disabled={busy !== null}
          className="border-red-600 text-red-700"
          title="Reddet"
        >
          {busy === 'reject' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Reddet
        </SmallButton>
      </div>

      <div className="w-full">
        <textarea
          ref={rejectReasonRef}
          rows={2}
          placeholder="Red gerekçesi (redde zorunlu)"
          className="w-full border rounded p-2 text-sm"
        />
      </div>
    </div>
  );
}
