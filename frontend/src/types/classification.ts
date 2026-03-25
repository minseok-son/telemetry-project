import type { Category } from "./shared";

export interface UnlabeledSummary {
  title: string;
  category: Category;
  subCategory: string;
  totalDuration: number;
}

export interface ClassificationRequest {
  title: string;
  category: Category;
  subCategory: string;
}