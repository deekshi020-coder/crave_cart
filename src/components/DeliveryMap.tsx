import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, MapPin, Clock, Bike, Utensils, AlertTriangle } from 'lucide-react';

interface DeliveryMapProps {
  restaurantCoords?: { lat: number; lng: number; name?: string };
  customerCoords?: { lat: number; lng: number; address?: string };
  riderCoords?: { lat: number; lng: number; name?: string };
  orderStatus?: string;
  className?: string;
}

// Default Chennai coordinates if not passed
const DEFAULT_CHENNAI_REST = { lat: 13.0850, lng: 80.2101, name: 'Biryani Darbar (Anna Nagar)' };
const DEFAULT_CHENNAI_CUST = { lat: 13.0450, lng: 80.2380, address: 'T. Nagar, Chennai' };

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  restaurantCoords = DEFAULT_CHENNAI_REST,
  customerCoords = DEFAULT_CHENNAI_CUST,
  riderCoords,
  orderStatus = 'Out for Delivery',
  className = 'h-72 w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMins: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const restLat = restaurantCoords?.lat || DEFAULT_CHENNAI_REST.lat;
  const restLng = restaurantCoords?.lng || DEFAULT_CHENNAI_REST.lng;
  const custLat = customerCoords?.lat || DEFAULT_CHENNAI_CUST.lat;
  const custLng = customerCoords?.lng || DEFAULT_CHENNAI_CUST.lng;

  // Haversine distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [(restLat + custLat) / 2, (restLng + custLng) / 2],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Custom Icon Generators
      const restaurantIcon = L.divIcon({
        className: 'custom-rest-marker',
        html: `<div style="background-color: #e11d48; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 2px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const customerIcon = L.divIcon({
        className: 'custom-cust-marker',
        html: `<div style="background-color: #059669; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 2px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const riderIcon = L.divIcon({
        className: 'custom-rider-marker',
        html: `<div style="background-color: #2563eb; color: white; border-radius: 9999px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4); border: 2.5px solid white;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
        </div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      // Place Markers
      const restMarker = L.marker([restLat, restLng], { icon: restaurantIcon }).addTo(map);
      restMarker.bindPopup(`<b>${restaurantCoords?.name || 'Restaurant Pickup'}</b><br/>Kitchen Dispatch`);

      const custMarker = L.marker([custLat, custLng], { icon: customerIcon }).addTo(map);
      custMarker.bindPopup(`<b>Customer Destination</b><br/>${customerCoords?.address || 'Chennai'}`);

      // Rider Position (interpolated halfway or using riderCoords)
      const riderLat = riderCoords?.lat || (restLat + (custLat - restLat) * 0.55);
      const riderLng = riderCoords?.lng || (restLng + (custLng - restLng) * 0.55);

      if (orderStatus === 'Out for Delivery' || orderStatus === 'Ready for Pickup') {
        const rMarker = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);
        rMarker.bindPopup(`<b>${riderCoords?.name || 'Vikram (Delivery Partner)'}</b><br/>En Route`);
      }

      // Route polyline with slight realistic curvature
      const midLat = (restLat + custLat) / 2 + 0.005;
      const midLng = (restLng + custLng) / 2 - 0.005;
      const polylineCoords: [number, number][] = [
        [restLat, restLng],
        [midLat, midLng],
        [custLat, custLng],
      ];

      const routeLine = L.polyline(polylineCoords, {
        color: '#e11d48',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);

      // Fit map bounds to encompass both points with padding
      const bounds = L.latLngBounds([[restLat, restLng], [custLat, custLng]]);
      map.fitBounds(bounds, { padding: [50, 50] });

      // Compute Distance and estimated travel duration (assuming average 22 km/h Chennai city speed)
      const dist = calculateDistance(restLat, restLng, custLat, custLng);
      const duration = Math.max(10, Math.round((dist / 22) * 60) + 5);
      setRouteInfo({ distanceKm: dist, durationMins: duration });

      mapInstanceRef.current = map;
    } catch (err: any) {
      console.warn('Leaflet map initialization warning:', err.message);
      setMapError('Unable to load interactive map tiles.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [restLat, restLng, custLat, custLng, orderStatus]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs">
      {/* Route Badge Overlay */}
      {routeInfo && !mapError && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-stone-200/80 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-stone-900 font-bold">
            <Navigation className="w-3.5 h-3.5 text-rose-600" />
            <span>{routeInfo.distanceKm} km</span>
          </div>
          <span className="text-stone-300">·</span>
          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Est. {routeInfo.durationMins} mins</span>
          </div>
          {orderStatus === 'Out for Delivery' && (
            <>
              <span className="text-stone-300">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Tracking
              </span>
            </>
          )}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className={className} />

      {/* Fallback if map fails */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-stone-50 text-stone-500 text-xs gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <span>{mapError}</span>
          <p className="text-[11px] text-stone-400">
            Route: {restaurantCoords?.name} → {customerCoords?.address}
          </p>
        </div>
      )}
    </div>
  );
};
