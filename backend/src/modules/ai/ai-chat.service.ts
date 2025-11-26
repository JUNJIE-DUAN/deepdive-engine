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
   * Extract URLs from text content
   */
  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Fetch content from a URL and extract text
   * Used to provide context to AI models that can't access URLs directly
   */
  private async fetchUrlContent(url: string): Promise<string | null> {
    try {
      this.logger.log(`Fetching URL content: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          responseType: "text",
        }),
      );

      const html = response.data;

      // Extract text content from HTML (simple extraction)
      // Remove scripts, styles, and HTML tags
      let text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();

      // Limit content length to avoid token limits
      const maxLength = 8000;
      if (text.length > maxLength) {
        text = text.substring(0, maxLength) + "... [内容已截断]";
      }

      this.logger.log(`Fetched ${text.length} characters from ${url}`);
      return text;
    } catch (error) {
      this.logger.error(`Failed to fetch URL ${url}: ${error}`);
      return null;
    }
  }

  /**
   * Process messages to fetch URL content and augment context
   */
  private async augmentMessagesWithUrlContent(
    messages: ChatMessage[],
  ): Promise<ChatMessage[]> {
    const augmentedMessages: ChatMessage[] = [];

    for (const message of messages) {
      if (message.role === "user") {
        const urls = this.extractUrls(message.content);
        if (urls.length > 0) {
          let augmentedContent = message.content;

          // Fetch content from each URL (limit to first 2 URLs)
          const urlsToFetch = urls.slice(0, 2);
          const fetchedContents: string[] = [];

          for (const url of urlsToFetch) {
            const content = await this.fetchUrlContent(url);
            if (content) {
              fetchedContents.push(`\n\n--- 网页内容 (${url}) ---\n${content}`);
            }
          }

          if (fetchedContents.length > 0) {
            augmentedContent += fetchedContents.join("\n");
            this.logger.log(
              `Augmented message with content from ${fetchedContents.length} URL(s)`,
            );
          }

          augmentedMessages.push({
            ...message,
            content: augmentedContent,
          });
        } else {
          augmentedMessages.push(message);
        }
      } else {
        augmentedMessages.push(message);
      }
    }

    return augmentedMessages;
  }

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
          // Use max_completion_tokens for newer models (gpt-4o, gpt-5, o1, o3)
          const effectiveOpenAIModel = modelId || "gpt-4";
          const isNewerOpenAIModel =
            effectiveOpenAIModel.includes("gpt-5") ||
            effectiveOpenAIModel.includes("gpt-4o") ||
            effectiveOpenAIModel.startsWith("o1") ||
            effectiveOpenAIModel.startsWith("o3");
          const openAITokenParam = isNewerOpenAIModel
            ? { max_completion_tokens: 50 }
            : { max_tokens: 50 };

          response = await firstValueFrom(
            this.httpService.post(
              apiEndpoint || "https://api.openai.com/v1/chat/completions",
              {
                model: effectiveOpenAIModel,
                messages: testMessages,
                ...openAITokenParam,
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

          // Build full Gemini endpoint URL
          // Database stores base URL like: https://generativelanguage.googleapis.com/v1beta/models
          // We need: https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent
          const effectiveGeminiModel = modelId || "gemini-pro";
          let geminiEndpoint: string;
          if (apiEndpoint && apiEndpoint.includes(":generateContent")) {
            // Already a full URL
            geminiEndpoint = apiEndpoint;
          } else {
            // Construct full URL from base
            const baseUrl =
              apiEndpoint?.replace(/\/$/, "") ||
              "https://generativelanguage.googleapis.com/v1beta/models";
            geminiEndpoint = `${baseUrl}/${effectiveGeminiModel}:generateContent`;
          }

          this.logger.log(`Testing Gemini API: ${geminiEndpoint}`);

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
      `Generating chat completion with key for provider: ${provider}, model: ${modelId}, apiKeyLength: ${apiKey?.length || 0}, endpoint: ${apiEndpoint}`,
    );

    if (!apiKey) {
      this.logger.warn(`No API key provided for ${provider}, returning mock`);
      return this.getMockResponse(modelId, messages);
    }

    this.logger.log(
      `API key confirmed for ${provider}: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
    );

    // Augment messages with URL content for all AI providers
    // This enables AI models to "access" URLs by fetching content server-side
    const augmentedMessages =
      await this.augmentMessagesWithUrlContent(messages);

    // Build full messages with system prompt
    const fullMessages: ChatMessage[] = [];
    if (systemPrompt) {
      fullMessages.push({ role: "system", content: systemPrompt });
    }
    fullMessages.push(...augmentedMessages);

    try {
      switch (provider.toLowerCase()) {
        case "xai":
        case "grok":
          // Enable live X/Twitter search for Grok
          // Uses search_parameters.mode = "auto" to let Grok decide when to search
          // Grok can search real-time X posts, news, and web content
          return await this.callApiWithKey(
            apiEndpoint || "https://api.x.ai/v1/chat/completions",
            {
              model: modelId || "grok-3-latest",
              messages: fullMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              max_tokens: maxTokens,
              temperature,
              // Enable live search from X/Twitter and web
              search_parameters: {
                mode: "auto", // "auto" = search when needed, "on" = always search
                return_citations: true, // Return source citations
              },
            },
            { Authorization: `Bearer ${apiKey}` },
            "grok",
          );

        case "openai":
        case "gpt":
          // Check if user is requesting image generation
          const lastUserMsg = fullMessages
            .filter((m) => m.role === "user")
            .pop();
          const userText = lastUserMsg?.content?.toLowerCase() || "";
          if (this.isImageGenerationRequest(userText)) {
            this.logger.log(
              "Image generation request detected, using DALL-E 3",
            );
            return await this.callDallE3(apiKey, lastUserMsg?.content || "");
          }
          // Use max_completion_tokens for newer models (gpt-4o, gpt-5, o1, o3, etc.)
          // and max_tokens for older models (gpt-4-turbo, gpt-3.5-turbo)
          const effectiveModelId = modelId || "gpt-4-turbo-preview";
          const isNewModel =
            effectiveModelId.includes("gpt-5") ||
            effectiveModelId.includes("gpt-4o") ||
            effectiveModelId.startsWith("o1") ||
            effectiveModelId.startsWith("o3");
          const tokenParam = isNewModel
            ? { max_completion_tokens: maxTokens }
            : { max_tokens: maxTokens };

          return await this.callApiWithKey(
            apiEndpoint || "https://api.openai.com/v1/chat/completions",
            {
              model: effectiveModelId,
              messages: fullMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              ...tokenParam,
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
      const errorDetails =
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              response: (error as any).response?.data,
              status: (error as any).response?.status,
            }
          : error;
      this.logger.error(
        `API call failed for ${provider}: ${JSON.stringify(errorDetails)}`,
      );
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
    this.logger.log(
      `[${modelName}] Calling API: ${url.replace(/Bearer\s+\S+/, "Bearer ***")}`,
    );
    this.logger.log(`[${modelName}] Request body model: ${body.model}`);

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
    const content = data.choices?.[0]?.message?.content;

    // Log response details for debugging
    this.logger.log(`[${modelName}] Response status: ${response.status}`);
    this.logger.log(
      `[${modelName}] Response has choices: ${!!data.choices}, length: ${data.choices?.length || 0}`,
    );
    if (data.choices?.[0]) {
      this.logger.log(
        `[${modelName}] Choice finish_reason: ${data.choices[0].finish_reason}`,
      );
      this.logger.log(
        `[${modelName}] Message content length: ${content?.length || 0}`,
      );
    }
    if (data.error) {
      this.logger.error(
        `[${modelName}] API returned error: ${JSON.stringify(data.error)}`,
      );
    }

    if (!content) {
      this.logger.warn(
        `[${modelName}] API returned empty content, full response: ${JSON.stringify(data).substring(0, 500)}`,
      );
    }

    return {
      content:
        content || `[${modelName}] No response content received from API.`,
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
   * Supports both text and image generation
   */
  private async callGeminiApiWithKey(
    apiKey: string,
    modelId: string,
    _apiEndpoint: string | undefined, // Reserved for future use
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
  ): Promise<ChatCompletionResult> {
    // Check if user is requesting image generation
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    const userContent = lastUserMessage?.content?.toLowerCase() || "";
    const isImageRequest = this.isImageGenerationRequest(userContent);

    // Check if the configured model is Imagen (dedicated image generation)
    const isImagenModel = modelId.toLowerCase().includes("imagen");

    // If using Imagen model for image generation, use dedicated Imagen API
    if (isImageRequest && isImagenModel) {
      this.logger.log(`Using Imagen model for image generation: ${modelId}`);
      return await this.callImagenApi(
        apiKey,
        modelId,
        lastUserMessage?.content || "",
      );
    }

    // For text or non-Imagen image requests, use Gemini API
    // IMPORTANT: For image generation, ALWAYS use gemini-2.0-flash-exp as it's the only
    // model that supports native image generation with responseModalities: ["TEXT", "IMAGE"]
    // Other models like "gemini-3-pro-image-preview" are "thinking" models that require
    // special thought_signature format and don't support direct image generation.
    let effectiveModelId: string;
    if (isImageRequest) {
      // For image generation, always use the model that supports it
      effectiveModelId = "gemini-2.0-flash-exp";
      this.logger.log(
        `Image generation requested - using ${effectiveModelId} (configured: ${modelId})`,
      );
    } else {
      // For text, use configured model or fallback
      // But avoid "preview" or experimental models that might have special requirements
      const isExperimentalModel =
        modelId.includes("preview") ||
        modelId.includes("thinking") ||
        modelId.includes("gemini-3");
      if (isExperimentalModel) {
        effectiveModelId = "gemini-2.0-flash";
        this.logger.warn(
          `Model ${modelId} may have special requirements, falling back to ${effectiveModelId}`,
        );
      } else {
        effectiveModelId = modelId.includes("gemini")
          ? modelId
          : "gemini-2.0-flash";
      }
    }

    // Build the correct Gemini API URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModelId}:generateContent?key=${apiKey}`;

    this.logger.log(
      `Calling Gemini API: ${url.replace(apiKey, "***")}, imageRequest=${isImageRequest}`,
    );

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

    // Enable image generation if requested
    if (isImageRequest) {
      requestBody.generationConfig.responseModalities = ["TEXT", "IMAGE"];
      this.logger.log("Image generation enabled for this request");
      // Note: systemInstruction is not supported with image generation in gemini-2.0-flash-exp
    } else {
      // Enable Google Search Grounding for text-only responses
      requestBody.tools = [
        {
          googleSearch: {},
        },
      ];

      // Only add system instruction for non-image requests
      if (systemMessage) {
        requestBody.systemInstruction = {
          parts: [{ text: systemMessage.content }],
        };
      }
    }

    const response = await firstValueFrom(
      this.httpService.post(url, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000, // Longer timeout for image generation
      }),
    );

    const data = response.data;

    // Log response details for debugging
    this.logger.log(`[Gemini] Response status: ${response.status}`);
    this.logger.log(
      `[Gemini] Has candidates: ${!!data.candidates}, length: ${data.candidates?.length || 0}`,
    );

    if (data.candidates?.[0]) {
      const candidate = data.candidates[0];
      this.logger.log(
        `[Gemini] Candidate finishReason: ${candidate.finishReason}`,
      );
      this.logger.log(
        `[Gemini] Has content: ${!!candidate.content}, parts: ${candidate.content?.parts?.length || 0}`,
      );

      // Check for safety ratings that might block response
      if (candidate.safetyRatings) {
        const blocked = candidate.safetyRatings.filter(
          (r: any) => r.probability === "HIGH" || r.blocked,
        );
        if (blocked.length > 0) {
          this.logger.warn(
            `[Gemini] Safety blocked: ${JSON.stringify(blocked)}`,
          );
        }
      }
    }

    if (data.promptFeedback?.blockReason) {
      this.logger.error(
        `[Gemini] Prompt blocked: ${data.promptFeedback.blockReason}`,
      );
      return {
        content: `Response blocked by Gemini safety filters: ${data.promptFeedback.blockReason}`,
        model: "gemini",
        tokensUsed: 0,
      };
    }

    // Process response - handle both text and image parts
    const parts = data.candidates?.[0]?.content?.parts || [];
    let textContent = "";
    const images: string[] = [];

    for (const part of parts) {
      if (part.text) {
        textContent += part.text;
      }
      if (part.inlineData) {
        // Image data is returned as base64
        const mimeType = part.inlineData.mimeType || "image/png";
        const base64Data = part.inlineData.data;
        const imageMarkdown = `![Generated Image](data:${mimeType};base64,${base64Data})`;
        images.push(imageMarkdown);
      }
    }

    // Combine text and images in the response
    let finalContent = textContent;
    if (images.length > 0) {
      finalContent =
        images.join("\n\n") + (textContent ? "\n\n" + textContent : "");
      this.logger.log(`[Gemini] Generated ${images.length} image(s)`);
    }

    if (!finalContent) {
      this.logger.warn(
        `[Gemini] Empty response, full data: ${JSON.stringify(data).substring(0, 500)}`,
      );
    }

    return {
      content:
        finalContent || "[Gemini] No response content received from API.",
      model: "gemini",
      tokensUsed:
        (data.usageMetadata?.promptTokenCount || 0) +
        (data.usageMetadata?.candidatesTokenCount || 0),
    };
  }

  /**
   * Check if the user message is requesting image generation
   */
  private isImageGenerationRequest(content: string): boolean {
    const imageKeywords = [
      // Chinese
      "生成图",
      "画图",
      "画一",
      "画个",
      "画张",
      "创建图",
      "制作图",
      "生成一张",
      "生成一个图",
      "帮我画",
      "给我画",
      "图片",
      "图像",
      "插图",
      "绘制",
      "设计图",
      "信息图",
      "流程图",
      "示意图",
      // English
      "generate image",
      "create image",
      "draw",
      "make image",
      "generate picture",
      "create picture",
      "illustration",
      "infographic",
      "diagram",
      "visualize",
      "picture of",
      "image of",
    ];

    const lowerContent = content.toLowerCase();
    return imageKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  /**
   * Call OpenAI DALL-E 3 API for image generation
   * DALL-E 3 produces the best infographics and diagrams
   */
  private async callDallE3(
    apiKey: string,
    prompt: string,
  ): Promise<ChatCompletionResult> {
    const url = "https://api.openai.com/v1/images/generations";

    this.logger.log(`Calling DALL-E 3 API for image generation`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            response_format: "b64_json",
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 120000, // 2 minutes for image generation
          },
        ),
      );

      const data = response.data;
      const imageData = data.data?.[0];

      if (imageData?.b64_json) {
        const imageMarkdown = `![Generated Image](data:image/png;base64,${imageData.b64_json})`;
        const revisedPrompt = imageData.revised_prompt
          ? `\n\n*Prompt used: ${imageData.revised_prompt}*`
          : "";

        this.logger.log("DALL-E 3 image generated successfully");

        return {
          content: imageMarkdown + revisedPrompt,
          model: "dall-e-3",
          tokensUsed: 0,
        };
      } else if (imageData?.url) {
        // Fallback to URL if b64_json not available
        const imageMarkdown = `![Generated Image](${imageData.url})`;
        return {
          content: imageMarkdown,
          model: "dall-e-3",
          tokensUsed: 0,
        };
      }

      throw new Error("No image data in response");
    } catch (error: any) {
      this.logger.error(
        `DALL-E 3 API error: ${error.response?.data?.error?.message || error.message}`,
      );

      // Return helpful error message instead of mock
      return {
        content: `抱歉，图像生成失败: ${error.response?.data?.error?.message || error.message}\n\n请检查 OpenAI API Key 是否有 DALL-E 3 的访问权限。`,
        model: "dall-e-3",
        tokensUsed: 0,
      };
    }
  }

  /**
   * Call Google Imagen API for image generation
   * Imagen 3 produces high-quality images
   */
  private async callImagenApi(
    apiKey: string,
    modelId: string,
    prompt: string,
  ): Promise<ChatCompletionResult> {
    // Determine the correct Imagen model name
    // Common Imagen models: imagen-3.0-generate-001, imagen-3.0-fast-generate-001
    const imagenModel = modelId.includes("imagen")
      ? modelId
      : "imagen-3.0-generate-001";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${imagenModel}:generateImages?key=${apiKey}`;

    this.logger.log(`[Imagen] Calling API: ${url.replace(apiKey, "***")}`);
    this.logger.log(
      `[Imagen] Model: ${imagenModel}, Prompt length: ${prompt.length}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            prompt: prompt,
            config: {
              numberOfImages: 1,
              aspectRatio: "1:1",
              outputMimeType: "image/png",
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 120000, // 2 minutes for image generation
          },
        ),
      );

      const data = response.data;
      this.logger.log(
        `[Imagen] Response received, has images: ${!!data.generatedImages}`,
      );

      if (data.generatedImages && data.generatedImages.length > 0) {
        const images = data.generatedImages
          .map((img: any, index: number) => {
            if (img.image?.imageBytes) {
              return `![Generated Image ${index + 1}](data:image/png;base64,${img.image.imageBytes})`;
            }
            return null;
          })
          .filter(Boolean);

        if (images.length > 0) {
          this.logger.log(
            `[Imagen] Successfully generated ${images.length} image(s)`,
          );
          return {
            content: images.join("\n\n"),
            model: imagenModel,
            tokensUsed: 0,
          };
        }
      }

      // If no images, log the response structure
      this.logger.warn(
        `[Imagen] No images in response: ${JSON.stringify(data).substring(0, 500)}`,
      );
      throw new Error("No images generated");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      this.logger.error(`[Imagen] API error: ${errorMsg}`);
      this.logger.error(
        `[Imagen] Full error: ${JSON.stringify(error.response?.data || {}).substring(0, 500)}`,
      );

      return {
        content: `抱歉，Imagen 图像生成失败: ${errorMsg}\n\n请确认:\n1. Google API Key 具有 Imagen API 访问权限\n2. 模型 ID 正确 (如 imagen-3.0-generate-001)\n3. Imagen API 已在 Google Cloud 项目中启用`,
        model: imagenModel,
        tokensUsed: 0,
      };
    }
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

  /**
   * Fetch available models from a provider's API
   * Returns list of model IDs and their metadata
   */
  async fetchAvailableModels(
    provider: string,
    apiKey: string,
    _apiEndpoint?: string, // Reserved for future custom endpoint support
  ): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; description?: string }>;
    error?: string;
  }> {
    if (!apiKey) {
      return { success: false, error: "API key is required" };
    }

    try {
      switch (provider.toLowerCase()) {
        case "xai":
        case "grok":
          return await this.fetchXAIModels(apiKey);

        case "openai":
        case "gpt":
          return await this.fetchOpenAIModels(apiKey);

        case "anthropic":
        case "claude":
          return this.getAnthropicModels();

        case "google":
        case "gemini":
          return await this.fetchGeminiModels(apiKey);

        default:
          return { success: false, error: `Unknown provider: ${provider}` };
      }
    } catch (error: any) {
      this.logger.error(`Failed to fetch models for ${provider}: ${error}`);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Unknown error";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Fetch models from xAI API
   */
  private async fetchXAIModels(apiKey: string) {
    const response = await firstValueFrom(
      this.httpService.get("https://api.x.ai/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }),
    );

    const models = response.data?.data || [];
    return {
      success: true,
      models: models.map((m: any) => ({
        id: m.id,
        name: m.id,
        description: m.description || `xAI ${m.id}`,
      })),
    };
  }

  /**
   * Fetch models from OpenAI API
   */
  private async fetchOpenAIModels(apiKey: string) {
    const response = await firstValueFrom(
      this.httpService.get("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }),
    );

    const models = response.data?.data || [];
    // Filter to show only chat models (gpt-*)
    const chatModels = models
      .filter(
        (m: any) =>
          m.id.startsWith("gpt-") ||
          m.id.startsWith("o1") ||
          m.id.startsWith("o3"),
      )
      .sort((a: any, b: any) => b.created - a.created);

    return {
      success: true,
      models: chatModels.map((m: any) => ({
        id: m.id,
        name: m.id,
        description: `OpenAI ${m.id}`,
      })),
    };
  }

  /**
   * Get Anthropic models (no public list API, return known models)
   */
  private getAnthropicModels() {
    // Anthropic doesn't have a public models list API
    // Return known production models
    const models = [
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        description: "Most intelligent model, best for complex tasks",
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "Best balance of intelligence and speed",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        description: "Fastest model, good for simple tasks",
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "Previous flagship model",
      },
    ];

    return { success: true, models };
  }

  /**
   * Fetch models from Google Gemini API
   */
  private async fetchGeminiModels(apiKey: string) {
    const response = await firstValueFrom(
      this.httpService.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          timeout: 30000,
        },
      ),
    );

    const models = response.data?.models || [];
    // Filter to relevant models
    const relevantModels = models.filter(
      (m: any) =>
        m.name.includes("gemini") &&
        m.supportedGenerationMethods?.includes("generateContent"),
    );

    return {
      success: true,
      models: relevantModels.map((m: any) => ({
        id: m.name.replace("models/", ""),
        name: m.displayName || m.name.replace("models/", ""),
        description: m.description || `Google ${m.displayName}`,
      })),
    };
  }
}
