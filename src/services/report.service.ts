// frontend/src/services/report.service.ts
import { api } from './api';
import { routeService } from './route.service';
import { journeyService } from './journey.service';
import { customerService } from './customer.service';
import { driverService } from './driver.service';
import { vehicleService } from './vehicle.service';

class ReportService {
  async getDeliveryTrends(days: number = 7) {
    try {
      const response = await api.get(`/reports/delivery-trends?days=${days}`);
      return response.data;
    } catch (error) {
      // Fallback to calculating from routes
      const routes = await routeService.getAll();
      const trends = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRoutes = routes.filter(r => {
          const routeDate = new Date(r.date).toISOString().split('T')[0];
          return routeDate === dateStr;
        });
        
        const completed = dayRoutes.reduce((acc, r) => acc + r.completedDeliveries, 0);
        const total = dayRoutes.reduce((acc, r) => acc + r.totalDeliveries, 0);
        const failed = total - completed;
        
        trends.push({
          date: dateStr,
          completed,
          failed,
          total
        });
      }
      
      return trends;
    }
  }

  async getDriverPerformance() {
    try {
      const response = await api.get('/reports/driver-performance');
      return response.data;
    } catch (error) {
      // Fallback calculation
      const drivers = await driverService.getAll();
      const routes = await routeService.getAll();
      
      return drivers.map(driver => {
        const driverRoutes = routes.filter(r => r.driverId === driver.id);
        const completedDeliveries = driverRoutes.reduce((acc, r) => acc + r.completedDeliveries, 0);
        const avgTime = driverRoutes.length > 0
          ? driverRoutes.reduce((acc, r) => acc + (r.totalDuration || 0), 0) / driverRoutes.length
          : 0;
        
        return {
          driverId: driver.id,
          driverName: driver.name,
          totalDeliveries: completedDeliveries,
          completedDeliveries,
          avgDeliveryTime: Math.round(avgTime),
          totalDistance: driverRoutes.reduce((acc, r) => acc + (r.totalDistance || 0), 0),
          rating: driver.rating || 0
        };
      });
    }
  }

  async getVehicleUtilization() {
    try {
      const response = await api.get('/reports/vehicle-utilization');
      return response.data;
    } catch (error) {
      // Fallback calculation
      const vehicles = await vehicleService.getAll();
      const routes = await routeService.getAll();
      
      return vehicles.map(vehicle => {
        const vehicleRoutes = routes.filter(r => r.vehicleId === vehicle.id.toString());
        const totalDistance = vehicleRoutes.reduce((acc, r) => acc + (r.totalDistance || 0), 0);
        const utilizationRate = Math.min(100, Math.round((vehicleRoutes.length / 30) * 100));
        
        return {
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          totalRoutes: vehicleRoutes.length,
          totalDistance: Math.round(totalDistance),
          utilizationRate
        };
      });
    }
  }

  async getSummaryStats() {
    try {
      const response = await api.get('/reports/summary');
      return response.data;
    } catch (error) {
      // Fallback to calculating from data
      const [routes, drivers, vehicles, customers] = await Promise.all([
        routeService.getAll(),
        driverService.getAll(),
        vehicleService.getAll(),
        customerService.getAll()
      ]);
      
      const totalDeliveries = routes.reduce((acc, r) => acc + r.completedDeliveries, 0);
      const totalPlanned = routes.reduce((acc, r) => acc + r.totalDeliveries, 0);
      const successRate = totalPlanned > 0 ? Math.round((totalDeliveries / totalPlanned) * 100) : 0;
      const avgDeliveryTime = routes.length > 0
        ? Math.round(routes.reduce((acc, r) => acc + (r.totalDuration || 0), 0) / routes.length)
        : 0;
      const activeDrivers = drivers.filter(d => d.status === 'available' || d.status === 'busy').length;
      const activeVehicles = vehicles.filter(v => v.status === 'active').length;
      const totalDistance = routes.reduce((acc, r) => acc + (r.totalDistance || 0), 0);
      
      return {
        totalDeliveries,
        successRate,
        avgDeliveryTime,
        totalDistance: Math.round(totalDistance),
        activeDrivers,
        activeVehicles,
        totalCustomers: customers.length
      };
    }
  }
}

export const reportService = new ReportService();