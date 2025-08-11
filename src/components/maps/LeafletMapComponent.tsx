import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Home } from 'lucide-react';
import { Customer } from '@/types';

interface LeafletMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  customers?: Customer[];
  depot?: { lat: number; lng: number };
  stops?: Array<{
    customer: Customer;
    order: number;
  }>;
}

const LeafletMapComponent: React.FC<LeafletMapProps> = ({
  center = { lat: 40.9869, lng: 29.0252 },
  zoom = 11,
  height = '400px',
  customers = [],
  depot,
  stops = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) {
          resolve(window.L);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        document.body.appendChild(script);
      });
    };

    // Initialize map
    loadLeaflet().then((L: any) => {
      if (!mapContainer.current || mapInstance.current) return;

      // Create map
      const map = L.map(mapContainer.current).setView([center.lat, center.lng], zoom);
      mapInstance.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add depot marker
      if (depot) {
        const depotIcon = L.divIcon({
          html: `
            <div style="
              background: #3B82F6;
              color: white;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              DEPO
            </div>
          `,
          iconSize: [40, 40],
          className: 'depot-marker'
        });

        const marker = L.marker([depot.lat, depot.lng], { icon: depotIcon })
          .bindPopup('<b>Ana Depo</b><br>Başlangıç ve Bitiş Noktası')
          .addTo(map);
        markersRef.current.push(marker);
      }

      // Add stop markers
      if (stops.length > 0) {
        const bounds = L.latLngBounds([]);
        
        if (depot) {
          bounds.extend([depot.lat, depot.lng]);
        }

        stops.forEach((stop, index) => {
          const customerIcon = L.divIcon({
            html: `
              <div style="
                background: #10B981;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                ${stop.order}
              </div>
            `,
            iconSize: [32, 32],
            className: 'customer-marker'
          });

          const marker = L.marker(
            [stop.customer.latitude, stop.customer.longitude],
            { icon: customerIcon }
          )
            .bindPopup(`
              <div style="min-width: 200px;">
                <b>${stop.customer.name}</b><br>
                <small>${stop.customer.address}</small><br>
                <small>📞 ${stop.customer.phone || 'Tel yok'}</small><br>
                <small>🕐 ${stop.customer.timeWindow?.start || '09:00'} - ${stop.customer.timeWindow?.end || '17:00'}</small>
              </div>
            `)
            .addTo(map);
          
          markersRef.current.push(marker);
          bounds.extend([stop.customer.latitude, stop.customer.longitude]);
        });

        // Draw route lines (simple connection, not optimized)
        if (depot && stops.length > 0) {
          const routeCoordinates = [];
          
          // From depot to first stop
          routeCoordinates.push([depot.lat, depot.lng]);
          
          // Through all stops
          stops.forEach(stop => {
            routeCoordinates.push([stop.customer.latitude, stop.customer.longitude]);
          });
          
          // Back to depot
          routeCoordinates.push([depot.lat, depot.lng]);

          // Draw polyline
          const polyline = L.polyline(routeCoordinates, {
            color: '#3B82F6',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
          }).addTo(map);

          markersRef.current.push(polyline);
        }

        // Fit map to bounds
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }

      // Add customers without order (if any)
      customers.forEach(customer => {
        if (!stops.find(s => s.customer.id === customer.id)) {
          const customerIcon = L.divIcon({
            html: `
              <div style="
                background: #9CA3AF;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              ">
                📍
              </div>
            `,
            iconSize: [28, 28],
            className: 'inactive-customer-marker'
          });

          const marker = L.marker(
            [customer.latitude, customer.longitude],
            { icon: customerIcon }
          )
            .bindPopup(`
              <div style="min-width: 200px;">
                <b>${customer.name}</b><br>
                <small>${customer.address}</small><br>
                <small style="color: #666;">Rotaya dahil değil</small>
              </div>
            `)
            .addTo(map);
          
          markersRef.current.push(marker);
        }
      });
    });

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [center, zoom, customers, depot, stops]);

  return (
    <div className="relative">
      <div 
        ref={mapContainer}
        className="w-full rounded-lg"
        style={{ height }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Depo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Rotadaki Durak</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span>Diğer Müşteriler</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs space-y-1">
          <div className="font-semibold text-gray-700">Harita: OpenStreetMap</div>
          <div className="text-gray-500">Ücretsiz, açık kaynak</div>
        </div>
      </div>
    </div>
  );
};

// Window type extension for Leaflet
declare global {
  interface Window {
    L: any;
  }
}

export default LeafletMapComponent;