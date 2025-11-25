import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface ChatCompletionOptions {
  model: string;
  systemPrompt?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  tokensUsed: number;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Generate a chat completion using the specified AI model
   */
  async generateChatCompletion(
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const {
      model,
      systemPrompt,
      messages,
      maxTokens = 2048,
      temperature = 0.7,
    } = options;

    this.logger.log(`Generating chat completion with model: ${model}`);

    // Build messages array with system prompt
    const fullMessages: ChatMessage[] = [];
    if (systemPrompt) {
      fullMessages.push({ role: "system", content: systemPrompt });
    }
    fullMessages.push(...messages);

    // Route to appropriate provider based on model
    switch (model) {
      case "grok":
        return this.callGrokAPI(fullMessages, maxTokens, temperature);
      case "gpt-4":
        return this.callOpenAIAPI(fullMessages, maxTokens, temperature);
      case "claude":
        return this.callClaudeAPI(fullMessages, maxTokens, temperature);
      case "gemini":
        return this.callGeminiAPI(fullMessages, maxTokens, temperature);
      default:
        // Default to Grok
        return this.callGrokAPI(fullMessages, maxTokens, temperature);
    }
  }

  /**
   * Generate a meeting summary from discussion messages
   */
  async generateSummary(
    messages: { sender: string; content: string; timestamp: string }[],
    model: string = "grok",
  ): Promise<ChatCompletionResult> {
    const discussionText = messages
      .map((m) => `[${m.timestamp}] ${m.sender}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are an expert meeting summarizer. Analyze the following discussion and create a comprehensive summary that includes:
1. Key Discussion Points: Main topics and themes discussed
2. Decisions Made: Any decisions or conclusions reached
3. Action Items: Tasks or follow-ups mentioned
4. Participants' Perspectives: Notable viewpoints or contributions
5. Outstanding Questions: Unresolved issues or questions

Format the summary in a clear, structured manner using markdown.`;

    const userMessage = `Please summarize the following discussion:\n\n${discussionText}`;

    return this.generateChatCompletion({
      model,
      systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 4096,
      temperature: 0.5,
    });
  }

  /**
   * Call xAI Grok API
   */
  private async callGrokAPI(
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
  ): Promise<ChatCompletionResult> {
    const apiKey = process.env.XAI_API_KEY;
    const apiUrl =
      process.env.XAI_API_URL || "https://api.x.ai/v1/chat/completions";

    if (!apiKey) {
      this.logger.warn("XAI_API_KEY not configured, returning mock response");
      return this.getMockResponse("grok", messages);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          {
            model: "grok-beta",
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            max_tokens: maxTokens,
            temperature,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const data = response.data;
      return {
        content: data.choices[0]?.message?.content || "",
        model: "grok",
        tokensUsed: data.usage?.total_tokens || 0,
      };
    } catch (error) {
      this.logger.error(`Grok API error: ${error}`);
      return this.getMockResponse("grok", messages);
    }
  }

  /**
   * Call OpenAI API for GPT-4
   */
  private async callOpenAIAPI(
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
  ): Promise<ChatCompletionResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    if (!apiKey) {
      this.logger.warn(
        "OPENAI_API_KEY not configured, returning mock response",
      );
      return this.getMockResponse("gpt-4", messages);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          {
            model: "gpt-4-turbo-preview",
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            max_tokens: maxTokens,
            temperature,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const data = response.data;
      return {
        content: data.choices[0]?.message?.content || "",
        model: "gpt-4",
        tokensUsed: data.usage?.total_tokens || 0,
      };
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error}`);
      return this.getMockResponse("gpt-4", messages);
    }
  }

  /**
   * Call Anthropic Claude API
   */
  private async callClaudeAPI(
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
  ): Promise<ChatCompletionResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const apiUrl = "https://api.anthropic.com/v1/messages";

    if (!apiKey) {
      this.logger.warn(
        "ANTHROPIC_API_KEY not configured, returning mock response",
      );
      return this.getMockResponse("claude", messages);
    }

    try {
      // Extract system message
      const systemMessage = messages.find((m) => m.role === "system");
      const otherMessages = messages.filter((m) => m.role !== "system");

      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          {
            model: "claude-3-opus-20240229",
            max_tokens: maxTokens,
            temperature,
            system: systemMessage?.content,
            messages: otherMessages.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
          },
          {
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const data = response.data;
      return {
        content: data.content[0]?.text || "",
        model: "claude",
        tokensUsed:
          (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      };
    } catch (error) {
      this.logger.error(`Claude API error: ${error}`);
      return this.getMockResponse("claude", messages);
    }
  }

  /**
   * Call Google Gemini API
   * Using Gemini 2.0 Flash model with system instruction support
   */
  private async callGeminiAPI(
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
  ): Promise<ChatCompletionResult> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        "GOOGLE_AI_API_KEY not configured, returning mock response",
      );
      return this.getMockResponse("gemini", messages);
    }

    // Use Gemini 2.0 Flash (latest model with better performance)
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
      // Extract system message for system instruction
      const systemMessage = messages.find((m) => m.role === "system");
      const otherMessages = messages.filter((m) => m.role !== "system");

      // Convert messages to Gemini format
      const contents = otherMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Build request body
      const requestBody: any = {
        contents,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
          topP: 0.95,
          topK: 40,
        },
      };

      // Add system instruction if present (Gemini 1.5+ supports this natively)
      if (systemMessage) {
        requestBody.systemInstruction = {
          parts: [{ text: systemMessage.content }],
        };
      }

      this.logger.log(`Calling Gemini API with model: ${modelName}`);

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestBody, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60 second timeout
        }),
      );

      const data = response.data;

      // Check for blocked content or errors
      if (data.candidates?.[0]?.finishReason === "SAFETY") {
        this.logger.warn("Gemini response blocked due to safety filters");
        return {
          content:
            "I apologize, but I cannot provide a response to that request due to content safety guidelines.",
          model: "gemini",
          tokensUsed: 0,
        };
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const tokensUsed =
        (data.usageMetadata?.promptTokenCount || 0) +
        (data.usageMetadata?.candidatesTokenCount || 0);

      this.logger.log(`Gemini response received, tokens used: ${tokensUsed}`);

      return {
        content,
        model: "gemini",
        tokensUsed,
      };
    } catch (error: any) {
      // Log detailed error information
      if (error.response) {
        this.logger.error(
          `Gemini API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      } else {
        this.logger.error(`Gemini API error: ${error.message}`);
      }
      return this.getMockResponse("gemini", messages);
    }
  }

  /**
   * Test connection to an AI model
   * Returns latency and success status
   */
  async testModelConnection(
    model: string,
  ): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    try {
      // Simple test message
      const testMessages: ChatMessage[] = [
        { role: "user", content: "Say 'OK' to confirm you are working." },
      ];

      let result: ChatCompletionResult;

      switch (model) {
        case "grok":
          result = await this.callGrokAPI(testMessages, 50, 0);
          break;
        case "gpt-4":
          result = await this.callOpenAIAPI(testMessages, 50, 0);
          break;
        case "claude":
          result = await this.callClaudeAPI(testMessages, 50, 0);
          break;
        case "gemini":
          result = await this.callGeminiAPI(testMessages, 50, 0);
          break;
        default:
          return {
            success: false,
            message: `Unknown model: ${model}`,
          };
      }

      const latency = Date.now() - startTime;

      // Check if we got a mock response (API key not configured)
      if (result.content.includes("mock response")) {
        return {
          success: false,
          message: `API key not configured for ${model}`,
          latency,
        };
      }

      return {
        success: true,
        message: `Connection successful! Response: "${result.content.substring(0, 100)}..."`,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Connection failed: ${errorMessage}`,
        latency,
      };
    }
  }

  /**
   * Test connection to an AI model with custom API key and endpoint
   * Used for testing models configured in the database
   */
  async testModelConnectionWithKey(
    provider: string,
    modelId: string,
    apiKey: string,
    apiEndpoint: string,
  ): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    if (!apiKey) {
      return {
        success: false,
        message: "API key is not configured",
        latency: 0,
      };
    }

    try {
      const testMessages = [
        {
          role: "user" as const,
          content: "Say 'OK' to confirm you are working.",
        },
      ];

      let response;

      // Determine the correct API format based on provider
      switch (provider.toLowerCase()) {
        case "xai":
        case "grok":
          response = await firstValueFrom(
            this.httpService.post(
              apiEndpoint || "https://api.x.ai/v1/chat/completions",
              {
                model: modelId || "grok-beta",
                messages: testMessages,
                max_tokens: 50,
                temperature: 0,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                timeout: 30000,
              },
            ),
          );
          break;

        case "openai":
        case "gpt":
          response = await firstValueFrom(
            this.httpService.post(
              apiEndpoint || "https://api.openai.com/v1/chat/completions",
              {
                model: modelId || "gpt-4",
                messages: testMessages,
                max_tokens: 50,
                temperature: 0,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                timeout: 30000,
              },
            ),
          );
          break;

        case "anthropic":
        case "claude":
          response = await firstValueFrom(
            this.httpService.post(
              apiEndpoint || "https://api.anthropic.com/v1/messages",
              {
                model: modelId || "claude-3-sonnet-20240229",
                max_tokens: 50,
                messages: testMessages,
              },
              {
                headers: {
                  "x-api-key": apiKey,
                  "anthropic-version": "2023-06-01",
                  "Content-Type": "application/json",
                },
                timeout: 30000,
              },
            ),
          );
          break;

        case "google":
        case "gemini":
          // Check if this is an image generation model
          const isImageModel =
            modelId?.includes("image") || modelId?.includes("imagen");

          // For image models, use a simple text test without image generation
          // This avoids the cost of generating images just for connection testing
          const geminiTestPrompt = isImageModel
            ? "Hello" // Simple prompt for image models
            : testMessages[0].content;

          const geminiConfig: Record<string, unknown> = isImageModel
            ? {} // Don't request image generation for connection test
            : {
                maxOutputTokens: 50,
                temperature: 0,
              };

          // Build endpoint - use header auth instead of query param for better security
          const geminiEndpoint =
            apiEndpoint ||
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId || "gemini-pro"}:generateContent`;

          response = await firstValueFrom(
            this.httpService.post(
              geminiEndpoint,
              {
                contents: [
                  {
                    parts: [{ text: geminiTestPrompt }],
                  },
                ],
                ...(Object.keys(geminiConfig).length > 0
                  ? { generationConfig: geminiConfig }
                  : {}),
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": apiKey,
                },
                timeout: 30000,
              },
            ),
          );
          break;

        default:
          return {
            success: false,
            message: `Unsupported provider: ${provider}`,
            latency: Date.now() - startTime,
          };
      }

      const latency = Date.now() - startTime;

      // Extract response content based on provider
      let content = "";
      if (
        provider.toLowerCase() === "anthropic" ||
        provider.toLowerCase() === "claude"
      ) {
        content = response.data?.content?.[0]?.text || "";
      } else if (
        provider.toLowerCase() === "google" ||
        provider.toLowerCase() === "gemini"
      ) {
        content =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        content = response.data?.choices?.[0]?.message?.content || "";
      }

      return {
        success: true,
        message: `Connection successful! Response: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"`,
        latency,
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      let errorMessage = "Unknown error";

      if (error.response) {
        // API returned an error response
        const status = error.response.status;
        const data = error.response.data;
        errorMessage = `API Error (${status}): ${data?.error?.message || data?.message || JSON.stringify(data)}`;
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Connection timeout";
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.logger.error(`Model connection test failed: ${errorMessage}`);

      return {
        success: false,
        message: `Connection failed: ${errorMessage}`,
        latency,
      };
    }
  }

  /**
   * Generate a chat completion using a specific API key from the database
   * Used for AI Group feature where models are configured per-tenant
   */
  async generateChatCompletionWithKey(options: {
    provider: string;
    modelId: string;
    apiKey: string;
    apiEndpoint?: string;
    systemPrompt?: string;
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<ChatCompletionResult> {
    const {
      provider,
      modelId,
      apiKey,
      apiEndpoint,
      systemPrompt,
      messages,
      maxTokens = 2048,
      temperature = 0.7,
    } = options;

    this.logger.log(
      `Generating chat completion with key for provider: ${provider}, model: ${modelId}`,
    );

    if (!apiKey) {
      this.logger.warn(`No API key provided for ${provider}, returning mock`);
      return this.getMockResponse(modelId, messages);
    }

    // Build full messages with system prompt
    const fullMessages: ChatMessage[] = [];
    if (systemPrompt) {
      fullMessages.push({ role: "system", content: systemPrompt });
    }
    fullMessages.push(...messages);

    try {
      switch (provider.toLowerCase()) {
        case "xai":
        case "grok":
          return await this.callApiWithKey(
            apiEndpoint || "https://api.x.ai/v1/chat/completions",
            {
              model: modelId || "grok-beta",
              messages: fullMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              max_tokens: maxTokens,
              temperature,
            },
            { Authorization: `Bearer ${apiKey}` },
            "grok",
          );

        case "openai":
        case "gpt":
          return await this.callApiWithKey(
            apiEndpoint || "https://api.openai.com/v1/chat/completions",
            {
              model: modelId || "gpt-4-turbo-preview",
              messages: fullMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              max_tokens: maxTokens,
              temperature,
            },
            { Authorization: `Bearer ${apiKey}` },
            "gpt-4",
          );

        case "anthropic":
        case "claude":
          const systemMessage = fullMessages.find((m) => m.role === "system");
          const otherMessages = fullMessages.filter((m) => m.role !== "system");
          return await this.callClaudeApiWithKey(
            apiEndpoint || "https://api.anthropic.com/v1/messages",
            apiKey,
            modelId || "claude-3-opus-20240229",
            systemMessage?.content,
            otherMessages,
            maxTokens,
            temperature,
          );

        case "google":
        case "gemini":
          return await this.callGeminiApiWithKey(
            apiKey,
            modelId || "gemini-2.0-flash-exp",
            apiEndpoint,
            fullMessages,
            maxTokens,
            temperature,
          );

        default:
          this.logger.warn(`Unknown provider: ${provider}, using Grok`);
          return await this.callApiWithKey(
            "https://api.x.ai/v1/chat/completions",
            {
              model: "grok-beta",
              messages: fullMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              max_tokens: maxTokens,
              temperature,
            },
            { Authorization: `Bearer ${apiKey}` },
            "grok",
          );
      }
    } catch (error) {
      this.logger.error(`API call failed: ${error}`);
      return this.getMockResponse(modelId, messages);
    }
  }

  /**
   * Helper method to call OpenAI-compatible APIs
   */
  private async callApiWithKey(
    url: string,
    body: any,
    headers: Record<string, string>,
    modelName: string,
  ): Promise<ChatCompletionResult> {
    const response = await firstValueFrom(
      this.httpService.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        timeout: 60000,
      }),
    );

    const data = response.data;
    return {
      content: data.choices?.[0]?.message?.content || "",
      model: modelName,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  /**
   * Helper method to call Claude API with key
   */
  private async callClaudeApiWithKey(
    url: string,
    apiKey: string,
    modelId: string,
    systemPrompt: string | undefined,
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
  ): Promise<ChatCompletionResult> {
    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          model: modelId,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        },
        {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          timeout: 60000,
        },
      ),
    );

    const data = response.data;
    return {
      content: data.content?.[0]?.text || "",
      model: "claude",
      tokensUsed:
        (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    };
  }

  /**
   * Helper method to call Gemini API with key
   */
  private async callGeminiApiWithKey(
    apiKey: string,
    modelId: string,
    apiEndpoint: string | undefined,
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
  ): Promise<ChatCompletionResult> {
    const url =
      apiEndpoint ||
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    // Extract system message for system instruction
    const systemMessage = messages.find((m) => m.role === "system");
    const otherMessages = messages.filter((m) => m.role !== "system");

    // Convert messages to Gemini format
    const contents = otherMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const requestBody: any = {
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    };

    if (systemMessage) {
      requestBody.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const response = await firstValueFrom(
      this.httpService.post(url, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }),
    );

    const data = response.data;
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      model: "gemini",
      tokensUsed:
        (data.usageMetadata?.promptTokenCount || 0) +
        (data.usageMetadata?.candidatesTokenCount || 0),
    };
  }

  /**
   * Generate a mock response for development/testing when API keys are not configured
   */
  private getMockResponse(
    model: string,
    messages: ChatMessage[],
  ): ChatCompletionResult {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    const userContent = lastUserMessage?.content || "";

    // Generate contextual mock response
    let content: string;
    if (
      userContent.toLowerCase().includes("summarize") ||
      userContent.toLowerCase().includes("summary")
    ) {
      content = `## Discussion Summary

### Key Points
- The team discussed various aspects of the project
- Multiple perspectives were shared and considered
- Important decisions were made regarding next steps

### Decisions Made
1. Continue with the current approach
2. Schedule follow-up meetings as needed
3. Document all findings and share with stakeholders

### Action Items
- [ ] Review and finalize documentation
- [ ] Set up recurring meetings
- [ ] Share updates with the broader team

### Outstanding Questions
- Timeline for completion needs to be confirmed
- Resource allocation may need adjustment

*This is a mock summary generated for testing purposes.*`;
    } else {
      content = `Thank you for your message! I'm ${model.toUpperCase()}, and I'm here to help with the discussion.

Based on what you've shared, here are my thoughts:

1. **Understanding**: I've reviewed the context of your question
2. **Analysis**: The topic you've raised has several interesting aspects
3. **Suggestion**: I recommend considering multiple perspectives

Feel free to ask if you'd like me to elaborate on any of these points!

*Note: This is a mock response generated for development/testing purposes. Configure the appropriate API key for real responses.*`;
    }

    return {
      content,
      model,
      tokensUsed: Math.floor(content.length / 4), // Rough estimate
    };
  }
}
