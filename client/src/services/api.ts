import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const analyzeLogs = async (
  endpoint: 'report' | 'timeline' | 'mitre' | 'blueprint',
  files: File[],
  provider: 'gemini' | 'claude',
  prompt?: string,
  reportType: 'executive' | 'investor' = 'executive'
) => {
  const formData = new FormData();
  
  files.forEach((file) => formData.append('files', file));
  formData.append('provider', provider);
  formData.append('reportType', reportType); // New Field
  if (prompt) formData.append('prompt', prompt);

  try {
    const response = await axios.post(`${API_BASE_URL}/${endpoint}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error(`Error communicating with ${endpoint} engine:`, error);
    throw error;
  }
};
