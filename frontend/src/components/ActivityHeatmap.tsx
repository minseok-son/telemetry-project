import React from 'react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { type HeatmapData } from '../types/telemetry';
import { formatDuration } from '../utils/timeUtils';

interface Props {
  data: HeatmapData[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
}

export const ActivityHeatmap: React.FC<Props> = ({ data, selectedDate, onDateClick }) => {
  // Generate last 90 days
  const days = Array.from({ length: 91 }, (_, i) => subDays(new Date(), 90 - i));

  const getColorClass = (seconds: number) => {
    if (seconds === 0) return 'bg-slate-800';
    if (seconds < 3600) return 'bg-emerald-900';
    if (seconds < 10800) return 'bg-emerald-700';
    if (seconds < 18000) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
      <h2 className="text-slate-400 text-sm font-medium mb-4">Activity Heatmap (Last 90 Days)</h2>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const entry = data.find((d) => d.date === dayStr);
          const seconds = entry?.totalSeconds || 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={dayStr}
              title={`${dayStr}: ${formatDuration(seconds)}`}
              onClick={() => onDateClick(day)}
              className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-white ${getColorClass(seconds)} ${
                isSelected ? 'ring-2 ring-blue-500 scale-125' : ''
              }`}
            />
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span>Less</span>
        <div className="w-3 h-3 bg-slate-800 rounded-sm" />
        <div className="w-3 h-3 bg-emerald-900 rounded-sm" />
        <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
        <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
        <span>More</span>
      </div>
    </div>
  );
};