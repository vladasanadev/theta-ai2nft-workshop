import dotenv from "dotenv";
import { Message, LLMResponse, CleanMessage } from "../types";
import { LLM_CONFIG, API_RESPONSES } from "../constants";

dotenv.config();

/**
 * LLM Handler for AI to NFT Workshop
 * Handles communication with Theta EdgeCloud LLM API
 * Provides standardized completion functions with proper error handling
 */

/**
 * Validates required environment variables for LLM operations
 * @throws {Error} If required environment variables are missing
 */
function validateLLMConfig(): void {
  if (!LLM_CONFIG.URL) {
    throw new Error(API_RESPONSES.ERRORS.LLM_URL_MISSING);
  }

  if (!LLM_CONFIG.API_KEY) {
    throw new Error(API_RESPONSES.ERRORS.ON_DEMAND_API_ACCESS_TOKEN_MISSING);
  }
}

/**
 * Removes NFT data from messages to clean them for LLM processing
 * The LLM doesn't need NFT metadata, only the conversation content
 * @param messages - Array of messages with potential NFT data
 * @returns Array of clean messages without NFT data
 */
function cleanMessagesForLLM(messages: Message[]): CleanMessage[] {
  return messages.map((message) => {
    const { nft, ...cleanMessage } = message;
    return cleanMessage;
  });
}

/**
 * Makes a standardized request to the Theta EdgeCloud LLM API
 * Handles the common request structure and error handling
 * @param messages - Clean messages to send to the LLM
 * @returns Promise resolving to the LLM response
 * @throws {Error} If the API request fails or returns an error
 */
async function makeLLMRequest(messages: CleanMessage[]): Promise<LLMResponse> {
  try {
    // TODO: Replace this hardcoded response with actual EdgeCloud API call
    // REMOVE the return statement below and implement the fetch request
    // return {
    //   output: { message: "Hello, no LLM response is implemented yet" },
    //   input: { messages: messages },
    // };

    // STEP 1: Implement the API request to the LLM on the EdgeCloud here

    // const url = "https://ondemand.thetaedgecloud.com/infer_request/llama_3_1_70b/completions";
    const url = LLM_CONFIG.URL || "";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: "Bearer $ON_DEMAND_API_ACCESS_TOKEN",
        Authorization: `Bearer ${LLM_CONFIG.API_KEY}`,
      },
      body: JSON.stringify({
        input: {
          //   max_tokens: 500,
          max_tokens: LLM_CONFIG.MAX_TOKENS,

          //   messages: [
          //     {
          //       role: "system",
          //       content: "You are a helpfule assistant",
          //     },
          //     {
          //       role: "user",
          //       content: "What is Theta Network",
          //     },
          //   ],
          //   stream: true,
          //   temperature: 0.5,
          //   top_p: 0.7,
          messages: messages,
          stream: false,
          temperature: LLM_CONFIG.TEMPERATURE,
          top_p: LLM_CONFIG.TOP_P,
        },
      }),
    });

    const json = await response.json();

    console.log(json);

    // STEP 2: Uncomment the error checking
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    // STEP 3: Uncomment the response parsing
    // const json = await response.json();

    // STEP 4: Uncomment the return statement
    return {
      output: json.body.infer_requests[0].output,
      input: json.body.infer_requests[0].input,
    };
  } catch (error) {
    console.error("Error calling Theta EdgeCloud API:", error);
    throw error;
  }
}

/**
 * Handles standard completion requests without custom prompts
 * Used for general conversation flow
 * @param messages - Array of conversation messages
 * @returns Promise resolving to LLM completion result
 * @throws {Error} If LLM configuration is invalid or API call fails
 */
export async function handleCompletion(messages: Message[]): Promise<LLMResponse> {
  validateLLMConfig();

  const cleanMessages = cleanMessagesForLLM(messages);
  return await makeLLMRequest(cleanMessages);
}

/**
 * Handles completion requests with custom system prompts
 * Used for specialized tasks like image generation checks or NFT assistance
 * @param messages - Array of conversation messages
 * @param prompt - Custom system prompt to inject
 * @returns Promise resolving to LLM completion result with custom prompt
 * @throws {Error} If LLM configuration is invalid or API call fails
 */
export async function handleCompletionCustomPrompt(messages: Message[], prompt: string): Promise<LLMResponse> {
  validateLLMConfig();

  const cleanMessages = cleanMessagesForLLM(messages);

  // Add custom prompt as a system message at the beginning
  const messagesWithPrompt: CleanMessage[] = [
    {
      role: "system",
      content: prompt,
    },
    ...cleanMessages,
  ];

  return await makeLLMRequest(messagesWithPrompt);
}
