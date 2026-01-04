import { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { AdminLayer } from './AdminLayer';
import { VNBLayer } from './VNBLayer';
import { AnlagenLayer } from './AnlagenLayer';
import { MapEvents } from './MapEvents';
import { GERMANY_CENTER, GERMANY_BOUNDS } from '../../utils/geoUtils';
import 'leaflet/dist/leaflet.css';

// Component to create custom pane for Anlagen markers
function AnlagenPane() {
  const map = useMap();

  useEffect(() => {
    // Create custom pane with z-index above overlayPane (400) and shadowPane (500)
    if (!map.getPane('anlagenPane')) {
      const pane = map.createPane('anlagenPane');
      pane.style.zIndex = '650'; // Above markerPane (600)
    }
  }, [map]);

  return null;
}

export function MapContainer() {
  return (
    <div className="map-wrapper">
      <LeafletMapContainer
        center={GERMANY_CENTER}
        zoom={6}
        minZoom={5}
        maxZoom={18}
        maxBounds={GERMANY_BOUNDS}
        zoomControl={false}
        className="map-container"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        <AnlagenPane />

        <AdminLayer type="bundeslaender" />
        <AdminLayer type="kreise" />
        <AdminLayer type="gemeinden" />
        <VNBLayer />
        <AnlagenLayer type="solar" />
        <AnlagenLayer type="bess" />

        <ZoomControl position="bottomright" />
        <MapEvents />
      </LeafletMapContainer>
    </div>
  );
}
