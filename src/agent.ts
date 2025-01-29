import OpenAI from "openai";
import { Logger } from "./utils/logger";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processMessage(content: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content }],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content || "No response generated";
  } catch (error) {
    Logger.error("llm", "Failed to process message with OpenAI", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "Sorry, I encountered an error processing your message.";
  }
}
