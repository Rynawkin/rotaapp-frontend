import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  Truck,
  User,
  Plus,
  Save,
  Send,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import StopsList from './StopsList';
import { Route, Customer, Driver, Vehicle, Depot, RouteStop } from '@/types';
import { 
  customerService, 
  driverService, 
  vehicleService, 
  depotService 
} from '@/services/mockData';

interface RouteFormProps {
  initialData?: Route;
  onSubmit: (data: Partial<Route>) => void;
  onSaveAsDraft?: (data: Partial<Route>) => void;
  loading?: boolean;
  isEdit?: boolean;
}

const RouteForm: React.FC<RouteFormProps> = ({
  initialData,
  onSubmit,
  onSaveAsDraft,
  loading = false,
  isEdit = false
}) => {
  // Form State
  const [formData, setFormData] = useState<Partial<Route>>({
    name: initialData?.name || '',
    date: initialData?.date || new Date(),
    driverId: initialData?.driverId || '',
    vehicleId: initialData?.vehicleId || '',
    depotId: initialData?.depotId || '1',
    notes: initialData?.notes || '',
    stops: initialData?.stops || []
  });

  // Lists State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Selected customers for stops
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

  // Load lists on mount
  useEffect(() => {
    loadLists();
  }, []);

  // Initialize selected customers from initial data
  useEffect(() => {
    if (initialData?.stops && customers.length > 0) {
      const initialCustomers = initialData.stops
        .map(stop => customers.find(c => c.id === stop.customerId))
        .filter(Boolean) as Customer[];
      setSelectedCustomers(initialCustomers);
    }
  }, [initialData, customers]);

  const loadLists = async () => {
    setLoadingLists(true);
    try {
      const [customersData, driversData, vehiclesData, depotsData] = await Promise.all([
        customerService.getAll(),
        driverService.getAll(),
        vehicleService.getAll(),
        depotService.getAll()
      ]);

      setCustomers(customersData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setDepots(depotsData);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleAddCustomer = (customer: Customer) => {
    if (!selectedCustomers.find(c => c.id === customer.id)) {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
  };

  const handleRemoveCustomer = (customerId: string) => {
    setSelectedCustomers(selectedCustomers.filter(c => c.id !== customerId));
  };

  const handleReorderCustomers = (reorderedCustomers: Customer[]) => {
    setSelectedCustomers(reorderedCustomers);
  };

  const handleOptimize = () => {
    // Fake optimization - just shuffle for now
    const shuffled = [...selectedCustomers].sort(() => Math.random() - 0.5);
    setSelectedCustomers(shuffled);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create stops from selected customers
    const stops: RouteStop[] = selectedCustomers.map((customer, index) => ({
      id: `${Date.now()}-${index}`,
      routeId: initialData?.id || '',
      customerId: customer.id,
      customer: customer,
      order: index + 1,
      status: 'pending',
      estimatedArrival: new Date(),
      distance: Math.random() * 10 + 2 // Fake distance
    }));

    const routeData: Partial<Route> = {
      ...formData,
      stops,
      totalDeliveries: stops.length,
      status: 'planned'
    };

    onSubmit(routeData);
  };

  const handleSaveDraft = () => {
    const stops: RouteStop[] = selectedCustomers.map((customer, index) => ({
      id: `${Date.now()}-${index}`,
      routeId: initialData?.id || '',
      customerId: customer.id,
      customer: customer,
      order: index + 1,
      status: 'pending',
      estimatedArrival: new Date()
    }));

    const routeData: Partial<Route> = {
      ...formData,
      stops,
      totalDeliveries: stops.length,
      status: 'draft'
    };

    if (onSaveAsDraft) {
      onSaveAsDraft(routeData);
    }
  };

  if (loadingLists) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Route Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rota Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Kadıköy Sabah Turu"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sürücü
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Sürücü Seçin</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} {driver.status === 'busy' && '(Meşgul)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Araç
            </label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Araç Seçin</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Depot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.depotId}
                onChange={(e) => setFormData({ ...formData, depotId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                required
              >
                {depots.map(depot => (
                  <option key={depot.id} value={depot.id}>
                    {depot.name} {depot.isDefault && '(Varsayılan)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Rota ile ilgili notlarınız..."
            />
          </div>
        </div>
      </div>

      {/* Customer Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Müşteri Seçimi</h2>
          <button
            type="button"
            onClick={handleOptimize}
            disabled={selectedCustomers.length < 2}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Optimize Et
          </button>
        </div>

        <CustomerSelector
          customers={customers}
          selectedCustomers={selectedCustomers}
          onSelect={handleAddCustomer}
        />
      </div>

      {/* Stops List */}
      {selectedCustomers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Duraklar ({selectedCustomers.length})
          </h2>
          
          <StopsList
            customers={selectedCustomers}
            onRemove={handleRemoveCustomer}
            onReorder={handleReorderCustomers}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        {onSaveAsDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading || selectedCustomers.length === 0}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Taslak Kaydet
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading || selectedCustomers.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isEdit ? 'Güncelle' : 'Rota Oluştur'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RouteForm;