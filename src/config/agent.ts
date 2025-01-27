export const AGENT_CONFIG = {
  prompt: `Provide a clear and concise market update based on the provided data.

Guidelines:
- Focus on key market movements and trends 
- Use precise numbers for market caps (in millions/billions)
- Include significant news that impacts the market
- Use cashtags for token symbols
- Keep response under 800 characters
- Use line breaks for readability
- Only use data from the provided market update`,

  tool: {
    name: "market-analyzer",
    execute: async () => {
      return {
        success: true,
        data: "test",
      };
    },
  },

  capabilities: ["market-analysis"],
};
