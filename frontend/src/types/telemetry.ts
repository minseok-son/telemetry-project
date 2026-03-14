export interface WindowSession {
  id: string;
  title: string;
  category: string;
  subCategory: string | null;
  durationSeconds: number;
  startTime: string;
  endTime: string;
}

export interface SlicedSession extends WindowSession {
  overlapSeconds: number;
}

export interface HeatmapData {
  date: string;
  totalSeconds: number;
  count: number;
}

export interface HistogramData {
  hour: string;
  Productive: number;
  Leisure: number;
  Misc: number;
}

export interface AggregatedSession {
  title: string;
  category: string;
  subCategory: string | null;
  totalSeconds: number;
  sessionCount: number;
  slicedSessions: SlicedSession[];
}