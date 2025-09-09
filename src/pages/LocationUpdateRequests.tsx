import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { Check, X, RotateCw } from "lucide-react";

/**
 * LocationUpdateRequests
 * - Bekleyen / Onaylanan / Reddedilen talepler sekmeleri
 * - Onayla / Reddet aksiyonları
 * - Geçmiş için işleyen kişi, tarih, red sebebi gibi alanları gösterir
 * - "Sonraki rotalara uygula" ve "adres metni" kaldırıldı. Onay, sadece müşteri koordinatlarını günceller.
 */

type StatusTab = "Pending" | "Approved" | "Rejected";

type LocationUpdateRequest = {
  id: number;
  journeyId: number;
  journeyName?: string;

  journeyStopId?: number;

  customerId: number;
  customerName?: string;

  currentLatitude: number;
  currentLongitude: number;
  currentAddress?: string | null;

  requestedLatitude: number;
  requestedLongitude: number;
  requestedAddress?: string | null;

  reason: string;

  requestedByName: string;
  createdAt: string; // ISO

  // Yalnız geçmişte dolu olur
  approvedByName?: string | null; // hem onay hem red için işleyen kişi
  processedAt?: string | null; // hem onay hem red tarihi
  rejectionReason?: string | null;

  status?: StatusTab;
};

function trNumber(n: number) {
  // Ekranda virgüllü göstermek için
  try {
    return n.toLocaleString("tr-TR", {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    });
  } catch {
    return String(n);
  }
}

export default function LocationUpdateRequests() {
  const [activeTab, setActiveTab] = useState<StatusTab>("Pending");
  const [items, setItems] = useState<LocationUpdateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyApiMissing, setHistoryApiMissing] = useState(false);

  const title = useMemo(() => {
    switch (activeTab) {
      case "Pending":
        return "Bekleyen Talepler";
      case "Approved":
        return "Onaylanan Talepler";
      case "Rejected":
        return "Reddedilen Talepler";
    }
  }, [activeTab]);

  async function loadHistory(status: "Approved" | "Rejected") {
    // 1) Yeni önerilen endpoint
    const paths = [
      `/workspace/location-update-requests/history?status=${status}`,
      // 2) Alternatif (bazı sürümlerde böyle olabilir)
      `/workspace/location-update-requests?status=${status}`,
      // 3) En son denenebilecek eski yazım
      `/workspace/location-update-requests/history/${status.toLowerCase()}`,
    ];

    for (const path of paths) {
      try {
        const res = await api.get<LocationUpdateRequest[]>(path);
        if (Array.isArray(res.data)) {
          setHistoryApiMissing(false);
          return res.data;
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // 404 ise sıradakini dene
          continue;
        }
        // Diğer hatalarda döngüyü kırıp hatayı yansıt
        throw err;
      }
    }
    // Hiçbiri yoksa backend henüz deploy edilmemiş kabul et
    setHistoryApiMissing(true);
    return [];
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      let data: LocationUpdateRequest[] = [];
      if (activeTab === "Pending") {
        const res = await api.get<LocationUpdateRequest[]>(
          `/workspace/location-update-requests/pending`
        );
        data = res.data ?? [];
      } else {
        data = await loadHistory(activeTab);
      }
      setItems(data);
    } catch (e: any) {
      console.error("Talepler yüklenemedi:", e);
      setError("Talepler yüklenemedi.");
      setItems([]);
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
      // "Sonraki rotalara uygula" KALDIRILDI → sadece müşteri koordinatlarını güncelle.
      // Backend System.Text.Json camelCase ile "updateFutureStops" bekler.
      await api.post(`/workspace/location-update-requests/${id}/approve`, {
        updateFutureStops: false,
      });
      await fetchData();
    } catch (e: any) {
      console.error("Onay hatası:", e);
      setError("Talep onaylanamadı.");
    }
  }

  async function reject(id: number) {
    setError(null);
    try {
      const reason =
        prompt("Reddetme gerekçesi (opsiyonel):") ?? "Uygun bulunmadı";
      await api.post(`/workspace/location-update-requests/${id}/reject`, {
        rejectionReason: reason,
      });
      await fetchData();
    } catch (e: any) {
      console.error("Red hatası:", e);
      setError("Talep reddedilemedi.");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
        >
          <RotateCw size={16} />
          Yenile
        </button>
      </div>

      <div className="flex gap-2">
        {(["Pending", "Approved", "Rejected"] as StatusTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-md border text-sm ${
              activeTab === t ? "bg-black text-white" : "bg-white"
            }`}
          >
            {t === "Pending"
              ? "Bekleyen"
              : t === "Approved"
              ? "Onaylanan"
              : "Reddedilen"}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {historyApiMissing && activeTab !== "Pending" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Geçmiş sorgu endpoint'i bulunamadı (404). Backend'in{" "}
          <code>/workspace/location-update-requests/history?status=…</code>{" "}
          endpoint'i yayında olmayabilir.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Tarih</th>
              <th className="px-3 py-2 text-left">Seyahat</th>
              <th className="px-3 py-2 text-left">Müşteri</th>
              <th className="px-3 py-2 text-left">Mevcut (lat,lng)</th>
              <th className="px-3 py-2 text-left">İstenen (lat,lng)</th>
              <th className="px-3 py-2 text-left">Sebep</th>
              {activeTab !== "Pending" && (
                <>
                  <th className="px-3 py-2 text-left">İşleyen</th>
                  <th className="px-3 py-2 text-left">İşlem Tarihi</th>
                  <th className="px-3 py-2 text-left">Red Gerekçesi</th>
                </>
              )}
              <th className="px-3 py-2 text-left">Durum</th>
              {activeTab === "Pending" && (
                <th className="px-3 py-2 text-left">Aksiyon</th>
              )}
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={activeTab === "Pending" ? 8 : 11}
                  className="px-3 py-6 text-center text-gray-500"
                >
                  Talep bulunamadı.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={activeTab === "Pending" ? 8 : 11}
                  className="px-3 py-6 text-center text-gray-500"
                >
                  Yükleniyor…
                </td>
              </tr>
            )}

            {!loading &&
              items.map((it) => {
                const created = new Date(it.createdAt);
                const processed = it.processedAt
                  ? new Date(it.processedAt)
                  : null;
                return (
                  <tr key={it.id} className="border-t">
                    <td className="px-3 py-2">
                      {created.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-2">{it.journeyName ?? "-"}</td>
                    <td className="px-3 py-2">{it.customerName ?? "-"}</td>
                    <td className="px-3 py-2">
                      {trNumber(it.currentLatitude)}, {trNumber(it.currentLongitude)}
                    </td>
                    <td className="px-3 py-2">
                      {trNumber(it.requestedLatitude)},{" "}
                      {trNumber(it.requestedLongitude)}
                    </td>
                    <td className="px-3 py-2 max-w-[280px]">
                      <div className="line-clamp-2" title={it.reason}>
                        {it.reason}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Talep eden: {it.requestedByName}
                      </div>
                    </td>

                    {activeTab !== "Pending" && (
                      <>
                        <td className="px-3 py-2">
                          {it.approvedByName ?? "-"}
                        </td>
                        <td className="px-3 py-2">
                          {processed ? processed.toLocaleString("tr-TR") : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {it.status === "Rejected"
                            ? it.rejectionReason || "-"
                            : "-"}
                        </td>
                      </>
                    )}

                    <td className="px-3 py-2">
                      {activeTab === "Pending"
                        ? "Bekliyor"
                        : activeTab === "Approved"
                        ? "Onaylandı"
                        : "Reddedildi"}
                    </td>

                    {activeTab === "Pending" && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approve(it.id)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-green-50"
                            title="Onayla"
                          >
                            <Check size={16} />
                            Onayla
                          </button>
                          <button
                            onClick={() => reject(it.id)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-red-50"
                            title="Reddet"
                          >
                            <X size={16} />
                            Reddet
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
