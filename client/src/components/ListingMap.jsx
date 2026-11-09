import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { formatPrice } from './ListingCard.jsx';
import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../config/map.js';

// A lightweight HTML pin avoids Leaflet's bundled marker image asset problem.
export const pinIcon = L.divIcon({
  className: 'map-pin',
  html: '<span class="map-pin-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

// Dark-themed cluster bubble showing how many listings it contains.
const clusterIcon = (cluster) =>
  L.divIcon({
    className: 'map-cluster',
    html: `<span>${cluster.getChildCount()}</span>`,
    iconSize: [40, 40],
  });

// Reports the visible bounds whenever the user stops panning or zooming.
function BoundsWatcher({ onChange }) {
  const map = useMap();
  useEffect(() => {
    const emit = () => {
      const b = map.getBounds();
      onChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };
    map.on('moveend', emit);
    return () => map.off('moveend', emit);
  }, [map, onChange]);
  return null;
}

// Fits the map to the markers when the search changes (fitKey changes), but not
// when the user simply pans around — otherwise it would fight the user.
function FitToMarkers({ points, fitKey }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  return null;
}

export default function ListingMap({ listings = [], onBoundsChange, fitKey = 0 }) {
  const points = useMemo(
    () =>
      listings
        .filter((l) => Array.isArray(l.location?.coordinates) && l.location.coordinates.length === 2)
        .map((l) => ({
          id: l._id,
          lat: l.location.coordinates[1],
          lng: l.location.coordinates[0],
          listing: l,
        })),
    [listings]
  );

  const center = points.length ? [points[0].lat, points[0].lng] : DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={DEFAULT_ZOOM} scrollWheelZoom className="map">
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      {onBoundsChange && <BoundsWatcher onChange={onBoundsChange} />}
      <FitToMarkers points={points} fitKey={fitKey} />
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={55}
        iconCreateFunction={clusterIcon}
      >
        {points.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]} icon={pinIcon}>
            <Popup>
              <div className="map-popup">
                <strong>{point.listing.title}</strong>
                <span className="map-popup-price">{formatPrice(point.listing)}</span>
                <Link to={`/listings/${point.id}`}>View listing</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
