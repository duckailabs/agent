import axios from "axios";

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface MarketUpdateData {
  timestamp: string;
  interval: string;
  marketAnalysis: {
    summary: string;
    sentiment: string;
    keyTopics: string[];
    marketImpact: string;
    mentionedCoins: string[];
    metrics: any[];
  }[];
}

interface FatduckConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

const config: FatduckConfig = {
  baseUrl: process.env.FATDUCK_API_URL!,
  apiKey: process.env.FATDUCK_API_KEY!,
  timeout: 30000,
};

if (!config.baseUrl || !config.apiKey) {
  throw new Error(
    "FATDUCK_API_URL and FATDUCK_API_KEY environment variables are required"
  );
}

const createClient = () => {
  return axios.create({
    baseURL: config.baseUrl.replace(/\/$/, ""),
    timeout: config.timeout || 30000,
    headers: {
      "Content-Type": "application/json",
      "X-Fatduckai-Key": config.apiKey,
    },
  });
};

export const getMarketUpdate = async (
  interval: string = "24hr"
): Promise<MarketUpdateData> => {
  try {
    const client = createClient();
    const { data: response } = await client.get<ApiResponse<MarketUpdateData>>(
      "/api/marketUpdate",
      {
        params: { interval },
      }
    );

    if (!response.success) {
      throw new Error(
        response.error.message || "Unknown error from FatDuck API"
      );
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error?.message ||
          error.message ||
          "Failed to connect to FatDuck API"
      );
    }
    throw error;
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    const client = createClient();
    const { data: response } = await client.get("/health");
    return response.success;
  } catch (error) {
    console.error("FatDuck API health check failed:", error);
    return false;
  }
};
