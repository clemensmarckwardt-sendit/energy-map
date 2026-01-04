import { useEffect } from 'react';
import { MapContainer } from './components/Map/MapContainer';
import { Sidebar } from './components/Sidebar/Sidebar';
import { useVNBIndex } from './hooks/useVNBData';
import './App.css';

function App() {
  // Initialize VNB index on mount
  useVNBIndex();

  // Handle zoom to VNB events from search
  useEffect(() => {
    const handleZoomToVNB = (e: CustomEvent) => {
      const { bbox } = e.detail;
      if (bbox) {
        // Will be handled by map component
        console.log('Zoom to bbox:', bbox);
      }
    };

    window.addEventListener('zoomToVNB', handleZoomToVNB as EventListener);
    return () => {
      window.removeEventListener('zoomToVNB', handleZoomToVNB as EventListener);
    };
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <MapContainer />
      </main>
    </div>
  );
}

export default App;
