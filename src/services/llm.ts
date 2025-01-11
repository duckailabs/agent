import OpenAI from "openai";
import { Logger } from "../utils/logger";

export class LLMService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateResponse(
    systemPrompt: string,
    content: string
  ): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response generated");
      }

      return response;
    } catch (error) {
      Logger.error("LLMService", "Error generating response", { error });
      throw error;
    }
  }
}
