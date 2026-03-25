import { useState, useEffect, useCallback } from 'react';
import { useClassificationStore } from '../../store/useClassificationStore';
import type { Category } from '../../types/shared';
import { classificationService } from '../../services/classificationService';

export const LabelingStation = () => {
  const { selectedTitle, removeTitle, pendingTitles, setSelectedTitle } = useClassificationStore();
  
  // Local state for the "Draft" before saving
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subCategory, setSubCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset local state when the selected title changes
  useEffect(() => {
    setSelectedCategory(selectedTitle?.category ?? null);
    setSubCategory(selectedTitle?.subCategory ?? '');
  }, [selectedTitle]);

  const handleSave = useCallback(async () => {
    if (!selectedTitle || !selectedCategory) return;

    setIsSaving(true);
    try {
      await classificationService.saveClassification({
        title: selectedTitle.title,
        category: selectedCategory,
        subCategory: subCategory
      })
      console.log(`Saved: ${selectedTitle.title}`);

      // Find next item to maintain flow
      const currentIndex = pendingTitles.findIndex(t => t.title === selectedTitle.title);
      const nextTitle = pendingTitles[currentIndex + 1] || pendingTitles[currentIndex - 1] || null;

      removeTitle(selectedTitle.title);
      setSelectedTitle(nextTitle);
    } catch (error) {
      console.error("Failed to save classification", error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedTitle, selectedCategory, subCategory, pendingTitles, removeTitle, setSelectedTitle]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Enter') handleSave();
        return;
      }

      if (e.key === '1') setSelectedCategory('Productive');
      if (e.key === '2') setSelectedCategory('Leisure');
      if (e.key === '3') setSelectedCategory('Misc');
      if (e.key === 'Enter') handleSave();
      if (e.key === 's') {
        e.preventDefault();
        document.getElementById('sub-cat-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!selectedTitle) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic">
        <p>Select a title to classify</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 flex flex-col bg-slate-950 overflow-y-auto">
      <div className="max-w-2xl">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Labeling Workspace</h1>
            <p className="text-slate-500 text-sm">Select a category and press Save or Enter.</p>
          </div>
          
          {/* THE SAVE BUTTON */}
          <button
            onClick={handleSave}
            disabled={!selectedCategory || isSaving}
            className={`px-8 py-2 rounded-lg font-bold transition-all ${
              !selectedCategory || isSaving
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save (Enter)'}
          </button>
        </header>

        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 mb-8">
          <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block tracking-widest">Raw Window Title</label>
          <code className="text-sm text-blue-300 break-all leading-relaxed">{selectedTitle.title}</code>
        </div>

        <div className="space-y-8">
          <section>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Category</label>
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setSelectedCategory('Productive')} 
                className={`flex flex-col items-center py-6 rounded-xl border transition-all ${
                  selectedCategory === 'Productive' 
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' 
                  : 'border-emerald-500/10 bg-emerald-500/5 text-emerald-500/50 hover:bg-emerald-500/10'
                }`}
              >
                <span className="font-bold text-lg">Productive</span>
                <span className="text-[10px] mt-1 font-mono opacity-50">[1]</span>
              </button>

              <button 
                onClick={() => setSelectedCategory('Leisure')} 
                className={`flex flex-col items-center py-6 rounded-xl border transition-all ${
                  selectedCategory === 'Leisure' 
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                  : 'border-blue-500/10 bg-blue-500/5 text-blue-500/50 hover:bg-blue-500/10'
                }`}
              >
                <span className="font-bold text-lg">Leisure</span>
                <span className="text-[10px] mt-1 font-mono opacity-50">[2]</span>
              </button>

              <button 
                onClick={() => setSelectedCategory('Misc')} 
                className={`flex flex-col items-center py-6 rounded-xl border transition-all ${
                  selectedCategory === 'Misc' 
                  ? 'border-slate-400 bg-slate-700 text-white' 
                  : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:bg-slate-700'
                }`}
              >
                <span className="font-bold text-lg">Misc</span>
                <span className="text-[10px] mt-1 font-mono opacity-50">[3]</span>
              </button>
            </div>
          </section>

          <section>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">
              Sub-Category <span className="text-[10px] lowercase font-normal ml-2 opacity-60">(Press 's' to focus)</span>
            </label>
            <input
              id="sub-cat-input"
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Start typing..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </section>
        </div>
      </div>
    </div>
  );
};