// src/pages/LocationUpdateRequests.tsx
import React, { useEffect, useMemo, useState } from 'react';
// api.ts'de default export yoksa build kırılıyordu. Bu şekilde her iki durumda da çalışır:
import * as ApiModule from '../services/api';
import { AxiosError } from 'axios';

// Hem default (ApiModule.default) hem named (ApiModule.api) export'ları destekle
const http: any = (ApiModule as any).default ?? (ApiModule as any).api ?? ApiModule;

type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

type PendingDto = {
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
  createdAt: string; // ISO (UTC)
  status?: RequestStatus;
};

type HistoryDto = {
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
  createdAt: string;   // ISO (UTC)
  processedAt?: string; // ISO (UTC)
  approvedByName?: string | null;
  rejectionReason?: string | null;
  status: RequestStatus;
};

type TabKey = 'pending' | 'approved' | 'rejected';

const TAB_LABELS: Record<TabKey, string> = {
  pending: 'Bekleyen Talepler',
  approved: 'Onaylananlar',
  rejected: 'Reddedilenler',
};

function fmtTR(dateIso?: string | null): string {
  if (!dateIso) return '-';
  const d = new Date(dateIso);
  return d.toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Koordinatı ham (yuvarlamasız) göster. */
function rawCoord(n: number | null | undefined): string {
  if (n === null || n === undefined) return '-';
  return String(n);
}

function MapLink({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  const url = useMemo(() => `https://www.google.com/maps?q=${lat},${lng}`, [lat, lng]);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline">
      {label ?? 'Haritada Aç'}
    </a>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="section-header" style={{ margin: '12px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
      {typeof count === 'number' && (
        <span style={{ background: '#eef2ff', color: '#3730a3', padding: '2px 8px', borderRadius: 999, fontSize: 12 }}>
          {count}
        </span>
      )}
    </div>
  );
}

function Toolbar({
  active,
  onChange,
  refresh,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  refresh: () => void;
}) {
  return (
    <div
      className="toolbar"
      style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', marginBottom: 12 }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        {(['pending', 'approved', 'rejected'] as TabKey[]).map((k) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className="btn btn-sm"
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: active === k ? '#111827' : '#fff',
              color: active === k ? '#fff' : '#111827',
              cursor: 'pointer',
            }}
          >
            {TAB_LABELS[k]}
          </button>
        ))}
      </div>

      <button onClick={refresh} className="btn btn-sm" style={{ padding: '6px 10px', borderRadius: 8 }}>
        Yenile
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        border: '1px dashed #e5e7eb',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center',
        color: '#6b7280',
        background: '#fafafa',
      }}
    >
      {text}
    </div>
  );
}

export default function LocationUpdateRequestsPage() {
  const [tab, setTab] = useState<TabKey>('pending');

  const [pending, setPending] = useState<PendingDto[]>([]);
  const [approved, setApproved] = useState<HistoryDto[]>([]);
  const [rejected, setRejected] = useState<HistoryDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  async function fetchPending() {
    try {
      setErr(null);
      setLoading(true);
      const res = await http.get<PendingDto[]>('/api/workspace/location-update-requests/pending');
      setPending(res.data || []);
    } catch (e) {
      const ae = e as AxiosError;
      setErr(ae.message || 'Bekleyen talepler yüklenemedi');
      console.error('Bekleyen talepler fetch error:', ae);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory(status: Exclude<RequestStatus, 'Pending'>) {
    try {
      setErr(null);
      setLoading(true);
      const res = await http.get<HistoryDto[]>(
        `/api/workspace/location-update-requests/history`,
        { params: { status } }
      );
      const list = (res.data || []).map((x) => ({ ...x, status }));
      if (status === 'Approved') setApproved(list);
      else setRejected(list);
    } catch (e) {
      const ae = e as AxiosError;
      setErr(ae.message || 'Geçmiş talepler yüklenemedi');
      console.error('Geçmiş talepler fetch error:', ae);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'pending') fetchPending();
    if (tab === 'approved') fetchHistory('Approved');
    if (tab === 'rejected') fetchHistory('Rejected');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function approve(id: number) {
    try {
      setActionBusyId(id);
      await http.post(`/api/workspace/location-update-requests/${id}/approve`, {});
      await fetchPending();
      await fetchHistory('Approved');
    } catch (e) {
      const ae = e as AxiosError;
      alert(`Onaylama başarısız: ${ae.message}`);
      console.error('Approve error:', ae);
    } finally {
      setActionBusyId(null);
    }
  }

  async function reject(id: number) {
    const reason = prompt('Red gerekçesi (isteğe bağlı):') || '';
    try {
      setActionBusyId(id);
      await http.post(`/api/workspace/location-update-requests/${id}/reject`, { rejectionReason: reason || null });
      await fetchPending();
      await fetchHistory('Rejected');
    } catch (e) {
      const ae = e as AxiosError;
      alert(`Reddetme başarısız: ${ae.message}`);
      console.error('Reject error:', ae);
    } finally {
      setActionBusyId(null);
    }
  }

  function renderPendingTable() {
    if (!pending.length) return <EmptyState text="Bekleyen talep bulunmuyor." />;

    return (
      <div className="table-wrap" style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={th}>Talep Saati (TR)</th>
              <th style={th}>Yolculuk</th>
              <th style={th}>Müşteri</th>
              <th style={th}>Mevcut Konum</th>
              <th style={th}>Talep Edilen Konum</th>
              <th style={th}>Gerekçe</th>
              <th style={th}>Talep Eden</th>
              <th style={thAction}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id}>
                <td style={td}>{fmtTR(r.createdAt)}</td>
                <td style={td}>{r.journeyName ?? `#${r.journeyId}`}</td>
                <td style={td}>{r.customerName ?? `#${r.customerId}`}</td>

                <td style={td}>
                  <div style={coordBox}>
                    <div><span style={coordLabel}>Lat:</span> <span style={coordValue}>{rawCoord(r.currentLatitude)}</span></div>
                    <div><span style={coordLabel}>Lng:</span> <span style={coordValue}>{rawCoord(r.currentLongitude)}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <MapLink lat={r.currentLatitude} lng={r.currentLongitude} />
                  </div>
                  {r.currentAddress && (
                    <div style={addr}>{r.currentAddress}</div>
                  )}
                </td>

                <td style={td}>
                  <div style={coordBox}>
                    <div><span style={coordLabel}>Lat:</span> <span style={coordValue}>{rawCoord(r.requestedLatitude)}</span></div>
                    <div><span style={coordLabel}>Lng:</span> <span style={coordValue}>{rawCoord(r.requestedLongitude)}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <MapLink lat={r.requestedLatitude} lng={r.requestedLongitude} />
                  </div>
                  {/* İstendiği üzere adresi göstermiyoruz */}
                </td>

                <td style={td}>{r.reason || '-'}</td>
                <td style={td}>{r.requestedByName || '-'}</td>

                <td style={tdAction}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-xs"
                      onClick={() => approve(r.id)}
                      disabled={actionBusyId === r.id}
                      style={btnPrimary}
                    >
                      {actionBusyId === r.id ? 'Onaylanıyor...' : 'Onayla'}
                    </button>
                    <button
                      className="btn btn-xs"
                      onClick={() => reject(r.id)}
                      disabled={actionBusyId === r.id}
                      style={btnDanger}
                    >
                      {actionBusyId === r.id ? 'Reddediliyor...' : 'Reddet'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderHistoryTable(items: HistoryDto[], statusLabel: 'Approved' | 'Rejected') {
    if (!items.length) {
      return (
        <EmptyState
          text={
            statusLabel === 'Approved'
              ? 'Onaylanmış talep bulunmuyor.'
              : 'Reddedilmiş talep bulunmuyor.'
          }
        />
      );
    }

    return (
      <div className="table-wrap" style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={th}>Talep Saati (TR)</th>
              <th style={th}>İşlem Saati (TR)</th>
              <th style={th}>Yolculuk</th>
              <th style={th}>Müşteri</th>
              <th style={th}>Mevcut Konum</th>
              <th style={th}>Talep Edilen Konum</th>
              <th style={th}>Gerekçe</th>
              {statusLabel === 'Approved' ? (
                <th style={th}>Onaylayan</th>
              ) : (
                <>
                  <th style={th}>Reddeden</th>
                  <th style={th}>Red Gerekçesi</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td style={td}>{fmtTR(r.createdAt)}</td>
                <td style={td}>{fmtTR(r.processedAt)}</td>
                <td style={td}>{r.journeyName ?? `#${r.journeyId}`}</td>
                <td style={td}>{r.customerName ?? `#${r.customerId}`}</td>

                <td style={td}>
                  <div style={coordBox}>
                    <div><span style={coordLabel}>Lat:</span> <span style={coordValue}>{rawCoord(r.currentLatitude)}</span></div>
                    <div><span style={coordLabel}>Lng:</span> <span style={coordValue}>{rawCoord(r.currentLongitude)}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <MapLink lat={r.currentLatitude} lng={r.currentLongitude} />
                  </div>
                  {r.currentAddress && <div style={addr}>{r.currentAddress}</div>}
                </td>

                <td style={td}>
                  <div style={coordBox}>
                    <div><span style={coordLabel}>Lat:</span> <span style={coordValue}>{rawCoord(r.requestedLatitude)}</span></div>
                    <div><span style={coordLabel}>Lng:</span> <span style={coordValue}>{rawCoord(r.requestedLongitude)}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <MapLink lat={r.requestedLatitude} lng={r.requestedLongitude} />
                  </div>
                  {/* İstendiği üzere adresi göstermiyoruz */}
                </td>

                <td style={td}>{r.reason || '-'}</td>

                {statusLabel === 'Approved' ? (
                  <td style={td}>{r.approvedByName || '-'}</td>
                ) : (
                  <>
                    <td style={td}>{r.approvedByName || '-'}</td>
                    <td style={td}>{r.rejectionReason || '-'}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const content = useMemo(() => {
    if (loading && !pending.length && !approved.length && !rejected.length) {
      return <EmptyState text="Yükleniyor..." />;
    }
    if (tab === 'pending') {
      return (
        <>
          <SectionHeader title={TAB_LABELS.pending} count={pending.length} />
          {renderPendingTable()}
        </>
      );
    }
    if (tab === 'approved') {
      return (
        <>
          <SectionHeader title={TAB_LABELS.approved} count={approved.length} />
          {renderHistoryTable(approved, 'Approved')}
        </>
      );
    }
    return (
      <>
        <SectionHeader title={TAB_LABELS.rejected} count={rejected.length} />
        {renderHistoryTable(rejected, 'Rejected')}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loading, pending, approved, rejected, actionBusyId]);

  return (
    <div style={{ padding: 16 }}>
      <Toolbar
        active={tab}
        onChange={(k) => setTab(k)}
        refresh={() => {
          if (tab === 'pending') fetchPending();
          if (tab === 'approved') fetchHistory('Approved');
          if (tab === 'rejected') fetchHistory('Rejected');
        }}
      />
      {err && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {err}
        </div>
      )}
      {content}
    </div>
  );
}

/* ---- styles ---- */
const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  color: '#6b7280',
  fontWeight: 600,
  padding: '10px 12px',
  borderBottom: '1px solid #e5e7eb',
  background: '#fafafa',
  whiteSpace: 'nowrap',
};

const thAction: React.CSSProperties = { ...th, textAlign: 'center' };

const td: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'top',
  fontSize: 13,
  color: '#111827',
};

const tdAction: React.CSSProperties = { ...td, textAlign: 'center' };

const coordBox: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  rowGap: 4,
  columnGap: 8,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

const coordLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 12,
};

const coordValue: React.CSSProperties = {
  fontSize: 13,
  color: '#111827',
};

const addr: React.CSSProperties = {
  marginTop: 8,
  padding: 8,
  borderRadius: 8,
  background: '#f9fafb',
  color: '#374151',
  fontSize: 12,
  maxWidth: 360,
  wordBreak: 'break-word',
  border: '1px solid #eef2f7',
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #1f2937',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #fca5a5',
  background: '#fee2e2',
  color: '#991b1b',
  cursor: 'pointer',
};
