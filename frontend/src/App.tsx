import { useState, useEffect, useMemo } from 'react';
import type { WindowSession } from './types/telemetry';
import type { ViewMode } from './types/shared';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { DailyHistogram } from './components/DailyHistogram';
import { HourlyDetailList } from './components/HourlyDetailList';
import { getSessionsForHour } from './utils/timeUtils';
import { toLocalTime } from './utils/timeUtils';
import { startOfDay, isSameDay } from 'date-fns';
import { WorkbenchLayout } from './components/workbench/WorkbenchLayout';

export default function App() {
  const [sessions, setSessions] = useState<WindowSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Reset hour when date changes
  useEffect(() => {
    setSelectedHour(null);
  }, [selectedDate]);

  useEffect(() => {
    fetch('http://localhost:8080/api/telemetry/sessions')
      .then(res => res.json())
      .then(data => setSessions(data));
  }, []);

  const heatmapData = useMemo(() => {
    const map: Record<string, any> = {};
    
    sessions.forEach(s => {
      const localDate = toLocalTime(s.startTime);
      if (!localDate) return;

      // Use local date methods to get the string, NOT the raw UTC string
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const localDayKey = `${year}-${month}-${day}`;

      if (!map[localDayKey]) {
        map[localDayKey] = { date: localDayKey, totalSeconds: 0 };
      }
      map[localDayKey].totalSeconds += s.durationSeconds;
    });
    
    return Object.values(map);
  }, [sessions]);
  
  const dailySessions = useMemo(() => {
    if (!selectedDate) return [];

    const targetDay = startOfDay(selectedDate);

    return sessions.filter(s => {
      if (!s.startTime || s.title == "Windows Default Lock Screen" || s.title == "UnlockingWindow") return false;

      // 1. Convert the UTC string to a Local Date object
      const sessionDate = new Date(s.startTime); 
      
      // 2. Compare using date-fns isSameDay
      // This handles the UTC -> Local conversion automatically
      return isSameDay(sessionDate, targetDay);
    });
  }, [sessions, selectedDate]);

  const hourlySessions = useMemo(() => {
    if (selectedHour === null || !selectedDate) return [];
    return getSessionsForHour(dailySessions, selectedDate, selectedHour);
  }, [dailySessions, selectedDate, selectedHour]);


  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Container ensures identical width for all children */}
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Telemetry Dashboard</h1>
            <p className="text-slate-400">Track your window activity and productivity habits.</p>
          </div>

          <nav className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setViewMode('workbench')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'workbench' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Classify
            </button>
          </nav>
        </header>
        
        {/* 2. Switch between Dashboard and Workbench */}
        {viewMode === 'dashboard' ? (
          <>
            {/* 1. Heatmap */}
            <ActivityHeatmap 
              data={heatmapData} 
              selectedDate={selectedDate} 
              onDateClick={setSelectedDate} 
            />

            {/* 2. Histogram (Now full width) */}
            {selectedDate && (
              <div className="w-full">
                <DailyHistogram 
                  date={selectedDate} 
                  sessions={dailySessions} 
                  onHourClick={(hour) => setSelectedHour(hour)}
                />
              </div>
            )}

            {/* 3. Hourly Detail (Now full width below histogram) */}
            {selectedHour !== null && selectedDate && (
              <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                <HourlyDetailList 
                  hour={selectedHour} 
                  data={hourlySessions} 
                  onClose={() => setSelectedHour(null)}
                />
              </div>
            )}
          </>
        ) : (
          /* 3. The Classification Workbench */
          <div className="w-full animate-in fade-in zoom-in-95 duration-300">
            <WorkbenchLayout />
          </div>
        )}
      </div>
    </div>
  );
}