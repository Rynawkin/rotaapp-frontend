// src/pages/LocationUpdateRequests.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
// API importunu her iki export biçimine de uyumlu hale getirdik:
import * as API from '../services/api';
const api: any = (API as any).default ?? (API as any).api ?? API;
// Dış bağımlılık yok (dayjs vb. yok). Tamamen native Date/Intl ile çalışır.

// =====================
// Tür Tanımları
// =====================
type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

interface BaseRequestDto {
  id: number;

  journeyId: number;
  journeyName?: string;

  customerId: number;
  customerName?: string;

  currentLatitude: number;
  currentLongitude: number;
  currentAddress: string;

  requestedLatitude: number;
  requestedLongitude: number;
  requestedAddress: string;

  reason: string;

  requestedByName: string;
  createdAt: string; // ISO
  status: RequestStatus;

  // History için gelen alanlar
  approvedByName?: string | null;
  rejectionReason?: string | null;
  processedAt?: string | null;
}

// Pending liste API’si genelde Approved/Rejected alanlarını getirmez.
// Ama tip çakışmasın diye hepsi optional.
type PendingRequestDto = BaseRequestDto;
type HistoryRequestDto = BaseRequestDto;

// =====================
// Yardımcılar
// =====================

// Türkiye saatine çevirip okunur göster
function formatDateTR(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    // Europe/Istanbul = TRT
    return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  } catch {
    return iso ?? '';
  }
}

// “Yuvarlamadan / kısaltmadan” koordinat gösterimi:
// - DB scale 8 olduğu için en fazla 8 basamak anlamlı. 
// - JS'nin toString() çıktısını esas alıyoruz; bilimsel gösterim olursa toFixed(8) yedek.
// - Harita linkleri için nokta şart; metni de noktalı gösteriyoruz.
function formatCoordExact(value?: number | null): string {
  if (value === null || value === undefined) return '';
  const raw = value.toString();
  if (raw.includes('e') || raw.includes('E')) {
    // Aşırı uç durumda; 8 basamak sabitle (DB en fazla 8 verir).
    return Number.isFinite(value) ? value.toFixed(8) : raw;
  }
  // Normal durumda toString() zaten gelen değeri olduğu gibi verir (40.803788 gibi).
  return raw;
}

function buildGMapsUrl(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return '#';
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// =====================
// Bileşenler
// =====================

function SectionHeader(props: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{props.title}</h2>
      <div style={{ marginLeft: 'auto' }}>{props.right}</div>
    </div>
  );
}

function Toolbar(props: {
  onRefresh(): void;
  searchText: string;
  onSearchText(v: string): void;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      <input
        value={props.searchText}
        onChange={(e) => props.onSearchText(e.target.value)}
        placeholder="Müşteri / Sürücü / Gerekçe ara..."
        style={{
          flex: '1 1 260px',
          minWidth: 220,
          padding: '8px 10px',
          border: '1px solid #ddd',
          borderRadius: 8,
        }}
      />
      <button
        onClick={props.onRefresh}
        style={{
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
        }}
        title="Yenile"
      >
        Yenile
      </button>
      {props.extra}
    </div>
  );
}

// “Haritada Aç” butonu
function MapButton({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  const url = useMemo(() => buildGMapsUrl(lat, lng), [lat, lng]);
  const disabled = lat == null || lng == null;
  return (
    <a
      href={disabled ? undefined : url}
      target="_blank"
      rel="noreferrer"
      style={{
        fontSize: 12,
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid #ddd',
        background: disabled ? '#f5f5f5' : '#fff',
        color: disabled ? '#888' : '#222',
        textDecoration: 'none',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      Haritada Aç
    </a>
  );
}

function MiniCoord({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div>
        <strong>Lat:</strong> <span style={{ fontFamily: 'monospace' }}>{formatCoordExact(lat)}</span>
      </div>
      <div>
        <strong>Lng:</strong> <span style={{ fontFamily: 'monospace' }}>{formatCoordExact(lng)}</span>
      </div>
      <div>
        <MapButton lat={lat ?? undefined} lng={lng ?? undefined} />
      </div>
    </div>
  );
}

function DataCell({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 2 }}>{label}</div>
      <div>{value ?? <span style={{ color: '#999' }}>—</span>}</div>
    </div>
  );
}

// Bekleyen satır
function PendingRow(props: {
  item: PendingRequestDto;
  onApprove(id: number /*, applyToFuture?: boolean*/): Promise<void>;
  onReject(id: number, reason: string): Promise<void>;
}) {
  const { item } = props;
  const [busy, setBusy] = useState<'none' | 'approve' | 'reject'>('none');
  const reasonRef = useRef<HTMLInputElement>(null);
  // const [applyToFuture, setApplyToFuture] = useState<boolean>(false); // Backend destekliyorsa aç.

  const handleApprove = async () => {
    if (busy !== 'none') return;
    setBusy('approve');
    try {
      await props.onApprove(item.id /*, applyToFuture*/);
    } finally {
      setBusy('none');
    }
  };

  const handleReject = async () => {
    if (busy !== 'none') return;
    const val = reasonRef.current?.value?.trim() ?? '';
    if (!val) {
      alert('Red gerekçesi boş olamaz.');
      return;
    }
    setBusy('reject');
    try {
      await props.onReject(item.id, val);
    } finally {
      setBusy('none');
    }
  };

  return (
    <tr>
      <td style={{ verticalAlign: 'top' }}>
        <div style={{ fontWeight: 600 }}>#{item.id}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{item.status}</div>
      </td>

      <td style={{ verticalAlign: 'top' }}>
        <DataCell label="Rota" value={item.journeyName || `Journey #${item.journeyId}`} />
        <DataCell label="Müşteri" value={item.customerName || `Customer #${item.customerId}`} />
        <DataCell label="Talep Eden" value={item.requestedByName} />
        <DataCell label="Talep Saati (TRT)" value={formatDateTR(item.createdAt)} />
      </td>

      <td style={{ verticalAlign: 'top' }}>
        <DataCell
          label="Mevcut Adres"
          value={<div style={{ maxWidth: 340, whiteSpace: 'pre-wrap' }}>{item.currentAddress || '—'}</div>}
        />
        <MiniCoord lat={item.currentLatitude} lng={item.currentLongitude} />
      </td>

      <td style={{ verticalAlign: 'top' }}>
        <DataCell
          label="Talep Edilen Adres"
          value={<div style={{ maxWidth: 340, whiteSpace: 'pre-wrap' }}>{item.requestedAddress || '—'}</div>}
        />
        <MiniCoord lat={item.requestedLatitude} lng={item.requestedLongitude} />
      </td>

      <td style={{ verticalAlign: 'top' }}>
        <DataCell label="Gerekçe" value={<div style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>{item.reason}</div>} />

        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {/* <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={applyToFuture}
              onChange={(e) => setApplyToFuture(e.target.checked)}
            />
            Sonraki rotalara da uygula
          </label> */}

          <button
            onClick={handleApprove}
            disabled={busy !== 'none'}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #3f8f3f',
              background: '#4CAF50',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {busy === 'approve' ? 'Onaylanıyor…' : 'Onayla'}
          </button>

          <div style={{ display: 'grid', gap: 6 }}>
            <input
              ref={reasonRef}
              placeholder="Red gerekçesi…"
              style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 8 }}
            />
            <button
              onClick={handleReject}
              disabled={busy !== 'none'}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #b33a3a',
                background: '#f44336',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {busy === 'reject' ? 'Reddediliyor…' : 'Reddet'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function HistoryRow({ item }: { item: HistoryRequestDto }) {
  return (
    <tr>
      <td style={{ verticalAlign: 'top' }}>
        <div style={{ fontWeight: 600 }}>#{item.id}</div>
        <div
          style={{
            fontSize: 12,
            color: item.status === 'Approved' ? '#2e7d32' : item.status === 'Rejected' ? '#c62828' : '#666',
          }}
        >
          {item.status}
        </div>
      </td>

      <td style={{ verticalAlign: 'top' }}>
        <DataCell label="Rota" value={item.journeyName || `Journey #${item.journeyId}`} />
        <DataCell label="Müşteri" value={item.customerName || `Customer #${item.customerId}`} />
        <DataCell label="Talep Eden" value={item.requestedByName} />
        <DataCell label="Talep Saati (TRT)" value={formatDateTR(item.createdAt)} />
      </td>

      <td style={{ verticalAlign: 'top' }}>
        <DataCell label="Mevcut Adres" value={<div style={{ maxWidth: 340 }}>{item.currentAddress || '—'}</div>} />
        <MiniCoord lat={item.currentLatitude} lng={item.currentLongitude} />
      </td>

      <td style={{ verticalAlign: 'top' }}>
        <DataCell label="Talep Edilen Adres" value={<div style={{ maxWidth: 340 }}>{item.requestedAddress || '—'}</div>} />
        <MiniCoord lat={item.requestedLatitude} lng={item.requestedLongitude} />
      </td>

      <td style={{ verticalAlign: 'top' }}>
        <DataCell label="Gerekçe" value={<div style={{ maxWidth: 300, whiteSpace: 'pre-wrap' }}>{item.reason}</div>} />
        {item.status === 'Approved' ? (
          <>
            <DataCell label="Onaylayan" value={item.approvedByName || '—'} />
            <DataCell label="Onay Saati (TRT)" value={formatDateTR(item.processedAt)} />
          </>
        ) : (
          <>
            <DataCell label="Reddeden" value={item.approvedByName || '—'} />
            <DataCell label="Red Gerekçesi" value={item.rejectionReason || '—'} />
            <DataCell label="Red Saati (TRT)" value={formatDateTR(item.processedAt)} />
          </>
        )}
      </td>
    </tr>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 24,
        border: '1px dashed #ddd',
        borderRadius: 12,
        textAlign: 'center',
        color: '#666',
        marginTop: 8,
      }}
    >
      {text}
    </div>
  );
}

function TableShell(props: { children: React.ReactNode }) {
  return (
    <div style={{ overflow: 'auto', border: '1px solid #eee', borderRadius: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee', minWidth: 80 }}>Talep</th>
            <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee', minWidth: 200 }}>Özet</th>
            <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee', minWidth: 260 }}>
              Mevcut Konum
            </th>
            <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee', minWidth: 260 }}>
              Talep Edilen Konum
            </th>
            <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee', minWidth: 240 }}>İşlemler / Detay</th>
          </tr>
        </thead>
        <tbody>{props.children}</tbody>
      </table>
    </div>
  );
}

// =====================
// Ana Sayfa Bileşeni
// =====================

export default function LocationUpdateRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestStatus>('Pending');
  const [pending, setPending] = useState<PendingRequestDto[] | null>(null);
  const [approved, setApproved] = useState<HistoryRequestDto[] | null>(null);
  const [rejected, setRejected] = useState<HistoryRequestDto[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const filteredPending = useMemo(() => filterBySearch(pending, search), [pending, search]);
  const filteredApproved = useMemo(() => filterBySearch(approved, search), [approved, search]);
  const filteredRejected = useMemo(() => filterBySearch(rejected, search), [rejected, search]);

  async function loadPending() {
    const res = await api.get<PendingRequestDto[]>('/workspace/location-update-requests/pending');
    setPending(res.data ?? []);
  }

  async function loadHistory(status: Exclude<RequestStatus, 'Pending'>) {
    const res = await api.get<HistoryRequestDto[]>('/workspace/location-update-requests/history', {
      params: { status },
    });
    if (status === 'Approved') setApproved(res.data ?? []);
    if (status === 'Rejected') setRejected(res.data ?? []);
  }

  async function refreshActive() {
    setLoading(true);
    try {
      if (activeTab === 'Pending') {
        await loadPending();
      } else if (activeTab === 'Approved') {
        await loadHistory('Approved');
      } else {
        await loadHistory('Rejected');
      }
    } catch (err) {
      console.error('Yükleme hatası', err);
      alert('Talepler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ====== İşlemler ======

  const approve = async (id: number /*, applyToFuture?: boolean*/) => {
    setLoading(true);
    try {
      // NOT: Backend sadece body’siz POST bekliyorsa {} gönderiyoruz.
      // Eğer “applyToFutureRoutes” parametresi tanımlıysa aşağıdaki satırı açın:
      // await api.post(`/workspace/location-update-requests/${id}/approve`, { applyToFutureRoutes: !!applyToFuture });
      await api.post(`/workspace/location-update-requests/${id}/approve`, {});
      await sleep(250);
      await Promise.all([loadPending(), loadHistory('Approved')]);
      alert('Talep onaylandı.');
    } catch (err) {
      console.error('Onay hatası', err);
      alert('Talep onaylanamadı.');
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id: number, reason: string) => {
    setLoading(true);
    try {
      await api.post(`/workspace/location-update-requests/${id}/reject`, { reason });
      await sleep(250);
      await Promise.all([loadPending(), loadHistory('Rejected')]);
      alert('Talep reddedildi.');
    } catch (err) {
      console.error('Red hatası', err);
      alert('Talep reddedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  // ====== Arayüz ======

  return (
    <div style={{ padding: 16 }}>
      <SectionHeader
        title="Şoför Konum Güncelleme Talepleri"
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            <TabButton label="Bekleyen" active={activeTab === 'Pending'} onClick={() => setActiveTab('Pending')} />
            <TabButton label="Onaylanan" active={activeTab === 'Approved'} onClick={() => setActiveTab('Approved')} />
            <TabButton label="Reddedilen" active={activeTab === 'Rejected'} onClick={() => setActiveTab('Rejected')} />
          </div>
        }
      />

      <Toolbar onRefresh={refreshActive} searchText={search} onSearchText={setSearch} />

      {activeTab === 'Pending' && (
        <>
          {loading && <LoadingBar />}
          {filteredPending && filteredPending.length > 0 ? (
            <TableShell>
              {filteredPending.map((it) => (
                <PendingRow key={it.id} item={it} onApprove={approve} onReject={reject} />
              ))}
            </TableShell>
          ) : (
            <EmptyState text="Bekleyen talep bulunamadı." />
          )}
        </>
      )}

      {activeTab === 'Approved' && (
        <>
          {loading && <LoadingBar />}
          {filteredApproved && filteredApproved.length > 0 ? (
            <TableShell>
              {filteredApproved.map((it) => (
                <HistoryRow key={it.id} item={it} />
              ))}
            </TableShell>
          ) : (
            <EmptyState text="Onaylanan talep bulunamadı." />
          )}
        </>
      )}

      {activeTab === 'Rejected' && (
        <>
          {loading && <LoadingBar />}
          {filteredRejected && filteredRejected.length > 0 ? (
            <TableShell>
              {filteredRejected.map((it) => (
                <HistoryRow key={it.id} item={it} />
              ))}
            </TableShell>
          ) : (
            <EmptyState text="Reddedilen talep bulunamadı." />
          )}
        </>
      )}
    </div>
  );
}

// =====================
// Alt yardımcılar/bileşenler
// =====================

function filterBySearch<T extends BaseRequestDto>(items: T[] | null, q: string): T[] {
  if (!items) return [];
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter((it) => {
    const pack = [
      it.customerName,
      String(it.customerId),
      it.journeyName,
      String(it.journeyId),
      it.requestedByName,
      it.reason,
      it.currentAddress,
      it.requestedAddress,
      formatCoordExact(it.currentLatitude),
      formatCoordExact(it.currentLongitude),
      formatCoordExact(it.requestedLatitude),
      formatCoordExact(it.requestedLongitude),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return pack.includes(s);
  });
}

function TabButton(props: { label: string; active?: boolean; onClick(): void }) {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid ' + (props.active ? '#1976d2' : '#ddd'),
        background: props.active ? '#1976d2' : '#fff',
        color: props.active ? '#fff' : '#222',
        cursor: 'pointer',
      }}
    >
      {props.label}
    </button>
  );
}

function LoadingBar() {
  return (
    <div
      style={{
        height: 3,
        background: 'linear-gradient(90deg, #e3f2fd, #90caf9, #e3f2fd)',
        animation: 'loading 1.4s linear infinite',
        marginBottom: 10,
      }}
    />
  );
}
