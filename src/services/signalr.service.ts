// frontend/src/services/signalr.service.ts
import * as signalR from '@microsoft/signalr';

// Production API URL
const API_BASE_URL = 'https://api.yolpilot.com';

export interface UpdateLocationDto {
  journeyId: number;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface ActiveVehicleDto {
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

export interface EmergencyAlertDto {
  journeyId: number;
  vehicleId: number;
  driverId: number;
  message: string;
  location?: LiveLocation;
}

export interface LiveLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

class SignalRService {
  private _journeyHub: signalR.HubConnection | null = null;
  private _trackingHub: signalR.HubConnection | null = null;
  
  private journeyCallbacks: Map<number, (data: any) => void> = new Map();
  private vehicleCallbacks: Map<number, (data: any) => void> = new Map();
  private workspaceCallbacks: ((data: any) => void)[] = [];
  private emergencyCallbacks: ((data: any) => void)[] = [];

  private connectionPromise: Promise<void> | null = null;

  // ✅ Public getters for hubs
  get journeyHub(): signalR.HubConnection | null {
    return this._journeyHub;
  }

  get trackingHub(): signalR.HubConnection | null {
    return this._trackingHub;
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.getConnectionStatus()) {
      return Promise.resolve();
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, cannot connect to SignalR');
      return Promise.reject(new Error('No authentication token'));
    }

    this.connectionPromise = this.performConnection(token);
    
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async performConnection(token: string): Promise<void> {
    await Promise.all([
      this.connectJourneyHub(token),
      this.connectTrackingHub(token)
    ]);
  }

  private async connectJourneyHub(token: string): Promise<void> {
    if (this._journeyHub?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this._journeyHub) {
      try {
        await this._journeyHub.stop();
      } catch (err) {
        // Ignore stop errors
      }
    }

    this._journeyHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/journey`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this._journeyHub.on('JourneyStatusUpdated', (journeyId: number, status: any) => {
      console.log('Journey status updated:', journeyId, status);
      const callback = this.journeyCallbacks.get(journeyId);
      if (callback) callback({ type: 'statusUpdated', journeyId, status });
    });

    this._journeyHub.on('StopCompleted', (journeyId: number, stopId: number, data: any) => {
      console.log('Stop completed:', journeyId, stopId, data);
      const callback = this.journeyCallbacks.get(journeyId);
      if (callback) callback({ type: 'stopCompleted', journeyId, stopId, data });
    });

    this._journeyHub.onreconnecting(() => {
      console.log('JourneyHub reconnecting...');
    });

    this._journeyHub.onreconnected(() => {
      console.log('JourneyHub reconnected');
      this.journeyCallbacks.forEach((_, journeyId) => {
        this._journeyHub?.invoke('JoinJourneyGroup', journeyId).catch(console.error);
      });
    });

    this._journeyHub.onclose(() => {
      console.log('JourneyHub disconnected');
    });

    try {
      await this._journeyHub.start();
      console.log('JourneyHub Connected');
    } catch (err) {
      console.error('JourneyHub Connection Error:', err);
      throw err;
    }
  }

  private async connectTrackingHub(token: string): Promise<void> {
    if (this._trackingHub?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this._trackingHub) {
      try {
        await this._trackingHub.stop();
      } catch (err) {
        // Ignore stop errors
      }
    }

    this._trackingHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/tracking`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this._trackingHub.on('VehicleLocationUpdated', (data: any) => {
      console.log('Vehicle location updated:', data);
      const callback = this.vehicleCallbacks.get(data.vehicleId);
      if (callback) callback(data);
      
      const journeyCallback = this.journeyCallbacks.get(data.journeyId);
      if (journeyCallback) journeyCallback({ type: 'locationUpdated', ...data });
    });

    this._trackingHub.on('WorkspaceVehicleUpdated', (data: any) => {
      console.log('Workspace vehicle updated:', data);
      this.workspaceCallbacks.forEach(callback => callback(data));
    });

    this._trackingHub.on('EmergencyAlert', (data: any) => {
      console.log('EMERGENCY ALERT:', data);
      this.emergencyCallbacks.forEach(callback => callback(data));
    });

    this._trackingHub.onreconnecting(() => {
      console.log('TrackingHub reconnecting...');
    });

    this._trackingHub.onreconnected(() => {
      console.log('TrackingHub reconnected');
      this.vehicleCallbacks.forEach((_, vehicleId) => {
        this._trackingHub?.invoke('JoinVehicleTracking', vehicleId).catch(console.error);
      });
    });

    this._trackingHub.onclose(() => {
      console.log('TrackingHub disconnected');
    });

    try {
      await this._trackingHub.start();
      console.log('TrackingHub Connected');
    } catch (err) {
      console.error('TrackingHub Connection Error:', err);
      throw err;
    }
  }

  // ✅ NEW: Generic event listener methods
  on(eventName: string, callback: (...args: any[]) => void): void {
    if (this._journeyHub) {
      this._journeyHub.on(eventName, callback);
    }
    if (this._trackingHub) {
      this._trackingHub.on(eventName, callback);
    }
  }

  off(eventName: string, callback: (...args: any[]) => void): void {
    if (this._journeyHub) {
      this._journeyHub.off(eventName, callback);
    }
    if (this._trackingHub) {
      this._trackingHub.off(eventName, callback);
    }
  }

  // ✅ NEW: JourneyGroup helper methods
  async joinJourneyGroup(journeyId: number): Promise<void> {
    if (!this._journeyHub || this._journeyHub.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }
    
    try {
      await this._journeyHub?.invoke('JoinJourneyGroup', journeyId);
      console.log(`Joined journey group: ${journeyId}`);
    } catch (err) {
      console.error('Error joining journey group:', err);
    }
  }

  async leaveJourneyGroup(journeyId: number): Promise<void> {
    if (!this._journeyHub || this._journeyHub.state !== signalR.HubConnectionState.Connected) {
      return;
    }
    
    try {
      await this._journeyHub.invoke('LeaveJourneyGroup', journeyId);
      console.log(`Left journey group: ${journeyId}`);
    } catch (err) {
      console.error('Error leaving journey group:', err);
    }
  }

  async joinJourney(journeyId: number, callback: (data: any) => void): Promise<void> {
    if (!this.getConnectionStatus()) {
      await this.connect();
    }

    if (!this._journeyHub || this._journeyHub.state !== signalR.HubConnectionState.Connected) {
      console.error('JourneyHub not connected');
      return;
    }
    
    this.journeyCallbacks.set(journeyId, callback);
    
    try {
      await this._journeyHub.invoke('JoinJourneyGroup', journeyId);
      console.log(`Joined journey group: ${journeyId}`);
    } catch (err) {
      console.error('Error joining journey group:', err);
      this.journeyCallbacks.delete(journeyId);
    }
  }

  async leaveJourney(journeyId: number): Promise<void> {
    if (!this._journeyHub || this._journeyHub.state !== signalR.HubConnectionState.Connected) {
      this.journeyCallbacks.delete(journeyId);
      return;
    }
    
    this.journeyCallbacks.delete(journeyId);
    
    try {
      await this._journeyHub.invoke('LeaveJourneyGroup', journeyId);
      console.log(`Left journey group: ${journeyId}`);
    } catch (err) {
      console.error('Error leaving journey group:', err);
    }
  }

  async joinVehicleTracking(vehicleId: number, callback: (data: any) => void): Promise<void> {
    if (!this.getConnectionStatus()) {
      await this.connect();
    }

    if (!this._trackingHub || this._trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return;
    }
    
    this.vehicleCallbacks.set(vehicleId, callback);
    
    try {
      await this._trackingHub.invoke('JoinVehicleTracking', vehicleId);
      console.log(`Joined vehicle tracking: ${vehicleId}`);
    } catch (err) {
      console.error('Error joining vehicle tracking:', err);
      this.vehicleCallbacks.delete(vehicleId);
    }
  }

  async leaveVehicleTracking(vehicleId: number): Promise<void> {
    if (!this._trackingHub || this._trackingHub.state !== signalR.HubConnectionState.Connected) {
      this.vehicleCallbacks.delete(vehicleId);
      return;
    }
    
    this.vehicleCallbacks.delete(vehicleId);
    
    try {
      await this._trackingHub.invoke('LeaveVehicleTracking', vehicleId);
      console.log(`Left vehicle tracking: ${vehicleId}`);
    } catch (err) {
      console.error('Error leaving vehicle tracking:', err);
    }
  }

  async joinWorkspaceTracking(workspaceId: number, callback: (data: any) => void): Promise<void> {
    if (!this.getConnectionStatus()) {
      await this.connect();
    }

    if (!this._trackingHub || this._trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return;
    }
    
    this.workspaceCallbacks.push(callback);
    
    try {
      await this._trackingHub.invoke('JoinWorkspaceTracking', workspaceId);
      console.log(`Joined workspace tracking: ${workspaceId}`);
    } catch (err) {
      console.error('Error joining workspace tracking:', err);
      this.workspaceCallbacks.pop();
    }
  }

  async leaveWorkspaceTracking(workspaceId: number): Promise<void> {
    if (!this._trackingHub || this._trackingHub.state !== signalR.HubConnectionState.Connected) {
      this.clearWorkspaceCallbacks();
      return;
    }

    try {
      await this._trackingHub.invoke('LeaveWorkspaceTracking', workspaceId);
      console.log(`Left workspace tracking: ${workspaceId}`);
    } catch (err) {
      console.error('Error leaving workspace tracking:', err);
    }
    
    this.clearWorkspaceCallbacks();
  }

  async updateVehicleLocation(location: UpdateLocationDto): Promise<void> {
    if (!this._trackingHub || this._trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return;
    }
    
    try {
      await this._trackingHub.invoke('UpdateVehicleLocation', location);
      console.log('Location updated:', location);
    } catch (err) {
      console.error('Error updating vehicle location:', err);
    }
  }

  async getActiveVehicles(): Promise<ActiveVehicleDto[]> {
    if (!this._trackingHub || this._trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return [];
    }
    
    try {
      const vehicles = await this._trackingHub.invoke<ActiveVehicleDto[]>('GetActiveVehicles');
      console.log('Active vehicles:', vehicles);
      return vehicles;
    } catch (err) {
      console.error('Error getting active vehicles:', err);
      return [];
    }
  }

  async sendEmergencyAlert(alert: EmergencyAlertDto): Promise<void> {
    if (!this._trackingHub || this._trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return;
    }
    
    try {
      await this._trackingHub.invoke('SendEmergencyAlert', alert);
      console.log('Emergency alert sent:', alert);
    } catch (err) {
      console.error('Error sending emergency alert:', err);
    }
  }

  subscribeToEmergencyAlerts(callback: (data: any) => void): void {
    this.emergencyCallbacks.push(callback);
  }

  unsubscribeFromEmergencyAlerts(callback: (data: any) => void): void {
    const index = this.emergencyCallbacks.indexOf(callback);
    if (index > -1) {
      this.emergencyCallbacks.splice(index, 1);
    }
  }

  clearWorkspaceCallbacks(): void {
    this.workspaceCallbacks = [];
  }

  getConnectionStatus(): boolean {
    return this._journeyHub?.state === signalR.HubConnectionState.Connected &&
           this._trackingHub?.state === signalR.HubConnectionState.Connected;
  }

  isConnecting(): boolean {
    return this.connectionPromise !== null ||
           this._journeyHub?.state === signalR.HubConnectionState.Connecting ||
           this._trackingHub?.state === signalR.HubConnectionState.Connecting;
  }

  async disconnect(): Promise<void> {
    const disconnectPromises = [];

    // BUGFIX: Remove event handlers before disconnecting to prevent memory leaks
    if (this._journeyHub) {
      try {
        this._journeyHub.off('JourneyStatusUpdated');
        this._journeyHub.off('StopCompleted');
      } catch (err) {
        console.warn('Error removing JourneyHub event handlers:', err);
      }
      disconnectPromises.push(this._journeyHub.stop());
    }

    if (this._trackingHub) {
      try {
        this._trackingHub.off('VehicleLocationUpdated');
        this._trackingHub.off('WorkspaceVehicleUpdated');
        this._trackingHub.off('EmergencyAlert');
      } catch (err) {
        console.warn('Error removing TrackingHub event handlers:', err);
      }
      disconnectPromises.push(this._trackingHub.stop());
    }

    await Promise.all(disconnectPromises);

    this.journeyCallbacks.clear();
    this.vehicleCallbacks.clear();
    this.workspaceCallbacks = [];
    this.emergencyCallbacks = [];

    console.log('SignalR disconnected and cleaned up');
  }

  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }
}

export default new SignalRService();