import type { Category } from "./shared";

export interface UnlabeledTitle {
  title: string;
  totalDuration: number;
}

export interface ClassificationRequest {
  title: string;
  category: Category;
  subCategory: string;
}