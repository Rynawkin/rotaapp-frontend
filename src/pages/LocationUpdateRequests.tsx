
// frontend/src/pages/LocationUpdateRequests.tsx
// Yönetici/dispatch için Konum Güncelleme Talepleri ekranı
// - Bekleyen / Onaylanan / Reddedilen sekmeleri
// - Onayla / Reddet işlemleri
// - TR formatında (virgüllü) koordinat gösterimi
// - "adres" alanını göstermiyoruz; sadece koordinatlar görüntülenir
// - Backend'de history endpoint'i yoksa otomatik geri dönüş ve kullanıcıya uyarı bandı

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { MapPin, User, Clock, CheckCircle, XCircle, RefreshCcw } from "lucide-react";

type StatusTab = "Pending" | "Approved" | "Rejected";

interface LocationUpdateRequest {
  id: number;
  journeyId: number;
  journeyName: string;
  customerId: number;
  customerName: string;
  currentLatitude: number;
  currentLongitude: number;
  currentAddress?: string | null;
  requestedLatitude: number;
  requestedLongitude: number;
  requestedAddress?: string | null;
  reason: string;
  status?: "Pending" | "Approved" | "Rejected";
  requestedByName: string;
  approvedByName?: string | null;
  rejectionReason?: string | null;
  createdAt: string;     // ISO
  processedAt?: string | null; // ISO
}

const numberTR = (value: number, frac: number = 6) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: frac, maximumFractionDigits: frac }).format(value);

function isoToTR(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR");
  } catch {
    return iso || "-";
  }
}

// Bazı kurulumlarda history endpoint henüz yok (404). Bu durumda uyarı bandı göstereceğiz.
function is404(e: any) {
  return e && e.response && e.response.status === 404;
}

export default function LocationUpdateRequestsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("Pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<LocationUpdateRequest[]>([]);
  const [historyApiMissing, setHistoryApiMissing] = useState(false);
  const [rejecting, setRejecting] = useState<{ [id: number]: string }>({}); // id -> reason text

  const tabTitle = useMemo(() => {
    switch (activeTab) {
      case "Pending": return "Bekleyen Talepler";
      case "Approved": return "Onaylanan Talepler";
      case "Rejected": return "Reddedilen Talepler";
    }
  }, [activeTab]);

  async function smartFetchHistory(status: "Approved" | "Rejected") {
    // Sırasıyla şu yollar denenir:
    // 1) /history?status=
    // 2) /list?status=
    // 3) /?status=
    const candidates = [
      `/workspace/location-update-requests/history?status=${status}`,
      `/workspace/location-update-requests/list?status=${status}`,
      `/workspace/location-update-requests?status=${status}`,
    ];
    for (const path of candidates) {
      try {
        const { data } = await api.get<LocationUpdateRequest[]>(path);
        setHistoryApiMissing(false);
        return data;
      } catch (e: any) {
        if (!is404(e)) {
          // 404 dışı hatayı kullanıcıya göster
          throw e;
        }
        // 404 ise bir sonrakini dene
      }
    }
    // Hiçbiri yok -> history API eksik
    setHistoryApiMissing(true);
    return [];
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      let data: LocationUpdateRequest[] = [];
      if (activeTab === "Pending") {
        // Sadece bekleyenleri dönen resmi endpoint
        const res = await api.get<LocationUpdateRequest[]>(
          "/workspace/location-update-requests/pending"
        );
        data = res.data;
      } else {
        data = await smartFetchHistory(activeTab);
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Talepler yüklenemedi:", e);
      setError("Talepler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function approve(id: number) {
    setError(null);
    try {
      // "sonraki rotalara uygula" togglesını kaldırdık; backend body zorunlu değilse boş yolla.
      // Eğer backend applyToFutureRoutes bekliyorsa default true göndermek isterseniz:
      // await api.post(`/workspace/location-update-requests/${id}/approve`, { applyToFutureRoutes: true });
      await api.post(`/workspace/location-update-requests/${id}/approve`, {});
      // Başarılı -> listeyi yenile
      await fetchData();
    } catch (e: any) {
      console.error("Onay hatası:", e);
      setError("Talep onaylanamadı.");
    }
  }

  async function reject(id: number) {
    setError(null);
    try {
      const reason = (rejecting[id] || "").trim();
      await api.post(`/workspace/location-update-requests/${id}/reject`, { rejectionReason: reason || null });
      await fetchData();
    } catch (e: any) {
      console.error("Red hatası:", e);
      setError("Talep reddedilemedi.");
    }
  }

  function setRejectReason(id: number, val: string) {
    setRejecting(prev => ({ ...prev, [id]: val }));
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{tabTitle}</h1>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      {/* Sekmeler */}
      <div className="mb-6 flex gap-2">
        {(["Pending", "Approved", "Rejected"] as StatusTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`rounded-md px-4 py-2 text-sm ${
              activeTab === t ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            {t === "Pending" ? "Bekleyen" : t === "Approved" ? "Onaylanan" : "Reddedilen"}
          </button>
        ))}
      </div>

      {/* Uyarı bandı: history endpoint yoksa */}
      {historyApiMissing && (activeTab === "Approved" || activeTab === "Rejected") && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
          Onaylanmış / reddedilmiş talepleri göstermek için backend'de <code>/workspace/location-update-requests/history?status=Approved|Rejected</code> (veya eşdeğeri) API'si
          yayınlanmalı. Şu an bu uç yok (404 dönüyor); bu sayfa yine de çalışmaya devam edecek.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Yükleniyor...</div>
      ) : requests.length === 0 ? (
        <div className="text-gray-500">Bu sekmede talep bulunamadı.</div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {r.customerName} <span className="text-gray-400">•</span>{" "}
                    <span className="text-gray-700">{r.journeyName}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {r.requestedByName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {isoToTR(r.createdAt)}
                    </span>
                    {(activeTab !== "Pending") && (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {r.processedAt ? isoToTR(r.processedAt) : "-"}
                      </span>
                    )}
                    {(activeTab === "Approved" && r.approvedByName) && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Onaylayan: {r.approvedByName}
                      </span>
                    )}
                    {(activeTab === "Rejected" && r.rejectionReason) && (
                      <span className="inline-flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Red Nedeni: {r.rejectionReason}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {activeTab === "Pending" ? "Bekliyor" : activeTab === "Approved" ? "Onaylandı" : "Reddedildi"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-md border border-gray-100 p-3">
                  <div className="mb-1 text-sm font-medium text-gray-700">Mevcut Konum</div>
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {numberTR(r.currentLatitude)}, {numberTR(r.currentLongitude)}
                    </span>
                  </div>
                </div>
                <div className="rounded-md border border-gray-100 p-3">
                  <div className="mb-1 text-sm font-medium text-gray-700">Talep Edilen Konum</div>
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {numberTR(r.requestedLatitude)}, {numberTR(r.requestedLongitude)}
                    </span>
                  </div>
                </div>
              </div>

              {activeTab === "Pending" && (
                <div className="mt-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Açıklama:</span> {r.reason || "-"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approve(r.id)}
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Onayla
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        value={rejecting[r.id] || ""}
                        onChange={(e) => setRejectReason(r.id, e.target.value)}
                        placeholder="Red nedeni (opsiyonel)"
                        className="w-48 rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => reject(r.id)}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                        Reddet
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === "Approved" || activeTab === "Rejected") && (
                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium">Açıklama:</span> {r.reason || "-"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
