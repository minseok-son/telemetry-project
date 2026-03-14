import React, { useState } from 'react';
import { formatDuration } from '../utils/timeUtils';
import { format } from 'date-fns';
import type { AggregatedSession } from '../types/telemetry';

interface Props {
  hour: number;
  data: AggregatedSession[];
  onClose: () => void;
}

export const HourlyDetailList: React.FC<Props> = ({ hour, data, onClose }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (title: string) => {
    setExpandedRows(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header same as before */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-white font-semibold text-sm">
            Activity Details for {hour}:00
          </h3>
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-500 hover:text-white hover:bg-slate-800 px-3 py-1 rounded-md transition-colors text-xs"
        >
          Dismiss
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-950/50 text-slate-500 text-[10px] uppercase tracking-wider">
              <th className="p-4">Process / Window Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Sub-Category</th>
              <th className="p-4 text-center">Frequency</th>
              <th className="p-4 text-right">Total Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((group) => (
              <React.Fragment key={group.title}>
                {/* MAIN AGGREGATED ROW */}
                <tr 
                  onClick={() => toggleRow(group.title)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  
                  <td className="p-4 font-mono text-[12px] text-slate-300 max-w-md truncate">
                    {group.title}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                      group.category === 'Productive' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                    }`}>
                      {group.category}
                    </span>
                  </td>
                  <td className="p-4">
                    {group.subCategory ? (
                      <span className="text-[11px] text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">
                        {group.subCategory}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic">Unclassified</span>
                    )}
                  </td>
                  <td className="p-4 text-center text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[11px] border border-slate-700">
                      {group.sessionCount} sessions
                    </span>
                  </td>
                  <td className="p-4 text-right text-slate-400 tabular-nums font-medium">
                    {formatDuration(group.totalSeconds)}
                  </td>
                </tr>

                {/* EXPANDED SLICED SESSIONS */}
                {expandedRows[group.title] && (
                  <tr className="bg-slate-950/30">
                    <td colSpan={6} className="p-0">
                      <div className="px-4 py-3 border-l-2 border-blue-500/30">
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-widest">
                            Slices in this hour
                          </p>
                          {/* Change .rawSessions to .slices (or whatever your new key is) */}
                          {group.slicedSessions.map((slice, i) => {
                            const isClipped = slice.durationSeconds > slice.overlapSeconds;

                            return (
                              <div key={i} className="flex justify-between items-center text-[11px] text-slate-400 border-b border-slate-800/50 pb-1 last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">
                                    {format(new Date(slice.startTime), 'HH:mm:ss')} → {format(new Date(slice.endTime), 'HH:mm:ss')}
                                  </span>
                                  
                                  {/* Visual tag for sessions bleeding out of this hour */}
                                  {isClipped && (
                                    <span className="text-[9px] bg-blue-500/10 text-blue-400/70 px-1 rounded border border-blue-500/20">
                                      Multi-hour
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* The actual contribution to this hour */}
                                  <span className="font-bold text-emerald-500/90">
                                    {formatDuration(slice.overlapSeconds)}
                                  </span>
                                  
                                  {/* The context: how much of the total session this slice represents */}
                                  {isClipped && (
                                    <span className="text-[10px] text-slate-600">
                                      (of {formatDuration(slice.durationSeconds)} total)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};