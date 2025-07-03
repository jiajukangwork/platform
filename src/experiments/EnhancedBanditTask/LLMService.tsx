interface LLMRequest {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}

interface LLMResponse {
  choice: number;
  rawResponse: string;
  thinking?: string;
  error?: string;
}

class LLMService {
  private static instance: LLMService;

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async makeDecision(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.callLLMAPI(request);
      const choice = this.parseChoice(response.content);
      
      return {
        choice,
        rawResponse: response.content,
        thinking: response.thinking
      };
    } catch (error) {
      console.error('LLM API调用失败:', error);
      return {
        choice: Math.floor(Math.random() * 4), // 随机选择作为fallback
        rawResponse: '',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  private async callLLMAPI(request: LLMRequest): Promise<{ content: string; thinking?: string }> {
    const { provider, apiKey, baseUrl, model, systemPrompt, userPrompt } = request;

    switch (provider) {
      case 'openai':
        return this.callOpenAI(apiKey, baseUrl, model, systemPrompt, userPrompt);
      case 'anthropic':
        return this.callAnthropic(apiKey, baseUrl, model, systemPrompt, userPrompt);
      case 'google':
        return this.callGoogle(apiKey, baseUrl, model, systemPrompt, userPrompt);
      case 'custom':
        return this.callCustomAPI(apiKey, baseUrl, model, systemPrompt, userPrompt);
      default:
        throw new Error(`不支持的API提供商: ${provider}`);
    }
  }

  private async callOpenAI(
    apiKey: string, 
    baseUrl: string | undefined, 
    model: string, 
    systemPrompt: string, 
    userPrompt: string
  ): Promise<{ content: string; thinking?: string }> {
    const url = baseUrl || 'https://api.openai.com/v1/chat/completions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      thinking: data.choices[0]?.message?.content || ''
    };
  }

  private async callAnthropic(
    apiKey: string, 
    baseUrl: string | undefined, 
    model: string, 
    systemPrompt: string, 
    userPrompt: string
  ): Promise<{ content: string; thinking?: string }> {
    const url = baseUrl || 'https://api.anthropic.com/v1/messages';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 150,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || '',
      thinking: data.content[0]?.text || ''
    };
  }

  private async callGoogle(
    apiKey: string, 
    baseUrl: string | undefined, 
    model: string, 
    systemPrompt: string, 
    userPrompt: string
  ): Promise<{ content: string; thinking?: string }> {
    const url = baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${userPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      content,
      thinking: content
    };
  }

  private async callCustomAPI(
    apiKey: string, 
    baseUrl: string | undefined, 
    model: string, 
    systemPrompt: string, 
    userPrompt: string
  ): Promise<{ content: string; thinking?: string }> {
    if (!baseUrl) {
      throw new Error('自定义API需要提供baseUrl');
    }

    // 尝试OpenAI兼容格式
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`自定义API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || data.response || '',
      thinking: data.choices?.[0]?.message?.content || data.response || ''
    };
  }

  private parseChoice(response: string): number {
    // 尝试从响应中提取数字选择
    const numbers = response.match(/\b[0-9]\b/g);
    if (numbers && numbers.length > 0) {
      const choice = parseInt(numbers[0]);
      // 确保选择在有效范围内
      if (choice >= 0 && choice <= 7) {
        return choice;
      }
    }

    // 尝试匹配常见的选择表达
    const choicePatterns = [
      /选择\s*(\d+)/,
      /option\s*(\d+)/i,
      /选项\s*(\d+)/,
      /第\s*(\d+)\s*个/,
      /bandit\s*(\d+)/i,
      /机器\s*(\d+)/
    ];

    for (const pattern of choicePatterns) {
      const match = response.match(pattern);
      if (match) {
        const choice = parseInt(match[1]);
        if (choice >= 0 && choice <= 7) {
          return choice;
        }
      }
    }

    // 如果无法解析，返回随机选择
    console.warn('无法解析LLM响应，使用随机选择:', response);
    return Math.floor(Math.random() * 4);
  }

  // 测试API连接
  async testConnection(config: {
    provider: string;
    apiKey: string;
    baseUrl?: string;
    model: string;
  }): Promise<boolean> {
    try {
      const testPrompt = "请回复数字1";
      const response = await this.callLLMAPI({
        ...config,
        systemPrompt: "你是一个测试助手。",
        userPrompt: testPrompt
      });
      
      return response.content.length > 0;
    } catch (error) {
      console.error('API连接测试失败:', error);
      return false;
    }
  }
}

export default LLMService;