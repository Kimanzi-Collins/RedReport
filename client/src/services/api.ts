import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const analyzeLogs = async (
  endpoint: 'report' | 'timeline' | 'mitre' | 'blueprint',
  files: File[],
  provider: 'nvidia' | 'claude' | 'gemini',
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
    if (axios.isAxiosError(error)) {
      const details = error.response?.data?.details || error.response?.data?.error || error.message;
      throw new Error(details);
    }
    throw error;
  }
};

export const analyzeLogsStream = async function* (
  endpoint: 'report' | 'timeline' | 'mitre' | 'blueprint',
  files: File[],
  provider: 'nvidia' | 'claude' | 'gemini',
  prompt?: string,
  reportType: 'executive' | 'investor' = 'executive'
) {
  const fileContents = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      content: await file.text()
    }))
  );

  const payload = {
    endpoint,
    provider,
    prompt,
    reportType,
    fileContents
  };

  const response = await fetch(`${API_BASE_URL}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Engine stream failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;

  let buffer = '';
  while (reader && !done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.trim().slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0]?.delta?.content) {
              yield parsed.choices[0].delta.content;
            }
          } catch (e) {
            // Ignore parse errors for incomplete JSON within a valid SSE line
          }
        }
      }
    }
  }
};
