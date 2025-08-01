import { Message, ImageGenerationResult, ImageGenerationCheck } from '../types';
import { handleCompletionCustomPrompt } from './llmHandler';
import { IMAGE_CONFIG, API_RESPONSES, PROMPTS } from '../constants';

/**
 * Image Handler for AI to NFT Workshop
 * Handles image generation requests through Theta EdgeCloud API
 * Provides image generation detection and actual image creation functionality
 */

/**
 * Validates required environment variables for image generation
 * @throws {Error} If required environment variables are missing
 */
function validateImageConfig(): void {
  if (!IMAGE_CONFIG.API_TOKEN) {
    throw new Error(API_RESPONSES.ERRORS.IMAGE_API_TOKEN_MISSING);
  }
}

/**
 * Cleans and parses LLM response for image generation check
 * Handles escaped characters and formatting issues from LLM output
 * @param rawOutput - Raw output from LLM
 * @returns Cleaned and parsed JSON string
 */
function cleanLLMOutput(rawOutput: string): string {
  return rawOutput
    .replace(/\\n/g, '')      // Remove escaped newlines
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
    .trim();                  // Remove leading/trailing whitespace
}

/**
 * Attempts to extract JSON from LLM response with multiple strategies
 * @param response - Raw LLM response
 * @returns Parsed JSON object or null if parsing fails
 */
function tryParseImageGenerationResponse(response: string): ImageGenerationCheck | null {
  // Strategy 1: Try to parse the cleaned response directly
  try {
    const cleaned = cleanLLMOutput(response);
    return JSON.parse(cleaned);
  } catch (error) {
    // Continue to next strategy
  }

  // Strategy 2: Look for JSON-like content in the response
  try {
    const jsonMatch = response.match(/\{[^}]*"generate"[^}]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    // Continue to next strategy
  }

  // Strategy 3: Look for boolean indicators in the text
  const lowerResponse = response.toLowerCase();
  
  // Check for positive indicators
  const positiveIndicators = [
    'generate', 'create', 'make', 'draw', 'image', 'picture', 'yes', 'true'
  ];
  
  const hasPositiveIndicator = positiveIndicators.some(indicator => 
    lowerResponse.includes(indicator)
  );

  if (hasPositiveIndicator) {
    // Try to extract a prompt from the response
    const promptMatch = response.match(/prompt[:\s]+["']?([^"'\n.!?]+)["']?/i);
    const extractedPrompt = promptMatch ? promptMatch[1].trim() : '';

    if (extractedPrompt === '') {
      return {
        generate: false
      };
    }
    
    return {
      generate: true,
      prompt: extractedPrompt
    };
  }

  // Default to no generation
  return {
    generate: false
  };
}

/**
 * Generates a random seed for image generation
 * @returns Random seed as string
 */
function generateRandomSeed(): string {
  return Math.floor(Math.random() * 1000000000000).toString();
}

/**
 * Waits for a specified amount of time
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if the user is requesting image generation using AI
 * Analyzes the conversation context to determine intent
 * @param messages - Array of conversation messages
 * @returns Promise resolving to image generation result
 */
export async function handleGernarateImageCheck(messages: Message[]): Promise<ImageGenerationResult> {
  try {
    // Use LLM to determine if user wants image generation
    const response = await handleCompletionCustomPrompt(messages, PROMPTS.IMAGE_GENERATION_CHECK);
    
    // Try to parse the response with multiple fallback strategies
    const parsedResponse = tryParseImageGenerationResponse(response.output.message);
    
    if (!parsedResponse) {
      console.warn('Could not parse LLM response for image generation check:', response.output.message);
      return {
        image: null,
        prompt: null,
      };
    }
    
    if (parsedResponse.generate && parsedResponse.prompt) {
      console.log('Generating image with prompt:', parsedResponse.prompt);
      // Generate the actual image
      const imageUrl = await generateImage(parsedResponse.prompt);
      return {
        image: imageUrl,
        prompt: parsedResponse.prompt,
      };
    }
  } catch (error) {
    console.error('Error in image generation check:', error);
    // Continue execution, return no image generation
  }
  
  return {
    image: null,
    prompt: null,
  };
}

/**
 * Generates an image using Theta EdgeCloud Flux API
 * Handles the complete workflow: submission, polling, and result retrieval
 * @param prompt - Text prompt for image generation
 * @returns Promise resolving to the generated image URL
 * @throws {Error} If image generation fails or times out
 */
export async function generateImage(prompt: string): Promise<string> {
  validateImageConfig();

  try {
    // Step 1: Submit the image generation request
    const requestId = await submitImageGenerationRequest(prompt);
    
    // Step 2: Poll for the result
    const imageUrl = await pollForImageResult(requestId);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate image: ${errorMessage}`);
  }
}

/**
 * Submits an image generation request to the Theta EdgeCloud API
 * @param prompt - Text prompt for image generation
 * @returns Promise resolving to the request ID
 * @throws {Error} If submission fails
 */
async function submitImageGenerationRequest(prompt: string): Promise<string> {
  try {
    // TODO: Replace this hardcoded response with actual EdgeCloud API call
    // REMOVE the return statement below and implement the fetch request
    return '1234567890';

    // STEP 1: Implement the fetch request to Flux.1-schnell endpoint


    // STEP 2: Uncomment the error checking
    // if (!response.ok) {
    //   throw new Error(`Failed to submit image generation request: ${response.status} ${response.statusText}`);
    // }

    // STEP 3: Uncomment the response parsing
    // const submitJson = await response.json();
    
    // STEP 4: Uncomment the request ID extraction
    // const inferRequest = submitJson.body?.infer_requests?.[0];
    // if (!inferRequest?.id) {
    //   throw new Error('No request ID received from image generation API');
    // }
    
    // return inferRequest.id;
  } catch (error) {
    console.error('Error submitting image generation request:', error);
    throw error;
  }
}

/**
 * Checks the status of an image generation request
 * @param requestId - ID of the image generation request
 * @returns Promise resolving to the status information
 * @throws {Error} If status check fails
 */
async function checkGenerationStatus(requestId: string): Promise<{ state: string; output?: { image_url: string }; error_message?: string }> {
  const statusUrl = `${IMAGE_CONFIG.STATUS_URL_BASE}/${requestId}`;
  const statusResponse = await fetch(statusUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${IMAGE_CONFIG.API_TOKEN}`
    }
  });

  if (!statusResponse.ok) {
    throw new Error(`Status check failed: ${statusResponse.status}`);
  }

  const statusJson = await statusResponse.json();
  const statusInferRequest = statusJson.body?.infer_requests?.[0];
  
  if (!statusInferRequest) {
    throw new Error('No infer request found in status response');
  }
  
  return statusInferRequest;
}

/**
 * Polls for image generation results until completion or timeout
 * @param requestId - ID of the image generation request
 * @returns Promise resolving to the generated image URL
 * @throws {Error} If polling fails, times out, or generation fails
 */
async function pollForImageResult(requestId: string): Promise<string> {
  for (let attempt = 0; attempt < IMAGE_CONFIG.MAX_ATTEMPTS; attempt++) {
    await sleep(IMAGE_CONFIG.POLL_INTERVAL);
    
    const status = await checkGenerationStatus(requestId);
    
    if (status.state === 'success') {
      if (!status.output?.image_url) {
        throw new Error('Image generation completed but no image URL found');
      }
      return status.output.image_url;
    } else if (status.state === 'failed') {
      throw new Error(`Image generation failed: ${status.error_message || 'Unknown error'}`);
    }
    // Otherwise: still processing, continue polling...
  }
  
  throw new Error('Image generation timed out');
}