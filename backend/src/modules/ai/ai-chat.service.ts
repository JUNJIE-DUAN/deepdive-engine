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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    try {
      // Convert messages to Gemini format
      const systemMessage = messages.find((m) => m.role === "system");
      const otherMessages = messages.filter((m) => m.role !== "system");

      const contents = otherMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Prepend system message to first user message
      if (systemMessage && contents.length > 0) {
        contents[0].parts.unshift({
          text: `[System Instructions: ${systemMessage.content}]\n\n`,
        });
      }

      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          {
            contents,
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const data = response.data;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return {
        content,
        model: "gemini",
        tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      };
    } catch (error) {
      this.logger.error(`Gemini API error: ${error}`);
      return this.getMockResponse("gemini", messages);
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
}
