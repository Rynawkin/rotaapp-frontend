// frontend/src/hooks/useSignalR.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import signalRService, { UpdateLocationDto, EmergencyAlertDto } from '../services/signalr.service';

interface UseSignalROptions {
  autoConnect?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export const useSignalR = (options: UseSignalROptions = {}) => {
  const { autoConnect = true, onConnected, onDisconnected, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);
  const connectionRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const handleConnectionChange = () => {
      if (mountedRef.current) {
        const status = signalRService.getConnectionStatus();
        setIsConnected(status);
      }
    };

    // Set up interval to check connection status
    const interval = setInterval(handleConnectionChange, 1000);

    if (autoConnect && !connectionRef.current) {
      connectionRef.current = connect();
    }

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      // BUGFIX: Always disconnect to prevent memory leaks, even in development
      // React.StrictMode will remount and reconnect if needed
      disconnect();
    };
  }, []); // Empty dependency array - only run once

  const connect = async () => {
    try {
      await signalRService.connect();
      if (mountedRef.current) {
        setIsConnected(true);
        onConnected?.();
      }
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      if (mountedRef.current) {
        setIsConnected(false);
        onError?.(error);
      }
    } finally {
      connectionRef.current = null;
    }
  };

  const disconnect = async () => {
    try {
      await signalRService.disconnect();
      if (mountedRef.current) {
        setIsConnected(false);
        onDisconnected?.();
      }
    } catch (error) {
      console.error('Failed to disconnect from SignalR:', error);
      onError?.(error);
    }
  };

  const reconnect = async () => {
    await signalRService.reconnect();
    if (mountedRef.current) {
      setIsConnected(signalRService.getConnectionStatus());
    }
  };

  return {
    connect,
    disconnect,
    reconnect,
    isConnected,
    service: signalRService
  };
};

// Hook for journey tracking
export const useJourneyTracking = (journeyId: number | null) => {
  const callbackRef = useRef<(data: any) => void>();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!journeyId) return;

    const join = async () => {
      // Wait for connection to be established
      let retries = 0;
      while (!signalRService.getConnectionStatus() && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (signalRService.getConnectionStatus() && callbackRef.current && !joinedRef.current) {
        await signalRService.joinJourney(journeyId, callbackRef.current);
        joinedRef.current = true;
      }
    };

    join();

    return () => {
      if (joinedRef.current) {
        signalRService.leaveJourney(journeyId);
        joinedRef.current = false;
      }
    };
  }, [journeyId]);

  const subscribeToUpdates = useCallback((callback: (data: any) => void) => {
    callbackRef.current = callback;
    if (journeyId && signalRService.getConnectionStatus() && !joinedRef.current) {
      signalRService.joinJourney(journeyId, callback);
      joinedRef.current = true;
    }
  }, [journeyId]);

  return {
    subscribeToUpdates
  };
};

// Hook for vehicle tracking
export const useVehicleTracking = (vehicleId: number | null) => {
  const callbackRef = useRef<(data: any) => void>();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!vehicleId) return;

    const join = async () => {
      // Wait for connection to be established
      let retries = 0;
      while (!signalRService.getConnectionStatus() && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (signalRService.getConnectionStatus() && callbackRef.current && !joinedRef.current) {
        await signalRService.joinVehicleTracking(vehicleId, callbackRef.current);
        joinedRef.current = true;
      }
    };

    join();

    return () => {
      if (joinedRef.current) {
        signalRService.leaveVehicleTracking(vehicleId);
        joinedRef.current = false;
      }
    };
  }, [vehicleId]);

  const subscribeToUpdates = useCallback((callback: (data: any) => void) => {
    callbackRef.current = callback;
    if (vehicleId && signalRService.getConnectionStatus() && !joinedRef.current) {
      signalRService.joinVehicleTracking(vehicleId, callback);
      joinedRef.current = true;
    }
  }, [vehicleId]);

  const updateLocation = useCallback(async (location: Omit<UpdateLocationDto, 'journeyId'>) => {
    // journeyId will be added by the component that knows it
    console.log('Vehicle location update:', location);
  }, []);

  return {
    subscribeToUpdates,
    updateLocation
  };
};

// Hook for workspace tracking (admin dashboard)
export const useWorkspaceTracking = (workspaceId: number | null) => {
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!workspaceId) return;

    const join = async () => {
      // Wait for connection to be established
      let retries = 0;
      while (!signalRService.getConnectionStatus() && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (signalRService.getConnectionStatus() && !joinedRef.current) {
        const callback = (data: any) => {
          console.log('Workspace vehicle update:', data);
        };
        signalRService.joinWorkspaceTracking(workspaceId, callback);
        joinedRef.current = true;
      }
    };

    join();

    return () => {
      if (joinedRef.current) {
        signalRService.clearWorkspaceCallbacks();
        joinedRef.current = false;
      }
    };
  }, [workspaceId]);

  const getActiveVehicles = useCallback(async () => {
    return await signalRService.getActiveVehicles();
  }, []);

  const subscribeToUpdates = useCallback((callback: (data: any) => void) => {
    if (workspaceId && signalRService.getConnectionStatus()) {
      signalRService.joinWorkspaceTracking(workspaceId, callback);
    }
  }, [workspaceId]);

  return {
    getActiveVehicles,
    subscribeToUpdates
  };
};

// Hook for emergency alerts
export const useEmergencyAlerts = () => {
  useEffect(() => {
    const handleEmergency = (data: any) => {
      console.error('EMERGENCY ALERT RECEIVED:', data);
      // Show notification to user
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Emergency Alert!', {
          body: `${data.message} - Vehicle: ${data.vehicleId}`,
          icon: '/emergency-icon.png',
          requireInteraction: true
        });
      }
    };

    signalRService.subscribeToEmergencyAlerts(handleEmergency);

    return () => {
      signalRService.unsubscribeFromEmergencyAlerts(handleEmergency);
    };
  }, []);

  const sendEmergencyAlert = useCallback(async (alert: EmergencyAlertDto) => {
    await signalRService.sendEmergencyAlert(alert);
  }, []);

  return {
    sendEmergencyAlert
  };
};