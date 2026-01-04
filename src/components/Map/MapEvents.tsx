import { useMapEvents } from 'react-leaflet';
import { useStore } from '../../store';

export function MapEvents() {
  const { setViewport } = useStore();

  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      const bounds = map.getBounds();

      setViewport({
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
        bounds: [
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()]
        ]
      });
    },
    zoomend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      const bounds = map.getBounds();

      setViewport({
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
        bounds: [
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()]
        ]
      });
    }
  });

  return null;
}
