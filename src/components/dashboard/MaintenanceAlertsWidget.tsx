import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wrench, Calendar, Clock, ChevronRight, X } from 'lucide-react';
import { maintenanceService } from '@/services/maintenance.service';
import { Link } from 'react-router-dom';

interface UpcomingMaintenance {
  id: number;
  vehicleId: number;
  vehiclePlate?: string;
  vehicleBrand?: string;
  type: string;
  title: string;
  nextMaintenanceDate: Date;
  daysRemaining: number;
  isOverdue: boolean;
}

const MaintenanceAlertsWidget: React.FC = () => {
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<UpcomingMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadUpcomingMaintenances();
  }, []);

  const loadUpcomingMaintenances = async () => {
    try {
      // Get upcoming maintenances (within 30 days)
      const maintenances = await maintenanceService.getUpcoming(30);

      // Calculate days remaining and overdue status
      const now = new Date();
      const enriched = maintenances
        .filter(m => m.nextMaintenanceDate)
        .map(m => {
          const maintenanceDate = new Date(m.nextMaintenanceDate!);
          const diffTime = maintenanceDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return {
            ...m,
            daysRemaining: diffDays,
            isOverdue: diffDays < 0
          };
        })
        .sort((a, b) => a.daysRemaining - b.daysRemaining); // Overdue first, then by days

      setUpcomingMaintenances(enriched);
    } catch (error) {
      console.error('Error loading upcoming maintenances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaintenanceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      routine: 'Rutin Bakım',
      repair: 'Tamir',
      inspection: 'Muayene',
      tire_change: 'Lastik Değişimi',
      oil_change: 'Yağ Değişimi',
      other: 'Diğer'
    };
    return labels[type] || type;
  };

  const getAlertColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'border-red-500 bg-red-50';
    if (daysRemaining <= 7) return 'border-orange-500 bg-orange-50';
    return 'border-yellow-500 bg-yellow-50';
  };

  const getTextColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'text-red-700';
    if (daysRemaining <= 7) return 'text-orange-700';
    return 'text-yellow-700';
  };

  const getIconColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'text-red-600';
    if (daysRemaining <= 7) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getDaysText = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      return `${Math.abs(daysRemaining)} gün gecikmiş`;
    }
    if (daysRemaining === 0) {
      return 'Bugün';
    }
    if (daysRemaining === 1) {
      return 'Yarın';
    }
    return `${daysRemaining} gün içinde`;
  };

  if (loading) {
    return null;
  }

  // Don't show if no upcoming maintenances or user dismissed
  if (upcomingMaintenances.length === 0 || dismissed) {
    return null;
  }

  // Show critical alerts (overdue + within 7 days)
  const criticalMaintenances = upcomingMaintenances.filter(m => m.daysRemaining <= 7);

  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-500 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center">
                Yaklaşan Araç Bakımları
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  {criticalMaintenances.length}
                </span>
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Dikkat gerektiren bakımlar
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {criticalMaintenances.slice(0, 3).map((maintenance) => (
            <div
              key={maintenance.id}
              className={`border-l-4 ${getAlertColor(maintenance.daysRemaining)} p-3 rounded-r-lg`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <Wrench className={`w-4 h-4 mr-2 ${getIconColor(maintenance.daysRemaining)}`} />
                    <span className={`font-medium ${getTextColor(maintenance.daysRemaining)}`}>
                      {maintenance.vehiclePlate || `Araç #${maintenance.vehicleId}`}
                    </span>
                    {maintenance.vehicleBrand && (
                      <span className="text-gray-600 text-sm ml-2">
                        - {maintenance.vehicleBrand}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 ml-6">
                    {getMaintenanceTypeLabel(maintenance.type)}: {maintenance.title}
                  </p>

                  <div className="flex items-center mt-2 ml-6 text-xs">
                    {maintenance.isOverdue ? (
                      <div className="flex items-center text-red-600 font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{getDaysText(maintenance.daysRemaining)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>
                          {new Date(maintenance.nextMaintenanceDate).toLocaleDateString('tr-TR')}
                          {' '}
                          <span className={`font-medium ${getTextColor(maintenance.daysRemaining)}`}>
                            ({getDaysText(maintenance.daysRemaining)})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  to="/vehicles"
                  className={`ml-3 ${getIconColor(maintenance.daysRemaining)} hover:opacity-70 transition-opacity`}
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {upcomingMaintenances.length > 3 && (
          <Link
            to="/vehicles"
            className="block mt-3 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Tüm bakımları görüntüle ({upcomingMaintenances.length})
          </Link>
        )}
      </div>
    </div>
  );
};

export default MaintenanceAlertsWidget;
