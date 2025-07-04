export const callLLMAPI = async (
  prompt: string,
  provider: string,
  model: string,
  apiKey: string,
  baseUrl: string,
  systemPrompt: string
): Promise<string> => {
  let apiUrl = '';
  let requestBody = {};
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  switch (provider) {
    case 'openai':
      apiUrl = baseUrl || 'https://api.openai.com/v1/chat/completions';
      requestBody = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.7
      };
      break;
    case 'anthropic':
      apiUrl = baseUrl || 'https://api.anthropic.com/v1/messages';
      requestBody = {
        model,
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
        system: systemPrompt
      };
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
      break;
    case 'google':
      apiUrl = baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      requestBody = {
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7
        }
      };
      // No auth header needed for Google (API key in URL)
      headers = { 'Content-Type': 'application/json' };
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  
  // Extract content based on provider
  let content = '';
  switch (provider) {
    case 'openai':
      content = data.choices[0]?.message?.content || '';
      break;
    case 'anthropic':
      content = data.content[0]?.text || '';
      break;
    case 'google':
      content = data.candidates[0]?.content?.parts[0]?.text || '';
      break;
    default:
      content = 'API响应解析失败';
  }
  
  return content;
};