import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface VoltageTypeChartProps {
  data: { type: string; count: number }[];
}

const COLORS: Record<string, string> = {
  'Mittelspannung': '#e74c3c',
  'Niederspannung': '#3498db',
  'Both': '#9b59b6'
};

const LABELS: Record<string, string> = {
  'Mittelspannung': 'Mittel',
  'Niederspannung': 'Niedrig',
  'Both': 'Beide'
};

export function VoltageTypeChart({ data }: VoltageTypeChartProps) {
  if (!data || data.length === 0) {
    return <p className="no-data">Keine Daten verfügbar</p>;
  }

  const chartData = data.map(item => ({
    ...item,
    name: LABELS[item.type] || item.type
  }));

  return (
    <div className="chart-container" style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={60}
            innerRadius={30}
            paddingAngle={2}
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.type] || '#888'}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} VNBs`, 'Anzahl']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span style={{ color: '#333' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
