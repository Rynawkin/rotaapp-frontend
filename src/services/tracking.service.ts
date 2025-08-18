// frontend/src/services/tracking.service.ts
import * as signalR from '@microsoft/signalr';

export interface LiveLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

export interface ActiveVehicle {
  journeyId: number;
  vehicleId: number;
  plateNumber: string;
  driverId: number;
  driverName: string;
  location?: LiveLocation;
  currentStopIndex: number;
  totalStops: number;
  startedAt?: Date;
}

class TrackingService {
  private hubConnection: signalR.HubConnection | null = null;
  private vehicleUpdateCallbacks: ((vehicle: any) => void)[] = [];
  private emergencyCallbacks: ((alert: any) => void)[] = [];
  
  // Hangi araçları/workspace'i takip ediyoruz
  private trackedVehicles = new Set<number>();
  private trackedWorkspaceId: number | null = null;

  async connect(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found for tracking connection');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5055/api';
    const baseUrl = apiUrl.replace('/api', '');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/tracking`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Reconnect olunca gruplara yeniden katıl
    this.hubConnection.onreconnected(async () => {
      console.log('✅ Tracking reconnected, rejoining groups...');
      
      // Takip edilen araçlara yeniden katıl
      for (const vehicleId of this.trackedVehicles) {
        await this.joinVehicleTracking(vehicleId);
      }
      
      // Workspace'e yeniden katıl
      if (this.trackedWorkspaceId) {
        await this.joinWorkspaceTracking(this.trackedWorkspaceId);
      }
    });

    // Event listeners
    this.hubConnection.on('VehicleLocationUpdated', (data) => {
      console.log('Vehicle location updated:', data);
      this.vehicleUpdateCallbacks.forEach(cb => cb(data));
    });

    this.hubConnection.on('WorkspaceVehicleUpdated', (data) => {
      console.log('Workspace vehicle updated:', data);
      this.vehicleUpdateCallbacks.forEach(cb => cb(data));
    });

    this.hubConnection.on('EmergencyAlert', (alert) => {
      console.error('🚨 EMERGENCY ALERT:', alert);
      this.emergencyCallbacks.forEach(cb => cb(alert));
    });

    try {
      await this.hubConnection.start();
      console.log('✅ Tracking SignalR Connected');
    } catch (err) {
      console.error('❌ Tracking SignalR Connection Error:', err);
      // Yeniden bağlanmayı dene
      setTimeout(() => this.connect(), 5000);
    }
  }

  // Bağlantı durumunu kontrol et
  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  async getActiveVehicles(): Promise<ActiveVehicle[]> {
    if (!this.isConnected()) {
      console.warn('Not connected to tracking hub');
      return [];
    }
    
    try {
      return await this.hubConnection!.invoke('GetActiveVehicles');
    } catch (error) {
      console.error('Error getting active vehicles:', error);
      return [];
    }
  }

  async joinVehicleTracking(vehicleId: number): Promise<void> {
    if (!this.isConnected()) {
      console.warn('Not connected to tracking hub');
      return;
    }
    
    try {
      await this.hubConnection!.invoke('JoinVehicleTracking', vehicleId);
      this.trackedVehicles.add(vehicleId); // Takip listesine ekle
      console.log(`Joined vehicle tracking: ${vehicleId}`);
    } catch (error) {
      console.error('Error joining vehicle tracking:', error);
    }
  }

  async leaveVehicleTracking(vehicleId: number): Promise<void> {
    if (!this.isConnected()) return;
    
    try {
      await this.hubConnection!.invoke('LeaveVehicleTracking', vehicleId);
      this.trackedVehicles.delete(vehicleId); // Takip listesinden çıkar
      console.log(`Left vehicle tracking: ${vehicleId}`);
    } catch (error) {
      console.error('Error leaving vehicle tracking:', error);
    }
  }

  async joinWorkspaceTracking(workspaceId: number): Promise<void> {
    if (!this.isConnected()) {
      console.warn('Not connected to tracking hub');
      return;
    }
    
    try {
      await this.hubConnection!.invoke('JoinWorkspaceTracking', workspaceId);
      this.trackedWorkspaceId = workspaceId; // Workspace'i hatırla
      console.log(`Joined workspace tracking: ${workspaceId}`);
    } catch (error) {
      console.error('Error joining workspace tracking:', error);
    }
  }

  // ✅ YENİ METOD: Workspace tracking'den ayrıl
  async leaveWorkspaceTracking(workspaceId: number): Promise<void> {
    if (!this.isConnected()) return;
    
    try {
      await this.hubConnection!.invoke('LeaveWorkspaceTracking', workspaceId);
      this.trackedWorkspaceId = null;
      console.log(`Left workspace tracking: ${workspaceId}`);
    } catch (error) {
      console.error('Error leaving workspace tracking:', error);
    }
  }

  // Simulator için
  async updateLocation(journeyId: number, lat: number, lng: number, speed?: number): Promise<void> {
    if (!this.isConnected()) {
      console.warn('Not connected to tracking hub');
      return;
    }
    
    try {
      await this.hubConnection!.invoke('UpdateVehicleLocation', {
        journeyId,
        latitude: lat,
        longitude: lng,
        speed,
        heading: 0,
        accuracy: 10
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  onVehicleUpdate(callback: (vehicle: any) => void): () => void {
    this.vehicleUpdateCallbacks.push(callback);
    // Unsubscribe fonksiyonu döndür
    return () => {
      const index = this.vehicleUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.vehicleUpdateCallbacks.splice(index, 1);
      }
    };
  }

  onEmergencyAlert(callback: (alert: any) => void): () => void {
    this.emergencyCallbacks.push(callback);
    // Unsubscribe fonksiyonu döndür
    return () => {
      const index = this.emergencyCallbacks.indexOf(callback);
      if (index > -1) {
        this.emergencyCallbacks.splice(index, 1);
      }
    };
  }

  disconnect(): void {
    this.vehicleUpdateCallbacks = [];
    this.emergencyCallbacks = [];
    this.trackedVehicles.clear();
    this.trackedWorkspaceId = null;
    
    if (this.hubConnection) {
      this.hubConnection.stop();
      console.log('Tracking SignalR Disconnected');
    }
  }
}

export const trackingService = new TrackingService();
export default trackingService;