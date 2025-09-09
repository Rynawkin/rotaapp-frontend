// src/pages/LocationUpdateRequests.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { MapPin, User, Clock, CheckCircle, XCircle } from 'lucide-react';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

interface LocationUpdateRequestDto {
  id: number;
  journeyId: number;
  journeyName: string;
  customerId: number;
  customerName: string;

  // ÖNEMLİ: API’den sayı geliyorsa number; bazen string dönen projelerde de bozulmasın diye union.
  currentLatitude: number | string;
  currentLongitude: number | string;
  currentAddress: string;

  requestedLatitude: number | string;
  requestedLongitude: number | string;
  requestedAddress: string;

  reason: string;
  requestedByName: string;

  createdAt: string;     // UTC (veya offsetli) ISO
  processedAt?: string | null; // UTC (veya offsetli) ISO (Approved/Rejected için)
  approvedByName?: string | null;
  rejectionReason?: string | null;
}

const fmtTR = new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * .NET tarafının ürettiği olası tarih formatlarını ele alır:
 *  - "2025-09-09T01:06:19.4866667Z"
 *  - "2025-09-09T01:06:19.4866667+00:00"
 *  - "2025-09-09T01:06:19Z"
 *  - "2025-09-09T01:06:19.4866667" (offset yoksa UTC varsay)
 */
function parseDotNetIsoAsUtc(value?: string | null): Date | null {
  if (!value) return null;

  // Zaten JS'in güvenli parse edebildiği durumlar
  const hasZ = /z$/i.test(value);
  const hasOffset = /[+-]\d{2}:\d{2}$/.test(value);

  // Milisaniye kısmı 1-7 hane olabilir: yakalayalım
  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?(Z|[+-]\d{2}:\d{2})?$/i
  );

  // Offset yoksa, stringin sonuna 'Z' ekleyip UTC olarak parse edeceğiz.
  if (!hasZ && !hasOffset) {
    // MS kısmı varsa ilk 3 haneyi milisaniye olarak kullan (JS en fazla ms destekler)
    if (m) {
      const [ , Y, Mo, D, H, Mi, S = '00', Ms = '' ] = m;
      const ms3 = Ms ? Ms.substring(0, 3).padEnd(3, '0') : '000';
      const rebuilt = `${Y}-${Mo}-${D}T${H}:${Mi}:${S}.${ms3}Z`;
      return new Date(rebuilt);
    }
    // Düşerse, son çare olarak sonuna Z ekle
    return new Date(value + 'Z');
  }

  // Offset/Z varsa direkt parse et
  // 7 haneli ms'yi yine 3 haneye indir (özellikle iOS/Safari edge-case)
  if (m) {
    const [ , Y, Mo, D, H, Mi, S = '00', Ms = '', Off = '' ] = m;
    const ms3 = Ms ? Ms.substring(0, 3).padEnd(3, '0') : '000';
    const rebuilt = `${Y}-${Mo}-${D}T${H}:${Mi}:${S}.${ms3}${Off || ''}`;
    return new Date(rebuilt);
  }

  // Olmadıysa normal parse
  return new Date(value);
}

function formatDateTR(dateStr?: string | null): string {
  const d = parseDotNetIsoAsUtc(dateStr);
  if (!d || isNaN(d.getTime())) return '-';
  return fmtTR.format(d);
}

// Koordinatı ekranda aynen göster (YUVARLAMA YOK)
function displayCoord(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '-';
  // String ise aynen dön
  if (typeof val === 'string') return val;
  // Number ise olduğu gibi yaz (toString herhangi bir locale uygulamaz)
  return Number(val).toString();
}

function mapsUrl(lat: number | string, lng: number | string) {
  return `https://www.google.com/maps?q=${lat},${lng}&z=19`;
}

export default function LocationUpdateRequests() {
  const [tab, setTab] = useState<RequestStatus>('Pending');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LocationUpdateRequestDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    switch (tab) {
      case 'Pending': return 'Bekleyen Konum Güncelleme Talepleri';
      case 'Approved': return 'Onaylanan Konum Güncellemeleri';
      case 'Rejected': return 'Reddedilen Konum Güncellemeleri';
    }
  }, [tab]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'Pending') {
        const { data } = await api.get<LocationUpdateRequestDto[]>('/workspace/location-update-requests/pending');
        setRows(data || []);
      } else {
        const { data } = await api.get<LocationUpdateRequestDto[]>(
          '/workspace/location-update-requests/history',
          { params: { status: tab } }
        );
        setRows(data || []);
      }
    } catch (err: any) {
      console.error('Talepler yüklenemedi:', err);
      setError('Talepler yüklenemedi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function approve(id: number, applyToNextRoutes: boolean) {
    try {
      await api.post(`/workspace/location-update-requests/${id}/approve`, { applyToNextRoutes });
      await fetchData();
    } catch (e) {
      console.error('Onaylama başarısız:', e);
      alert('Onaylama başarısız, lütfen tekrar deneyin.');
    }
  }

  async function reject(id: number) {
    const reason = prompt('Reddetme sebebi:') || '';
    try {
      await api.post(`/workspace/location-update-requests/${id}/reject`, { rejectionReason: reason });
      await fetchData();
    } catch (e) {
      console.error('Reddetme başarısız:', e);
      alert('Reddetme başarısız, lütfen tekrar deneyin.');
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{title}</h1>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {(['Pending', 'Approved', 'Rejected'] as RequestStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-3 py-2 rounded-md border ${tab === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
          >
            {s === 'Pending' ? 'Bekleyen' : s === 'Approved' ? 'Onaylanan' : 'Reddedilen'}
          </button>
        ))}
      </div>

      {loading && <div>Yükleniyor…</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="text-gray-500">Kayıt bulunamadı.</div>
      )}

      <div className="space-y-4">
        {rows.map(r => (
          <div key={r.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-base font-semibold text-gray-900">{r.customerName}</div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600 mt-2">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {r.requestedByName}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Talep: {formatDateTR(r.createdAt)}
                  </span>
                  {tab !== 'Pending' && (
                    <span className="inline-flex items-center gap-1">
                      {tab === 'Approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      İşlem: {formatDateTR(r.processedAt || null)}
                    </span>
                  )}
                  {tab === 'Approved' && r.approvedByName && (
                    <span className="inline-flex items-center gap-1">
                      Onaylayan: {r.approvedByName}
                    </span>
                  )}
                  {tab === 'Rejected' && r.rejectionReason && (
                    <span className="inline-flex items-center gap-1">
                      Red sebebi: {r.rejectionReason}
                    </span>
                  )}
                </div>
              </div>

              {tab === 'Pending' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 flex items-center gap-2">
                    <input id={`apply_${r.id}`} type="checkbox" className="size-4" />
                    Sonraki rotalara da uygula
                  </label>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      const cb = document.getElementById(`apply_${r.id}`) as HTMLInputElement | null;
                      approve(r.id, !!cb?.checked);
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Onayla
                  </button>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                    onClick={() => reject(r.id)}
                  >
                    <XCircle className="w-4 h-4" />
                    Reddet
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="rounded border p-3">
                <div className="text-xs uppercase text-gray-500 mb-1">Mevcut Konum</div>
                <div className="font-mono text-sm">
                  {displayCoord(r.currentLatitude)}, {displayCoord(r.currentLongitude)}
                </div>
                <div className="mt-2">
                  <a
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    href={mapsUrl(r.currentLatitude, r.currentLongitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="w-4 h-4" />
                    Haritada Aç
                  </a>
                </div>
                {/* Adres alanına koordinat yazılmaması istenmişti; sadece varsa gösteririz */}
                {r.currentAddress && (
                  <div className="text-sm text-gray-600 mt-2 break-words">
                    {r.currentAddress}
                  </div>
                )}
              </div>

              <div className="rounded border p-3">
                <div className="text-xs uppercase text-gray-500 mb-1">Talep Edilen Konum</div>
                <div className="font-mono text-sm">
                  {displayCoord(r.requestedLatitude)}, {displayCoord(r.requestedLongitude)}
                </div>
                <div className="mt-2">
                  <a
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    href={mapsUrl(r.requestedLatitude, r.requestedLongitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="w-4 h-4" />
                    Haritada Aç
                  </a>
                </div>
                {/* Talep edilen adres alanı boş olabilir; olduğunda sadece metni göster */}
                {r.requestedAddress && (
                  <div className="text-sm text-gray-600 mt-2 break-words">
                    {r.requestedAddress}
                  </div>
                )}
              </div>
            </div>

            {r.reason && (
              <div className="text-sm text-gray-700 mt-3">
                <span className="font-medium">Gerekçe: </span>
                {r.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
