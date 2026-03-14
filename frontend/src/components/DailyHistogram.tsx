import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { type WindowSession } from '../types/telemetry';
import { getHourlyBuckets } from '../utils/timeUtils';
import { format } from 'date-fns';

interface Props {
  date: Date;
  sessions: WindowSession[];
  onHourClick: (hour: number) => void;
}

export const DailyHistogram: React.FC<Props> = ({ date, sessions, onHourClick }) => {
  const data = getHourlyBuckets(sessions, date);

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-90">
      <div className="mb-4">
        <h2 className="text-white font-semibold">{format(date, 'MMMM do, yyyy')}</h2>
        <p className="text-slate-400 text-xs">Activity breakdown by hour (minutes)</p>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart 
          data={data}
          onClick={(state) => {
            if (state && state.activeLabel) {
              // 1. Convert to string or check type
              const label = state.activeLabel.toString(); 
              
              // 2. Now .split() is safe to use
              const hour = parseInt(label.split(':')[0]);
              onHourClick(hour);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 60]} stroke="#64748b" fontSize={12} type="number" allowDataOverflow={true} tickCount={7} unit="m" tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
            cursor={{ fill: '#1e293b' }}
          />
          <Bar dataKey="Productive" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Leisure" stackId="a" fill="#3b82f6" />
          <Bar dataKey="Misc" stackId="a" fill="#94a3b8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};