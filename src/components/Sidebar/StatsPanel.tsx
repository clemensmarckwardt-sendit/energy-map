import { Activity, MapPin, Zap } from 'lucide-react';
import { useVNBStats, useVNBIndex } from '../../hooks/useVNBData';
import { formatArea } from '../../utils/geoUtils';
import { VoltageTypeChart } from '../Charts/VoltageTypeChart';
import { AreaDistributionChart } from '../Charts/AreaDistributionChart';

export function StatsPanel() {
  const { isLoading } = useVNBIndex();
  const stats = useVNBStats();

  if (isLoading) {
    return (
      <div className="stats-panel loading">
        <p>Lade Statistiken...</p>
      </div>
    );
  }

  return (
    <div className="stats-panel">
      <h3>Statistiken</h3>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalCount}</span>
            <span className="stat-label">VNBs gesamt</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <MapPin size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatArea(stats.totalArea)}</span>
            <span className="stat-label">Gesamtfläche</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {stats.byVoltageType.find(v => v.type === 'Both')?.count || 0}
            </span>
            <span className="stat-label">Beide Spannungen</span>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h4>Spannungsverteilung</h4>
        <VoltageTypeChart data={stats.byVoltageType} />
      </div>

      <div className="chart-section">
        <h4>Flächenverteilung</h4>
        <AreaDistributionChart data={stats.areaDistribution} />
      </div>
    </div>
  );
}
