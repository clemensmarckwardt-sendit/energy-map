import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AreaDistributionChartProps {
  data: { range: string; count: number }[];
}

const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'];

export function AreaDistributionChart({ data }: AreaDistributionChartProps) {
  if (!data || data.length === 0) {
    return <p className="no-data">Keine Daten verfügbar</p>;
  }

  return (
    <div className="chart-container" style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
        >
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="range"
            tick={{ fontSize: 11 }}
            width={55}
          />
          <Tooltip
            formatter={(value) => [`${value} VNBs`, 'Anzahl']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: 12
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
