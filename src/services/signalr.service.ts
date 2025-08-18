// frontend/src/services/signalr.service.ts
import * as signalR from '@microsoft/signalr';

// SignalR DTO Types
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
  private journeyHub: signalR.HubConnection | null = null;
  private trackingHub: signalR.HubConnection | null = null;
  
  // Callback maps for different events
  private journeyCallbacks: Map<number, (data: any) => void> = new Map();
  private vehicleCallbacks: Map<number, (data: any) => void> = new Map();
  private workspaceCallbacks: ((data: any) => void)[] = [];
  private emergencyCallbacks: ((data: any) => void)[] = [];

  // Connection promise to prevent multiple simultaneous connections
  private connectionPromise: Promise<void> | null = null;

  // Connect to both hubs
  async connect(): Promise<void> {
    // If already connecting, wait for that connection
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return immediately
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

  // Connect to JourneyHub
  private async connectJourneyHub(token: string): Promise<void> {
    // If already connected, skip
    if (this.journeyHub?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    // If hub exists but not connected, stop it first
    if (this.journeyHub) {
      try {
        await this.journeyHub.stop();
      } catch (err) {
        // Ignore stop errors
      }
    }

    this.journeyHub = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5055/hubs/journey', {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // JourneyHub event listeners
    this.journeyHub.on('JourneyStatusUpdated', (journeyId: number, status: any) => {
      console.log('Journey status updated:', journeyId, status);
      const callback = this.journeyCallbacks.get(journeyId);
      if (callback) callback({ type: 'statusUpdated', journeyId, status });
    });

    this.journeyHub.on('StopCompleted', (journeyId: number, stopId: number, data: any) => {
      console.log('Stop completed:', journeyId, stopId, data);
      const callback = this.journeyCallbacks.get(journeyId);
      if (callback) callback({ type: 'stopCompleted', journeyId, stopId, data });
    });

    // Connection state handlers
    this.journeyHub.onreconnecting(() => {
      console.log('JourneyHub reconnecting...');
    });

    this.journeyHub.onreconnected(() => {
      console.log('JourneyHub reconnected');
      // Rejoin all journey groups
      this.journeyCallbacks.forEach((_, journeyId) => {
        this.journeyHub?.invoke('JoinJourneyGroup', journeyId).catch(console.error);
      });
    });

    this.journeyHub.onclose(() => {
      console.log('JourneyHub disconnected');
    });

    try {
      await this.journeyHub.start();
      console.log('JourneyHub Connected');
    } catch (err) {
      console.error('JourneyHub Connection Error:', err);
      throw err;
    }
  }

  // Connect to TrackingHub
  private async connectTrackingHub(token: string): Promise<void> {
    // If already connected, skip
    if (this.trackingHub?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    // If hub exists but not connected, stop it first
    if (this.trackingHub) {
      try {
        await this.trackingHub.stop();
      } catch (err) {
        // Ignore stop errors
      }
    }

    this.trackingHub = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5055/hubs/tracking', {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // TrackingHub event listeners
    this.trackingHub.on('VehicleLocationUpdated', (data: any) => {
      console.log('Vehicle location updated:', data);
      const callback = this.vehicleCallbacks.get(data.vehicleId);
      if (callback) callback(data);
      
      // Also notify journey callbacks
      const journeyCallback = this.journeyCallbacks.get(data.journeyId);
      if (journeyCallback) journeyCallback({ type: 'locationUpdated', ...data });
    });

    this.trackingHub.on('WorkspaceVehicleUpdated', (data: any) => {
      console.log('Workspace vehicle updated:', data);
      this.workspaceCallbacks.forEach(callback => callback(data));
    });

    this.trackingHub.on('EmergencyAlert', (data: any) => {
      console.log('EMERGENCY ALERT:', data);
      this.emergencyCallbacks.forEach(callback => callback(data));
    });

    // Connection state handlers
    this.trackingHub.onreconnecting(() => {
      console.log('TrackingHub reconnecting...');
    });

    this.trackingHub.onreconnected(() => {
      console.log('TrackingHub reconnected');
      // Rejoin all tracking groups
      this.vehicleCallbacks.forEach((_, vehicleId) => {
        this.trackingHub?.invoke('JoinVehicleTracking', vehicleId).catch(console.error);
      });
    });

    this.trackingHub.onclose(() => {
      console.log('TrackingHub disconnected');
    });

    try {
      await this.trackingHub.start();
      console.log('TrackingHub Connected');
    } catch (err) {
      console.error('TrackingHub Connection Error:', err);
      throw err;
    }
  }

  // Journey methods
  async joinJourney(journeyId: number, callback: (data: any) => void): Promise<void> {
    // Wait for connection if not connected
    if (!this.getConnectionStatus()) {
      await this.connect();
    }

    if (!this.journeyHub || this.journeyHub.state !== signalR.HubConnectionState.Connected) {
      console.error('JourneyHub not connected');
      return;
    }
    
    this.journeyCallbacks.set(journeyId, callback);
    
    try {
      await this.journeyHub.invoke('JoinJourneyGroup', journeyId);
      console.log(`Joined journey group: ${journeyId}`);
    } catch (err) {
      console.error('Error joining journey group:', err);
      this.journeyCallbacks.delete(journeyId);
    }
  }

  async leaveJourney(journeyId: number): Promise<void> {
    if (!this.journeyHub || this.journeyHub.state !== signalR.HubConnectionState.Connected) {
      this.journeyCallbacks.delete(journeyId);
      return;
    }
    
    this.journeyCallbacks.delete(journeyId);
    
    try {
      await this.journeyHub.invoke('LeaveJourneyGroup', journeyId);
      console.log(`Left journey group: ${journeyId}`);
    } catch (err) {
      console.error('Error leaving journey group:', err);
    }
  }

  // Vehicle tracking methods
  async joinVehicleTracking(vehicleId: number, callback: (data: any) => void): Promise<void> {
    // Wait for connection if not connected
    if (!this.getConnectionStatus()) {
      await this.connect();
    }

    if (!this.trackingHub || this.trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return;
    }
    
    this.vehicleCallbacks.set(vehicleId, callback);
    
    try {
      await this.trackingHub.invoke('JoinVehicleTracking', vehicleId);
      console.log(`Joined vehicle tracking: ${vehicleId}`);
    } catch (err) {
      console.error('Error joining vehicle tracking:', err);
      this.vehicleCallbacks.delete(vehicleId);
    }
  }

  async leaveVehicleTracking(vehicleId: number): Promise<void> {
    if (!this.trackingHub || this.trackingHub.state !== signalR.HubConnectionState.Connected) {
      this.vehicleCallbacks.delete(vehicleId);
      return;
    }
    
    this.vehicleCallbacks.delete(vehicleId);
    
    try {
      await this.trackingHub.invoke('LeaveVehicleTracking', vehicleId);
      console.log(`Left vehicle tracking: ${vehicleId}`);
    } catch (err) {
      console.error('Error leaving vehicle tracking:', err);
    }
  }

  // Workspace tracking
  async joinWorkspaceTracking(workspaceId: number, callback: (data: any) => void): Promise<void> {
    // Wait for connection if not connected
    if (!this.getConnectionStatus()) {
      await this.connect();
    }

    if (!this.trackingHub || this.trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return;
    }
    
    this.workspaceCallbacks.push(callback);
    
    try {
      await this.trackingHub.invoke('JoinWorkspaceTracking', workspaceId);
      console.log(`Joined workspace tracking: ${workspaceId}`);
    } catch (err) {
      console.error('Error joining workspace tracking:', err);
      this.workspaceCallbacks.pop();
    }
  }

  async leaveWorkspaceTracking(workspaceId: number): Promise<void> {
    if (!this.trackingHub || this.trackingHub.state !== signalR.HubConnectionState.Connected) {
      this.clearWorkspaceCallbacks();
      return;
    }

    try {
      await this.trackingHub.invoke('LeaveWorkspaceTracking', workspaceId);
      console.log(`Left workspace tracking: ${workspaceId}`);
    } catch (err) {
      console.error('Error leaving workspace tracking:', err);
    }
    
    this.clearWorkspaceCallbacks();
  }

  // Update vehicle location (for driver apps)
  async updateVehicleLocation(location: UpdateLocationDto): Promise<void> {
    if (!this.trackingHub || this.trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return;
    }
    
    try {
      await this.trackingHub.invoke('UpdateVehicleLocation', location);
      console.log('Location updated:', location);
    } catch (err) {
      console.error('Error updating vehicle location:', err);
    }
  }

  // Get active vehicles
  async getActiveVehicles(): Promise<ActiveVehicleDto[]> {
    if (!this.trackingHub || this.trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return [];
    }
    
    try {
      const vehicles = await this.trackingHub.invoke<ActiveVehicleDto[]>('GetActiveVehicles');
      console.log('Active vehicles:', vehicles);
      return vehicles;
    } catch (err) {
      console.error('Error getting active vehicles:', err);
      return [];
    }
  }

  // Send emergency alert
  async sendEmergencyAlert(alert: EmergencyAlertDto): Promise<void> {
    if (!this.trackingHub || this.trackingHub.state !== signalR.HubConnectionState.Connected) {
      console.error('TrackingHub not connected');
      return;
    }
    
    try {
      await this.trackingHub.invoke('SendEmergencyAlert', alert);
      console.log('Emergency alert sent:', alert);
    } catch (err) {
      console.error('Error sending emergency alert:', err);
    }
  }

  // Subscribe to emergency alerts
  subscribeToEmergencyAlerts(callback: (data: any) => void): void {
    this.emergencyCallbacks.push(callback);
  }

  // Unsubscribe from emergency alerts
  unsubscribeFromEmergencyAlerts(callback: (data: any) => void): void {
    const index = this.emergencyCallbacks.indexOf(callback);
    if (index > -1) {
      this.emergencyCallbacks.splice(index, 1);
    }
  }

  // Clear workspace callbacks
  clearWorkspaceCallbacks(): void {
    this.workspaceCallbacks = [];
  }

  // Connection status - check both hubs
  getConnectionStatus(): boolean {
    return this.journeyHub?.state === signalR.HubConnectionState.Connected &&
           this.trackingHub?.state === signalR.HubConnectionState.Connected;
  }

  // Check if connecting
  isConnecting(): boolean {
    return this.connectionPromise !== null ||
           this.journeyHub?.state === signalR.HubConnectionState.Connecting ||
           this.trackingHub?.state === signalR.HubConnectionState.Connecting;
  }

  // Disconnect from all hubs
  async disconnect(): Promise<void> {
    const disconnectPromises = [];

    if (this.journeyHub) {
      disconnectPromises.push(this.journeyHub.stop());
    }

    if (this.trackingHub) {
      disconnectPromises.push(this.trackingHub.stop());
    }

    await Promise.all(disconnectPromises);
    
    this.journeyCallbacks.clear();
    this.vehicleCallbacks.clear();
    this.workspaceCallbacks = [];
    this.emergencyCallbacks = [];
    
    console.log('SignalR disconnected');
  }

  // Reconnect to all hubs
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }
}

export default new SignalRService();