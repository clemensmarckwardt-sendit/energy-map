import { useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Zap } from 'lucide-react';
import Fuse from 'fuse.js';
import { useStore } from '../../store';
import { useVNBIndex, useLoadVNBGeometry } from '../../hooks/useVNBData';
import type { VNBIndexEntry } from '../../types';

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const { vnbIndex } = useVNBIndex();
  const { setFilters, setSelectedVNB } = useStore();
  const { loadVNB } = useLoadVNBGeometry();

  // Fuzzy search setup
  const fuse = useMemo(() => {
    if (!vnbIndex) return null;
    return new Fuse(vnbIndex.vnbs, {
      keys: ['vnbName', 'vnbId'],
      threshold: 0.3,
      includeScore: true
    });
  }, [vnbIndex]);

  // Search results
  const results = useMemo(() => {
    if (!fuse || query.length < 2) return [];
    return fuse.search(query).slice(0, 20).map(r => r.item);
  }, [fuse, query]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setFilters({ searchQuery: value });
  }, [setFilters]);

  const handleSelect = useCallback(async (vnb: VNBIndexEntry) => {
    setSelectedVNB(vnb.id);

    // Load and zoom to VNB
    await loadVNB(vnb.fileName, vnb.id);

    // Trigger zoom via custom event (will be handled by map)
    window.dispatchEvent(new CustomEvent('zoomToVNB', {
      detail: { bbox: vnb.bbox, id: vnb.id }
    }));
  }, [setSelectedVNB, loadVNB]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setFilters({ searchQuery: '' });
  }, [setFilters]);

  return (
    <div className="search-panel">
      <h3>VNB Suchen</h3>

      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Name oder ID eingeben..."
          value={query}
          onChange={handleSearch}
          className="search-input"
        />
        {query && (
          <button className="clear-button" onClick={clearSearch}>
            &times;
          </button>
        )}
      </div>

      {vnbIndex && (
        <p className="search-info">
          {query.length < 2
            ? `${vnbIndex.totalCount} VNBs verfügbar`
            : `${results.length} Ergebnisse`}
        </p>
      )}

      <ul className="search-results">
        {results.map(vnb => (
          <li key={vnb.id}>
            <button
              className="search-result-item"
              onClick={() => handleSelect(vnb)}
            >
              <div className="result-icon">
                <Zap size={16} />
              </div>
              <div className="result-info">
                <span className="result-name">{vnb.vnbName}</span>
                <span className="result-meta">
                  <MapPin size={12} />
                  ID: {vnb.vnbId}
                  {vnb.voltageTypes.length > 0 && (
                    <> • {vnb.voltageTypes.join(', ')}</>
                  )}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {query.length >= 2 && results.length === 0 && (
        <p className="no-results">Keine VNBs gefunden</p>
      )}
    </div>
  );
}
