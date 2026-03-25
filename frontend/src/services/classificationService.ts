import axios from 'axios';
import type { UnlabeledSummary, ClassificationRequest } from '../types/classification';

const API_BASE = 'http://localhost:8080/api/classifications'; // Adjust to your backend port

export const classificationService = {
  /**
   * Fetches the unique window titles that haven't been validated yet.
   * Sorted by total duration descending by default in the backend.
   */
  getUnlabeledSummaries: async (): Promise<UnlabeledSummary[]> => {
    const response = await axios.get(`${API_BASE}/unlabeled`);
    return response.data;
  },

  /**
   * Saves a manual label for a specific window title.
   * This should trigger the UPDATE in your Postgres database.
   */
  saveClassification: async (data: ClassificationRequest): Promise<void> => {
    await axios.put(`${API_BASE}`, data);
  },

  /**
   * Optional: Fetches existing sub-categories for the combobox suggestions.
   */
  getSubCategories: async (): Promise<string[]> => {
    const response = await axios.get(`${API_BASE}/sub-categories`);
    return response.data;
  }
};