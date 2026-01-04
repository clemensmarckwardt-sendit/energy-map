import { useEffect, useMemo } from 'react';
import { useStore } from '../store';
import type { VNBIndex, VNBIndexEntry } from '../types';

const BASE = import.meta.env.BASE_URL;

export function useVNBIndex() {
  const { vnbIndex, setVnbIndex, setLoading } = useStore();

  useEffect(() => {
    if (vnbIndex) return;

    async function loadIndex() {
      setLoading('vnbIndex', true);
      try {
        const response = await fetch(`${BASE}data/vnb/index.json`);
        const data: VNBIndex = await response.json();
        setVnbIndex(data);
      } catch (error) {
        console.error('Failed to load VNB index:', error);
      } finally {
        setLoading('vnbIndex', false);
      }
    }

    loadIndex();
  }, [vnbIndex, setVnbIndex, setLoading]);

  return { vnbIndex, isLoading: !vnbIndex };
}

export function useFilteredVNBs(): VNBIndexEntry[] {
  const { vnbIndex, filters } = useStore();

  return useMemo(() => {
    if (!vnbIndex) return [];

    let result = vnbIndex.vnbs;

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(vnb =>
        vnb.vnbName.toLowerCase().includes(query) ||
        vnb.vnbId.toLowerCase().includes(query)
      );
    }

    // Filter by voltage type
    if (filters.voltageTypes.length > 0) {
      result = result.filter(vnb =>
        filters.voltageTypes.some(vt => vnb.voltageTypes.includes(vt))
      );
    }

    return result;
  }, [vnbIndex, filters.searchQuery, filters.voltageTypes]);
}

export function useVNBStats() {
  const { vnbIndex } = useStore();

  return useMemo(() => {
    if (!vnbIndex) {
      return {
        totalCount: 0,
        totalArea: 0,
        byVoltageType: [] as { type: string; count: number }[],
        areaDistribution: [] as { range: string; count: number }[]
      };
    }

    const totalArea = vnbIndex.vnbs.reduce((sum, vnb) => sum + (vnb.area || 0), 0);

    const voltageCount: Record<string, number> = {
      'Mittelspannung': 0,
      'Niederspannung': 0,
      'Both': 0
    };

    vnbIndex.vnbs.forEach(vnb => {
      const hasMittel = vnb.voltageTypes.includes('Mittelspannung');
      const hasNiedrig = vnb.voltageTypes.includes('Niederspannung');

      if (hasMittel && hasNiedrig) {
        voltageCount['Both']++;
      } else if (hasMittel) {
        voltageCount['Mittelspannung']++;
      } else if (hasNiedrig) {
        voltageCount['Niederspannung']++;
      }
    });

    const byVoltageType = Object.entries(voltageCount)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ type, count }));

    // Area distribution
    const areaRanges = [
      { range: '< 10 km²', min: 0, max: 10_000_000 },
      { range: '10-100 km²', min: 10_000_000, max: 100_000_000 },
      { range: '100-500 km²', min: 100_000_000, max: 500_000_000 },
      { range: '> 500 km²', min: 500_000_000, max: Infinity }
    ];

    const areaDistribution = areaRanges.map(({ range, min, max }) => ({
      range,
      count: vnbIndex.vnbs.filter(v => v.area >= min && v.area < max).length
    }));

    return {
      totalCount: vnbIndex.totalCount,
      totalArea,
      byVoltageType,
      areaDistribution
    };
  }, [vnbIndex]);
}

export function useLoadVNBGeometry() {
  const { loadedVNBs, addLoadedVNB } = useStore();

  const loadVNB = async (fileName: string, id: string) => {
    if (loadedVNBs.has(id)) return loadedVNBs.get(id);

    try {
      const response = await fetch(`${BASE}data/vnb/full/${fileName}`);
      const data = await response.json();
      addLoadedVNB(id, data);
      return data;
    } catch (error) {
      console.error(`Failed to load VNB ${fileName}:`, error);
      return null;
    }
  };

  return { loadVNB, loadedVNBs };
}
