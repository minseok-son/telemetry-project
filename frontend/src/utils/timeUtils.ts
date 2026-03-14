import { startOfHour, startOfDay, isSameDay, differenceInSeconds, addHours, set } from 'date-fns';
import { type WindowSession, type HistogramData, type AggregatedSession } from '../types/telemetry';

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

export const getHourlyBuckets = (sessions: WindowSession[], targetDate: Date): HistogramData[] => {
  const buckets: Record<number, any> = {};
  
  for (let i = 0; i < 24; i++) {
    buckets[i] = { hour: `${i}:00`, Productive: 0, Leisure: 0, Misc: 0 };
  }

  // Ensure targetDate is at the start of its day for clean comparison
  const targetStart = startOfDay(targetDate);

  sessions.forEach((s) => {
    const start = toLocalTime(s.startTime);
    const end = toLocalTime(s.endTime);

    if (!start || !end) return;

    let currentPtr = start;
    const endPtr = end;

    while (currentPtr < endPtr) {
      const hourIdx = currentPtr.getHours();
      // Calculate the start of the NEXT hour
      const nextHourStart = startOfHour(addHours(currentPtr, 1));
      
      // The segment we care about is from currentPtr to either end of session or start of next hour
      const overlapEnd = endPtr < nextHourStart ? endPtr : nextHourStart;

      if (isSameDay(currentPtr, targetStart)) {
        const secondsInHour = differenceInSeconds(overlapEnd, currentPtr);
        
        if (buckets[hourIdx]) {
          // Use a more precise addition then round at the end if preferred
          buckets[hourIdx][s.category] += secondsInHour / 60;
        }
      }

      currentPtr = nextHourStart;
    }
  });

  // Final Pass: Round the values so you don't return 12.333333 minutes
  return Object.values(buckets).map(b => ({
    ...b,
    Productive: Math.round(b.Productive),
    Leisure: Math.round(b.Leisure),
    Misc: Math.round(b.Misc)
  }));
};

export const getSessionsForHour = (sessions: WindowSession[], targetDate: Date, hour: number) => {
  // We want to check the "Wall Clock" hour, so we build our window in Local Time
  const base = startOfDay(targetDate);
  const hourStart = set(base, { hours: hour }).getTime();
  const hourEnd = set(base, { hours: hour, minutes: 59, seconds: 59, milliseconds: 999 }).getTime();

  const aggregated: Record<string, AggregatedSession> = {};

  sessions.forEach(s => {
    // Both are now converted from UTC to Local CDT
    const startObj = toLocalTime(s.startTime);
    const endObj = toLocalTime(s.endTime);
    
    if (!startObj || !endObj) return;

    const sStart = startObj.getTime();
    const sEnd = endObj.getTime();

    if (sStart <= hourEnd && sEnd >= hourStart) {
      const overlapStart = Math.max(sStart, hourStart);
      const overlapEnd = Math.min(sEnd, hourEnd);
      const secondsInHour = Math.max(0, (overlapEnd - overlapStart) / 1000);

      if (secondsInHour > 0) {
        const key = `${s.title}-${s.category}`;
        if (!aggregated[key]) {
          aggregated[key] = { 
            title: s.title,
            category: s.category,
            subCategory: s.subCategory,
            totalSeconds: 0,
            sessionCount: 0,
            slicedSessions: [] 
          };
        }
        aggregated[key].totalSeconds += secondsInHour;
        aggregated[key].sessionCount += 1;
        aggregated[key].slicedSessions.push({
          ...s,
          overlapSeconds: secondsInHour
        });
      }
    }
  });

  return Object.values(aggregated).sort((a, b) => b.totalSeconds - a.totalSeconds);
};

export const toLocalTime = (dateStr: string): Date => {
  return new Date(dateStr);
};