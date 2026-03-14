import axios from 'axios';
import { type WindowSession } from '../types/telemetry';

const API_URL = 'http://localhost:8080/api/sessions';

export const getSessions = async (): Promise<WindowSession[]> => {
    const response = await axios.get(API_URL);
    return response.data;
}