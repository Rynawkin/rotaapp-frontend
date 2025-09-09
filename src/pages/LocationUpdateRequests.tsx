// frontend/src/pages/LocationUpdateRequests.tsx
import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import {
  MapPin,
  User,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCcw,
  ExternalLink,
} from "lucide-react";

type PendingDto = {
  id: number;
  journeyId: number;
  journeyName: string;
  customerId: number;
  customerName: string;
  currentLatitude: number | string;
  currentLongitude: number | string;
  currentAddress: string;
  requestedLatitude: number | string;
  requestedLongitude: number | string;
  requestedAddress: string | null;
  reason: string;
  requestedByName: string;
  createdAt: string; // ISO (UTC veya tz'siz)
};

type HistoryDto = {
  id: number;
  journeyId: number;
  journeyName: string;
  customerId: number;
  customerName: string;
  currentLatitude: number | string;
  currentLongitude: number | string;
  currentAddress: string;
  requestedLatitude: number | string;
  requestedLongitude: number | string;
  requestedAddress: string | null;
  reason: string;
  requestedByName: string;
  createdAt: string; // ISO
  status: "Approved" | "Rejected";
  processedAt?: string | null; // ISO
  approvedByName?: string | null;
  rejectedByName?: string | null;
  rejectionReason?: string | null;
};

type TabKey = "pending" | "approved" | "rejected";

/* ---------- TR saat dilimi biçimlendirme ---------- */
const tzOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

/** "2025-09-09T01:06:19.486" gibi tz'siz bir string gelirse UTC kabul ederek Date üretir. */
function parseAsUtc(dateStr: string): Date | null {
  const s = (dateStr || "").trim();
  const m =
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+\-]\d{2}:?\d{2})?$/.exec(
      s
    );
  if (!m) return null;

  const [, y, mo, d, h, mi, sec = "0", ms = "0", tz] = m;
  if (tz && tz !== "") {
    // Z veya ±HH:mm varsa motor zaten doğru parse eder
    const d2 = new Date(s);
    return isNaN(d2.getTime()) ? null : d2;
  }

  // tz yoksa -> UTC kabul et
  const dt = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(sec),
    Number(ms)
  );
  return new Date(dt);
}

function formatDateTR(value?: string | Date | null) {
  if (!value) return "-";
  let d: Date | null = null;
  if (typeof value === "string") {
    d = parseAsUtc(value) ?? new Date(value);
  } else {
    d = value;
  }
  if (!d || isNaN(d.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      ...tzOptions,
      timeZone: "Europe/Istanbul",
    }).format(d);
  } catch {
    return d.toLocaleString("tr-TR");
  }
}

/* ---------- Koordinat yardımcıları (YUVARLAMA YOK) ---------- */

/** Ekranda koordinatı aynen göster (string geldiyse hiç dokunma). */
function displayCoord(input: number | string): string {
  if (typeof input === "number") return String(input);
  return (input ?? "").toString();
}

/** Harita URL'si için sadece ',' → '.' çevir (yuvarlama yapma). */
function coordForUrl(input: number | string): string {
  if (typeof input === "number") return String(input);
  return (input ?? "").toString().trim().replace(",", ".");
}

function googleMapsUrl(lat: number | string, lon: number | string) {
  return `https://www.google.com/maps?q=${coordForUrl(lat)},${coordForUrl(lon)}`;
}

/* ---------- UI parçaları ---------- */

const EmptyState: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-white">
    <MapPin className="w-10 h-10 mb-3 opacity-70" />
    <h3 className="text-lg font-semibold">{title}</h3>
    {subtitle ? (
      <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
    ) : null}
  </div>
);

const Badge: React.FC<{ color: "green" | "red" | "gray"; children: React.ReactNode }> = ({ color, children }) => {
  const m =
    color === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : color === "red"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-neutral-50 text-neutral-700 border-neutral-200";
  return <span className={`px-2 py-0.5 text-xs rounded border ${m}`}>{children}</span>;
};

const LocationUpdateRequests: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("pending");

  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingDto[]>([]);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [approved, setApproved] = useState<HistoryDto[]>([]);
  const [rejected, setRejected] = useState<HistoryDto[]>([]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const refresh = async () => {
    if (tab === "pending") {
      await loadPending();
    } else if (tab === "approved") {
      await loadHistory("Approved");
    } else {
      await loadHistory("Rejected");
    }
  };

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await api.get("/workspace/location-update-requests/pending");
      setPending(res.data || []);
    } catch (err) {
      console.error("Bekleyen talepler alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (status: "Approved" | "Rejected") => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/workspace/location-update-requests/history`, {
        params: { status },
      });
      const rows = (res.data || []) as HistoryDto[];
      if (status === "Approved") setApproved(rows);
      if (status === "Rejected") setRejected(rows);
    } catch (err) {
      console.error(`Geçmiş talepler alınamadı (${status}):`, err);
      if (status === "Approved") setApproved([]);
      if (status === "Rejected") setRejected([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const approveRequest = async (id: number) => {
    if (!confirm("Bu konum güncelleme talebini ONAYLAMAK istediğinize emin misiniz?")) {
      return;
    }
    try {
      await api.post(`/workspace/location-update-requests/${id}/approve`, {});
      await loadPending();
      if (tab === "approved") await loadHistory("Approved");
    } catch (err) {
      console.error("Onaylama başarısız:", err);
      alert("Onaylama başarısız oldu.");
    }
  };

  const openRejectModal = (id: number) => {
    setSelectedRequestId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const rejectRequest = async () => {
    if (!selectedRequestId) return;
    if (!rejectReason.trim()) {
      alert("Lütfen bir red sebebi giriniz.");
      return;
    }
    try {
      await api.post(
        `/workspace/location-update-requests/${selectedRequestId}/reject`,
        { reason: rejectReason.trim() }
      );
      setRejectModalOpen(false);
      await loadPending();
      if (tab === "rejected") await loadHistory("Rejected");
    } catch (err) {
      console.error("Reddetme başarısız:", err);
      alert("Reddetme başarısız oldu.");
    }
  };

  const SectionHeader: React.FC<{ title: string; count?: number }> = ({ title, count }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">
        {title} {typeof count === "number" ? <span className="text-neutral-400 text-base">({count})</span> : null}
      </h2>
      <button
        onClick={refresh}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50"
        title="Yenile"
      >
        <RefreshCcw className="w-4 h-4" />
        Yenile
      </button>
    </div>
  );

  const TabButton: React.FC<{ k: TabKey; label: string; icon?: React.ReactNode }> = ({ k, label, icon }) => {
    const active = tab === k;
    return (
      <button
        onClick={() => setTab(k)}
        className={`px-3 py-2 rounded-lg border text-sm inline-flex items-center gap-2 ${
          active ? "bg-neutral-900 text-white border-neutral-900" : "bg-white hover:bg-neutral-50"
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  const TableHead: React.FC<{ history?: boolean }> = ({ history }) => (
    <thead className="bg-neutral-50">
      <tr className="text-left text-sm text-neutral-600">
        <th className="py-2 px-3">Müşteri</th>
        <th className="py-2 px-3">Sefer</th>
        <th className="py-2 px-3">Mevcut Konum</th>
        <th className="py-2 px-3">Talep Edilen Konum</th>
        <th className="py-2 px-3">Talep Eden</th>
        <th className="py-2 px-3">Talep Zamanı</th>
        {history ? <th className="py-2 px-3">Durum</th> : null}
        {history ? <th className="py-2 px-3">İşleyen</th> : null}
        {history ? <th className="py-2 px-3">İşlem Zamanı</th> : null}
        {!history ? <th className="py-2 px-3 w-[220px]">İşlemler</th> : null}
      </tr>
    </thead>
  );

  const PendingTable: React.FC = () => (
    <div className="border rounded-xl overflow-hidden bg-white">
      <table className="w-full border-collapse">
        <TableHead />
        <tbody>
          {pending.map((r) => (
            <tr key={r.id} className="border-t text-sm">
              <td className="py-3 px-3">
                <div className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {r.customerName}
                </div>
                <div className="text-xs text-neutral-500">#{r.customerId}</div>
              </td>
              <td className="py-3 px-3">
                <div className="font-medium">{r.journeyName}</div>
                <div className="text-xs text-neutral-500">Sefer #{r.journeyId}</div>
              </td>
              <td className="py-3 px-3">
                <div className="font-mono text-xs">
                  {displayCoord(r.currentLatitude)}, {displayCoord(r.currentLongitude)}
                </div>
                <div className="text-xs text-neutral-500 truncate max-w-[280px]">
                  {r.currentAddress || "-"}
                </div>
                <a
                  className="inline-flex items-center gap-1 text-xs underline mt-1"
                  href={googleMapsUrl(r.currentLatitude, r.currentLongitude)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Haritada aç <ExternalLink className="w-3 h-3" />
                </a>
              </td>
              <td className="py-3 px-3">
                <div className="font-mono text-xs">
                  {displayCoord(r.requestedLatitude)}, {displayCoord(r.requestedLongitude)}
                </div>
                <div className="text-xs text-neutral-500 truncate max-w-[280px]">
                  {r.requestedAddress || "-"}
                </div>
                <a
                  className="inline-flex items-center gap-1 text-xs underline mt-1"
                  href={googleMapsUrl(r.requestedLatitude, r.requestedLongitude)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Haritada aç <ExternalLink className="w-3 h-3" />
                </a>
              </td>
              <td className="py-3 px-3">
                <div className="text-sm">{r.requestedByName}</div>
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  {formatDateTR(r.createdAt)}
                </div>
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveRequest(r.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                    title="Onayla"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Onayla
                  </button>
                  <button
                    onClick={() => openRejectModal(r.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100"
                    title="Reddet"
                  >
                    <XCircle className="w-4 h-4" />
                    Reddet
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!pending.length && !loading ? (
            <tr>
              <td colSpan={7} className="p-10">
                <EmptyState
                  title="Bekleyen talep bulunamadı"
                  subtitle="Sürücülerden konum güncelleme talebi geldiğinde burada görünecek."
                />
              </td>
            </tr>
          ) : null}
          {loading ? (
            <tr>
              <td colSpan={7} className="p-6 text-center text-sm text-neutral-500">
                Yükleniyor...
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );

  const HistoryTable: React.FC<{ rows: HistoryDto[]; status: "Approved" | "Rejected" }> = ({ rows, status }) => (
    <div className="border rounded-xl overflow-hidden bg-white">
      <table className="w-full border-collapse">
        <TableHead history />
        <tbody>
          {rows.map((r) => (
            <tr key={`${status}-${r.id}`} className="border-t text-sm">
              <td className="py-3 px-3">
                <div className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {r.customerName}
                </div>
                <div className="text-xs text-neutral-500">#{r.customerId}</div>
              </td>
              <td className="py-3 px-3">
                <div className="font-medium">{r.journeyName}</div>
                <div className="text-xs text-neutral-500">Sefer #{r.journeyId}</div>
              </td>
              <td className="py-3 px-3">
                <div className="font-mono text-xs">
                  {displayCoord(r.currentLatitude)}, {displayCoord(r.currentLongitude)}
                </div>
                <div className="text-xs text-neutral-500 truncate max-w-[280px]">
                  {r.currentAddress || "-"}
                </div>
                <a
                  className="inline-flex items-center gap-1 text-xs underline mt-1"
                  href={googleMapsUrl(r.currentLatitude, r.currentLongitude)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Haritada aç <ExternalLink className="w-3 h-3" />
                </a>
              </td>
              <td className="py-3 px-3">
                <div className="font-mono text-xs">
                  {displayCoord(r.requestedLatitude)}, {displayCoord(r.requestedLongitude)}
                </div>
                <div className="text-xs text-neutral-500 truncate max-w-[280px]">
                  {r.requestedAddress || "-"}
                </div>
                <a
                  className="inline-flex items-center gap-1 text-xs underline mt-1"
                  href={googleMapsUrl(r.requestedLatitude, r.requestedLongitude)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Haritada aç <ExternalLink className="w-3 h-3" />
                </a>
              </td>
              <td className="py-3 px-3">
                <div className="text-sm">{r.requestedByName}</div>
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  {formatDateTR(r.createdAt)}
                </div>
              </td>
              <td className="py-3 px-3">
                <Badge color={status === "Approved" ? "green" : "red"}>
                  {status === "Approved" ? "Onaylandı" : "Reddedildi"}
                </Badge>
              </td>
              <td className="py-3 px-3">
                <div className="text-sm">
                  {status === "Approved" ? (r.approvedByName || "-") : (r.rejectedByName || "-")}
                </div>
                {status === "Rejected" && r.rejectionReason ? (
                  <div className="text-xs text-neutral-500 mt-1">Sebep: {r.rejectionReason}</div>
                ) : null}
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  {formatDateTR(r.processedAt)}
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && !historyLoading ? (
            <tr>
              <td colSpan={10} className="p-10">
                <EmptyState
                  title={`${status === "Approved" ? "Onaylanan" : "Reddedilen"} talep bulunamadı`}
                />
              </td>
            </tr>
          ) : null}
          {historyLoading ? (
            <tr>
              <td colSpan={10} className="p-6 text-center text-sm text-neutral-500">
                Yükleniyor...
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Konum Güncelleme Talepleri</h1>
        <div className="flex gap-2">
          <TabButton k="pending" label="Bekleyen" icon={<Clock className="w-4 h-4" />} />
          <TabButton k="approved" label="Onaylanan" icon={<CheckCircle className="w-4 h-4" />} />
          <TabButton k="rejected" label="Reddedilen" icon={<XCircle className="w-4 h-4" />} />
        </div>
      </div>

      {tab === "pending" && (
        <>
          <SectionHeader title="Bekleyen Talepler" count={pending.length} />
          <PendingTable />
        </>
      )}
      {tab === "approved" && (
        <>
          <SectionHeader title="Onaylanan Talepler" count={approved.length} />
          <HistoryTable rows={approved} status="Approved" />
        </>
      )}
      {tab === "rejected" && (
        <>
          <SectionHeader title="Reddedilen Talepler" count={rejected.length} />
          <HistoryTable rows={rejected} status="Rejected" />
        </>
      )}

      {/* Reject Modal */}
      {rejectModalOpen ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[95%] max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Talebi Reddet</h3>
            </div>
            <div className="p-4 space-y-3">
              <label className="text-sm">Red nedeni</label>
              <textarea
                className="w-full border rounded-lg p-2 text-sm"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Neden reddediyorsunuz?"
              />
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50"
              >
                Vazgeç
              </button>
              <button
                onClick={rejectRequest}
                className="px-3 py-1.5 rounded-lg border text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100 inline-flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reddet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LocationUpdateRequests;
