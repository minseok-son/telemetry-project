import { useClassificationStore } from '../../store/useClassificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '../../utils/timeUtils';

export const PendingSidebar = () => {
  const { pendingTitles, selectedTitle, setSelectedTitle } = useClassificationStore();

  return (
    <div className="w-96 border-r border-slate-800 flex flex-col h-full bg-slate-900/30">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-white font-bold flex items-center gap-2">
          Pending <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{pendingTitles.length}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-slate-900/50
        [&::-webkit-scrollbar-thumb]:bg-slate-700
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        <AnimatePresence mode="popLayout">
          {pendingTitles.map((item) => (
            <motion.button
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
              key={item.title}
              onClick={() => setSelectedTitle(item)}
              className={`w-full text-left p-4 border-b border-slate-800/50 transition-colors ${
                selectedTitle?.title === item.title ? 'bg-blue-600/10' : 'hover:bg-slate-800/30'
              }`}
            >
                <p className="text-xs font-mono text-slate-300 truncate mb-1">{item.title}</p>
                <div className="flex justify-between items-center">
                <span className="text-[11px] text-emerald-500 font-medium">{formatDuration(item.totalDuration)}</span>
                </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};