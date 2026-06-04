import axios from 'axios';

// Ensure your Express backend is running on port 5000
const API_BASE_URL = 'http://localhost:5000/api';

export const analyzeLogs = async (
  endpoint: 'report' | 'timeline' | 'mitre' | 'blueprint',
  files: File[],
  provider: 'gemini' | 'claude',
  prompt?: string
) => {
  const formData = new FormData();
  
  // Append all selected files
  files.forEach((file) => {
    formData.append('files', file);
  });

  // Append configuration
  formData.append('provider', provider);
  if (prompt) {
    formData.append('prompt', prompt);
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/${endpoint}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error communicating with ${endpoint} engine:`, error);
    throw error;
  }
};