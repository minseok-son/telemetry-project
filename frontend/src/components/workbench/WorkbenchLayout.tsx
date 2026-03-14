import { useEffect } from 'react';
import { PendingSidebar } from './PendingSidebar';
import { LabelingStation } from './LabelingStation';
import { useClassificationStore } from '../../store/useClassificationStore';
import { classificationService } from '../../services/classificationService';

export const WorkbenchLayout = () => {
  const { setPendingTitles } = useClassificationStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        const titles = await classificationService.getUnlabeledTitles();
        setPendingTitles(titles);
      } catch (error) {
        console.error("Failed to fetch pending titles:", error);
      }
    };
    loadData();
  }, [setPendingTitles]);

  return (
    <div className="flex h-[calc(80vh)] overflow-hidden bg-slate-950">
      <PendingSidebar />
      <LabelingStation />
    </div>
  );
};
