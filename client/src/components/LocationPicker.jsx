import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { pinIcon } from './ListingMap.jsx';
import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../config/map.js';

// Places the pin at the clicked point.
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Pans the map when the coordinates change from outside (e.g. address search).
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 13));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);
  return null;
}

// Small map used in the listing form to set coordinates by clicking or dragging.
export default function LocationPicker({ lat, lng, onChange }) {
  const hasPoint =
    lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const position = hasPoint ? [Number(lat), Number(lng)] : null;

  return (
    <div className="map-picker">
      <MapContainer
        center={position || DEFAULT_CENTER}
        zoom={position ? 14 : DEFAULT_ZOOM}
        scrollWheelZoom
        className="map map-picker-map"
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <ClickHandler onPick={(la, ln) => onChange(la, ln)} />
        <Recenter position={position} />
        {position && (
          <Marker
            position={position}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                onChange(p.lat, p.lng);
              },
            }}
          />
        )}
      </MapContainer>
      <p className="muted small">Click the map to place the pin, or drag it to adjust.</p>
    </div>
  );
}
