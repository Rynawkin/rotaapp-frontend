import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  Grid3x3,
  List,
  MapPin,
  MoreVertical,
  Navigation,
  Play,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Truck,
  XCircle
} from 'lucide-react';
import { Route } from '@/types';
import { routeService } from '@/services/route.service';
import { journeyService } from '@/services/journey.service';
import { PageEmptyState, PageHeader, PageLoading } from '@/components/ui/PageChrome';

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'date' | 'distance' | 'progress' | 'stops';
type SortDirection = 'asc' | 'desc';

const statusText: Record<string, string> = {
  draft: 'Taslak',
  planned: 'Planlandi',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandi',
  cancelled: 'Iptal Edildi'
};

const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedRouteForJourney, setSelectedRouteForJourney] = useState<Route | null>(null);
  const [journeyName, setJourneyName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      setRoutes(await routeService.getAll());
    } catch (error: any) {
      alert(error.userFriendlyMessage || error.response?.data?.message || 'Rotalar yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const applyQuickFilter = (filter: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (filter === 'today') setSelectedDate(today.toISOString().split('T')[0]);
    if (filter === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    }
    if (filter === 'active') {
      setSelectedDate('');
      setSelectedStatus('in_progress');
    } else if (filter === 'completed') {
      setSelectedDate('');
      setSelectedStatus('completed');
    } else if (filter === 'all') {
      setSelectedDate('');
      setSelectedStatus('all');
      setSearchQuery('');
    } else if (filter === 'today' || filter === 'tomorrow') {
      setSelectedStatus('all');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedRoutes = [...routes]
    .filter((route) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        route.name.toLowerCase().includes(q) ||
        route.driver?.name.toLowerCase().includes(q) ||
        route.vehicle?.plateNumber.toLowerCase().includes(q);
      const matchesStatus = selectedStatus === 'all' || route.status === selectedStatus;
      const matchesDate = !selectedDate || new Date(route.date).toISOString().split('T')[0] === selectedDate;
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      const getValue = (route: Route) => {
        if (sortField === 'name') return route.name.toLowerCase();
        if (sortField === 'date') return new Date(route.date).getTime();
        if (sortField === 'distance') return route.totalDistance || 0;
        if (sortField === 'progress') return route.totalDeliveries ? route.completedDeliveries / route.totalDeliveries : 0;
        return route.stops?.length || 0;
      };
      const aValue = getValue(a);
      const bValue = getValue(b);
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSelectAll = () => {
    setSelectedRoutes(
      selectedRoutes.size === sortedRoutes.length ? new Set() : new Set(sortedRoutes.map((route) => route.id))
    );
  };

  const toggleSelectRoute = (id: string) => {
    const next = new Set(selectedRoutes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRoutes(next);
  };

  const handleBulkDelete = async () => {
    if (!selectedRoutes.size) return;
    if (!window.confirm(`${selectedRoutes.size} rotayi silmek istediginizden emin misiniz?`)) return;
    try {
      await Promise.all(Array.from(selectedRoutes).map((id) => routeService.delete(id)));
      setSelectedRoutes(new Set());
      await loadRoutes();
    } catch (error: any) {
      alert(error.userFriendlyMessage || error.response?.data?.message || 'Toplu silme basarisiz');
    }
  };

  const handleExcelExport = () => {
    const rows = (selectedRoutes.size ? sortedRoutes.filter((route) => selectedRoutes.has(route.id)) : sortedRoutes)
      .map((route) => [
        route.name,
        new Date(route.date).toLocaleDateString('tr-TR'),
        route.driver?.name || 'Atanmadi',
        route.vehicle?.plateNumber || 'Atanmadi',
        statusText[route.status] || route.status,
        route.stops?.length || 0,
        route.totalDistance || '-',
        route.totalDuration || '-',
        `${route.completedDeliveries}/${route.totalDeliveries}`
      ]);
    const csv = [['Rota', 'Tarih', 'Surucu', 'Arac', 'Durum', 'Durak', 'Mesafe', 'Sure', 'Ilerleme'], ...rows]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rotalar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu rotayi silmek istediginizden emin misiniz?')) return;
    await routeService.delete(id);
    await loadRoutes();
  };

  const handleDuplicate = async (route: Route) => {
    await routeService.duplicate(route);
    await loadRoutes();
  };

  const handleStartJourney = async (route: Route) => {
    if (!route.driverId || !route.vehicleId) {
      alert('Sefer baslatmak icin rotaya surucu ve arac atamalisiniz.');
      navigate(`/routes/${route.id}/edit`);
      return;
    }
    if (!route.stops?.length) {
      alert('Sefer baslatmak icin en az bir durak eklemelisiniz.');
      return;
    }
    setSelectedRouteForJourney(route);
    setJourneyName(`${route.name} - ${new Date().toLocaleDateString('tr-TR')}`);
    setShowNameModal(true);
  };

  const handleConfirmStartJourney = async () => {
    if (!selectedRouteForJourney || !journeyName.trim()) return;
    const journey = await journeyService.startFromRoute(
      selectedRouteForJourney.id,
      selectedRouteForJourney.driverId,
      journeyName
    );
    setShowNameModal(false);
    setSelectedRouteForJourney(null);
    setJourneyName('');
    navigate(`/journeys/${journey.id}`);
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField !== field ? (
      <ArrowUpDown className="ml-1 h-4 w-4 text-slate-400" />
    ) : sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4 text-slate-700" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 text-slate-700" />
    );

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'draft') return <span className="app-pill bg-slate-100 text-slate-600"><Edit className="h-3.5 w-3.5" />Taslak</span>;
    if (status === 'planned') return <span className="app-status-info"><Calendar className="mr-1 h-3.5 w-3.5" />Planlandi</span>;
    if (status === 'in_progress') return <span className="app-status-success"><Navigation className="mr-1 h-3.5 w-3.5" />Devam Ediyor</span>;
    if (status === 'completed') return <span className="app-status-info"><CheckCircle className="mr-1 h-3.5 w-3.5" />Tamamlandi</span>;
    return <span className="app-status-danger"><XCircle className="mr-1 h-3.5 w-3.5" />Iptal Edildi</span>;
  };

  const RowMenu = ({ route }: { route: Route }) => (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(dropdownOpen === route.id ? null : route.id)}
        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {dropdownOpen === route.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
          <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <Link to={`/routes/${route.id}`} onClick={() => setDropdownOpen(null)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" />Goruntule</Link>
            <Link to={`/routes/${route.id}/edit`} onClick={() => setDropdownOpen(null)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Edit className="h-4 w-4" />Duzenle</Link>
            {(route.status === 'planned' || route.status === 'draft') && !!route.stops?.length && <button onClick={() => { handleStartJourney(route); setDropdownOpen(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50"><Play className="h-4 w-4" />Sefer Olustur</button>}
            {route.status === 'in_progress' && <button onClick={async () => { const journey = await journeyService.getByRouteId(route.id); if (journey) navigate(`/journeys/${journey.id}`); setDropdownOpen(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"><Navigation className="h-4 w-4" />Sefere Git</button>}
            <button onClick={() => { handleDuplicate(route); setDropdownOpen(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" />Kopyala</button>
            <button onClick={() => { handleDelete(route.id); setDropdownOpen(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" />Sil</button>
          </div>
        </>
      )}
    </div>
  );

  if (loading) return <PageLoading label="Rotalar yukleniyor..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasyon"
        title="Rotalar"
        description="Rota havuzunu, sefere hazir kayitlari ve operasyon durumlarini tek ekranda yonetin. Stitch'te gorunmeyen gercek alanlar kod tarafinda korunur."
        actions={
          <>
            <button onClick={handleExcelExport} className="app-button-secondary">
              <Download className="h-4 w-4" />
              Excel Indir
            </button>
            <Link to="/routes/new" className="app-button-primary">
              <Plus className="h-4 w-4" />
              Yeni Rota
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Toplam Rota', routes.length, 'Tum kayitlar', <MapPin className="h-5 w-5" />, 'bg-blue-50 text-blue-700'],
          ['Aktif Rota', routes.filter((r) => r.status === 'in_progress').length, 'Sahadaki rotalar', <Navigation className="h-5 w-5" />, 'bg-emerald-50 text-emerald-700'],
          ['Bugunku Rotalar', routes.filter((r) => new Date(r.date).toDateString() === new Date().toDateString()).length, 'Bugun tarihli', <Calendar className="h-5 w-5" />, 'bg-violet-50 text-violet-700'],
          ['Optimize Edildi', routes.filter((r) => r.optimized).length, 'Optimizasyonu tamamlanan', <TrendingUp className="h-5 w-5" />, 'bg-amber-50 text-amber-700']
        ].map(([label, value, copy, icon, color]) => (
          <article key={String(label)} className="app-kpi">
            <div className="flex items-start justify-between">
              <div>
                <p className="app-kpi-label">{label}</p>
                <p className="app-kpi-value">{value as number}</p>
                <p className="app-kpi-meta">{copy as string}</p>
              </div>
              <div className={`rounded-2xl p-3 ${color as string}`}>{icon as React.ReactNode}</div>
            </div>
          </article>
        ))}
      </section>

      <section className="app-toolbar">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ['all', 'Tumu', !selectedDate && selectedStatus === 'all' && !searchQuery],
            ['today', 'Bugun', selectedDate === new Date().toISOString().split('T')[0]],
            ['tomorrow', 'Yarin', false],
            ['active', 'Aktif', selectedStatus === 'in_progress'],
            ['completed', 'Tamamlanan', selectedStatus === 'completed']
          ].map(([key, label, active]) => (
            <button
              key={String(key)}
              onClick={() => applyQuickFilter(String(key))}
              className={active ? 'rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white' : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50'}
            >
              {label as string}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button onClick={() => setViewMode('list')} className={`rounded-xl px-3 py-2 ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`rounded-xl px-3 py-2 ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><Grid3x3 className="h-4 w-4" /></button>
          </div>
          {!!selectedRoutes.size && (
            <button onClick={handleBulkDelete} className="app-button-secondary border-rose-200 text-rose-700 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" />
              Secilileri Sil ({selectedRoutes.size})
            </button>
          )}
        </div>
      </section>

      <section className="app-surface px-5 py-4 lg:px-6">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rota, arac veya surucu ara..." className="w-full py-3 pl-10 pr-4" />
          </label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-4 py-3">
            <option value="all">Tum Durumlar</option>
            <option value="draft">Taslak</option>
            <option value="planned">Planlandi</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="completed">Tamamlandi</option>
            <option value="cancelled">Iptal Edildi</option>
          </select>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-3" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="app-pill">{sortedRoutes.length} kayit</span>
          {!!selectedDate && <span className="app-pill">Tarih: {selectedDate}</span>}
          {selectedStatus !== 'all' && <span className="app-pill">Durum: {statusText[selectedStatus]}</span>}
          <span className="app-pill">Gercek operasyon alanlari korunur</span>
        </div>
      </section>

      {viewMode === 'list' ? (
        <section className="app-table-shell overflow-x-auto">
          <table>
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="px-5 py-4 text-left"><input type="checkbox" checked={selectedRoutes.size === sortedRoutes.length && !!sortedRoutes.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300" /></th>
                <th className="px-5 py-4 text-left"><button onClick={() => handleSort('name')} className="inline-flex items-center">Rota<SortIcon field="name" /></button></th>
                <th className="px-5 py-4 text-left"><button onClick={() => handleSort('date')} className="inline-flex items-center">Tarih<SortIcon field="date" /></button></th>
                <th className="px-5 py-4 text-left">Surucu</th>
                <th className="px-5 py-4 text-left">Arac</th>
                <th className="px-5 py-4 text-left">Durum</th>
                <th className="px-5 py-4 text-left"><button onClick={() => handleSort('progress')} className="inline-flex items-center">Ilerleme<SortIcon field="progress" /></button></th>
                <th className="px-5 py-4 text-left"><button onClick={() => handleSort('distance')} className="inline-flex items-center">Mesafe<SortIcon field="distance" /></button></th>
                <th className="px-5 py-4 text-left">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {!sortedRoutes.length ? (
                <tr><td colSpan={9} className="px-6 py-16"><PageEmptyState title="Rota bulunamadi" description="Filtreleri degistirin veya yeni rota olusturun." /></td></tr>
              ) : (
                sortedRoutes.map((route) => {
                  const progress = route.totalDeliveries ? Math.round((route.completedDeliveries / route.totalDeliveries) * 100) : 0;
                  return (
                    <tr key={route.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-5 py-4 align-top"><input type="checkbox" checked={selectedRoutes.has(route.id)} onChange={() => toggleSelectRoute(route.id)} className="mt-1 h-4 w-4 rounded border-slate-300" /></td>
                      <td className="px-5 py-4"><div className="flex items-start gap-3"><div className="rounded-2xl bg-blue-50 p-2.5 text-blue-700"><MapPin className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-slate-950">{route.name}</p><p className="mt-1 text-xs text-slate-500">{route.stops?.length || 0} durak {route.optimized && <span className="ml-2 text-emerald-600">Optimize edildi</span>}</p></div></div></td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">{formatDate(route.date)}</td>
                      <td className="px-5 py-4">{route.driver ? <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">{route.driver.name.split(' ').map((n) => n[0]).join('')}</div><span className="text-sm font-medium text-slate-900">{route.driver.name}</span></div> : <span className="text-sm text-slate-400">Atanmadi</span>}</td>
                      <td className="px-5 py-4">{route.vehicle ? <div className="flex items-center gap-2 text-sm font-medium text-slate-900"><Truck className="h-4 w-4 text-slate-400" />{route.vehicle.plateNumber}</div> : <span className="text-sm text-slate-400">Atanmadi</span>}</td>
                      <td className="px-5 py-4"><StatusBadge status={route.status} /></td>
                      <td className="px-5 py-4"><div className="flex min-w-[140px] items-center gap-3"><div className="h-2 flex-1 rounded-full bg-slate-200"><div className={`h-2 rounded-full ${route.status === 'completed' ? 'bg-emerald-500' : route.status === 'in_progress' ? 'bg-blue-600' : 'bg-slate-400'}`} style={{ width: `${progress}%` }} /></div><span className="text-sm font-medium text-slate-600">{route.completedDeliveries}/{route.totalDeliveries}</span></div></td>
                      <td className="px-5 py-4"><div className="space-y-1"><div className="flex items-center gap-2 text-sm text-slate-700"><Navigation className="h-4 w-4 text-slate-400" />{route.totalDistance ? `${route.totalDistance} km` : '-'}</div><div className="flex items-center gap-2 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" />{route.totalDuration ? `${route.totalDuration} dk` : 'Sure yok'}</div></div></td>
                      <td className="px-5 py-4"><RowMenu route={route} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {!sortedRoutes.length ? (
            <div className="md:col-span-2 xl:col-span-3"><PageEmptyState title="Rota bulunamadi" description="Grid gorunumunde gosterilecek rota yok." /></div>
          ) : (
            sortedRoutes.map((route) => {
              const progress = route.totalDeliveries ? Math.round((route.completedDeliveries / route.totalDeliveries) * 100) : 0;
              return (
                <article key={route.id} className="app-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <label className="flex items-center gap-3"><input type="checkbox" checked={selectedRoutes.has(route.id)} onChange={() => toggleSelectRoute(route.id)} className="h-4 w-4 rounded border-slate-300" /><div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><MapPin className="h-5 w-5" /></div></label>
                    <RowMenu route={route} />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2"><StatusBadge status={route.status} />{route.optimized && <span className="app-status-success">Optimize edildi</span>}</div>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{route.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(route.date)} · {route.stops?.length || 0} durak</p>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Surucu</span><span className="font-medium text-slate-800">{route.driver?.name || 'Atanmadi'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Arac</span><span className="font-medium text-slate-800">{route.vehicle?.plateNumber || 'Atanmadi'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Mesafe</span><span className="font-medium text-slate-800">{route.totalDistance ? `${route.totalDistance} km` : '-'}</span></div>
                  </div>
                  <div className="app-subcard mt-4 px-4 py-3"><div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><span>Ilerleme</span><span>{route.completedDeliveries}/{route.totalDeliveries}</span></div><div className="mt-3 h-2 rounded-full bg-slate-200"><div className={`h-2 rounded-full ${route.status === 'completed' ? 'bg-emerald-500' : route.status === 'in_progress' ? 'bg-blue-600' : 'bg-slate-400'}`} style={{ width: `${progress}%` }} /></div></div>
                  <div className="mt-5">
                    {(route.status === 'planned' || route.status === 'draft') && !!route.stops?.length ? (
                      <button onClick={() => handleStartJourney(route)} className="app-button-accent w-full"><Play className="h-4 w-4" />Sefer Olustur</button>
                    ) : route.status === 'in_progress' ? (
                      <button onClick={async () => { const journey = await journeyService.getByRouteId(route.id); if (journey) navigate(`/journeys/${journey.id}`); }} className="app-button-primary w-full"><Navigation className="h-4 w-4" />Sefere Git</button>
                    ) : (
                      <Link to={`/routes/${route.id}`} className="app-button-secondary w-full"><Eye className="h-4 w-4" />Detay</Link>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {showNameModal && selectedRouteForJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="app-surface w-full max-w-lg px-6 py-6">
            <h2 className="text-xl font-bold text-slate-950">Yeni Sefer Olustur</h2>
            <p className="mt-2 text-sm text-slate-500"><strong>{selectedRouteForJourney.name}</strong> rotasi icin sefer adi belirleyin. Rota ustundeki mevcut operasyon alanlari korunur.</p>
            <div className="mt-5 space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Sefer Adi</label>
              <input type="text" value={journeyName} onChange={(e) => setJourneyName(e.target.value)} className="w-full px-4 py-3" placeholder="Orn: Sabah Teslimati - 04.09.2025" autoFocus />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowNameModal(false); setSelectedRouteForJourney(null); setJourneyName(''); }} className="app-button-secondary">Iptal</button>
              <button onClick={handleConfirmStartJourney} disabled={!journeyName.trim()} className="app-button-primary disabled:cursor-not-allowed disabled:opacity-60"><Play className="h-4 w-4" />Seferi Olustur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routes;
