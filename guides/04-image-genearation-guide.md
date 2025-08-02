# 4. Image Generation Guide

Welcome to **Guide 4** of the Theta AI2NFT Workshop! 🎨🤖

In this guide, you'll add powerful image generation capabilities to your AI assistant using Flux.1-schnell through Theta EdgeCloud. You'll learn how to use AI to detect image requests, extract prompts intelligently, and generate stunning artwork that can later become NFTs.

## 🎯 What You'll Accomplish

By the end of this guide, you'll have:
- ✅ **Intelligent Intent Detection** - AI determines when users want images
- ✅ **Flux.1-schnell Integration** - High-quality image generation
- ✅ **Prompt Extraction** - Automatic optimization of user requests

---

## 🧠 Step 1: Understanding the Image Generation Workflow

### **1.1 The Complete Pipeline**

```
User Message → Intent Detection → Prompt Extraction → Image Generation → Display
     ↓              ↓                 ↓                  ↓             ↓
  "Draw me      LLM analyzes       Extracts clean     Flux.1-schnell  Shows image
   a cat"       user intent        prompt: "cat"      generates art   in chat
```

### **1.2 Three-Stage Process**

#### **Stage 1: Intent Detection**
- **Input**: User's conversational message
- **Process**: LLM analyzes if user wants an image
- **Output**: `{ generate: true/false, prompt: "extracted prompt" }`

#### **Stage 2: Image Generation**
- **Input**: Clean, optimized prompt
- **Process**: Flux.1-schnell creates artwork
- **Output**: Image URL

#### **Stage 3: Integration**
- **Input**: Generated image data
- **Process**: Prepare for NFT workflow
- **Output**: Display image

### **1.3 Key Functions Overview**

```javascript
// Main orchestrator in server.ts
const imageData = await handleGernarateImageCheck(body.messages);

// Intent detection in imageHandler.ts
export async function handleGernarateImageCheck(messages) {
  // 1. Ask LLM if user wants image
  // 2. Parse LLM response
  // 3. Generate image if requested
  // 4. Return result
}

// Actual image generation
export async function generateImage(prompt) {
  // 1. Submit to Flux.1-schnell
  // 2. Poll for completion
  // 3. Return image URL
}
```

---

## 🤖 Step 2: Intent Detection with LLM

### **2.1 The Challenge**

Users express image requests in many ways:
- **Direct**: "Generate an image of a sunset"
- **Casual**: "Can you draw me a cat?"
- **Implied**: "I want to see a beautiful landscape"
- **Creative**: "Show me what a robot artist would look like"

We need AI to understand all these variations!

### **2.2 Custom Prompt Engineering**

The system uses this carefully crafted prompt in [`constants.ts`](../backend/src/constants.ts):

```javascript
IMAGE_GENERATION_CHECK: JSON.stringify(`
Your task is to determine whether the user is asking for an image to be generated in his latest message.

If the user is requesting or implying that they want an image (e.g., "draw me", "generate an image", "show me a picture", "can you make an image of..."), return:

{
  "generate": true,
  "prompt": "<short clear prompt to generate the image>"
}

If the message does NOT request or imply image generation, return:

{
  "generate": false
}
`)
```

> 💡 **Advanced Tip - Automatic Styling:** You can modify the prompt to automatically add consistent styling to all generated images! 
>
> **Example:** Change `"prompt": "<short clear prompt to generate the image>"` to:
> - `"prompt": "<short clear prompt to generate the image>, black and white photography style"`
> - `"prompt": "<short clear prompt to generate the image>, watercolor painting style"`  
> - `"prompt": "<short clear prompt to generate the image>, cyberpunk neon aesthetic"`
>
> This way, every image will automatically have your chosen artistic style! 🎨

### **2.3 How Intent Detection Works**

#### **Example 1: Clear Image Request**
```
User: "Can you draw me a majestic dragon?"

LLM Analysis → {"generate": true, "prompt": "majestic dragon"}
Result → Image generated ✅
```

#### **Example 2: Regular Conversation**
```
User: "What's the weather like today?"

LLM Analysis → {"generate": false}
Result → Normal chat response ✅
```

#### **Example 3: Subtle Image Request**
```
User: "I'd love to see a futuristic cityscape"

LLM Analysis → {"generate": true, "prompt": "futuristic cityscape"}
Result → Image generated ✅
```

### **2.4 Robust Response Parsing**

The `tryParseImageGenerationResponse` function handles various LLM response formats:

#### **Strategy 1: Perfect JSON**
```javascript
// LLM returns: {"generate": true, "prompt": "sunset"}
// Parsing: Direct JSON.parse() ✅
```

#### **Strategy 2: JSON with Extra Text**
```javascript
// LLM returns: "Here's the analysis: {"generate": true, "prompt": "cat"}"
// Parsing: Regex extraction ✅
```

#### **Strategy 3: Natural Language**
```javascript
// LLM returns: "Yes, the user wants to generate an image of a dog"
// Parsing: Keyword detection + prompt extraction ✅
```

---

## 🎨 Step 3: Flux.1-schnell Integration

### **3.1 Understanding Flux.1-schnell**

**Flux.1-schnell** is a state-of-the-art text-to-image model that:
- **Fast Generation**: "Schnell" means "fast" in German
- **High Quality**: Professional-grade artwork
- **Versatile**: Handles diverse artistic styles
- **Optimized**: Built for production use

### **3.2 Image Generation Parameters**

The system uses these optimized settings:

```javascript
{
  guidance: 3.5,        // Controls prompt adherence (higher = more literal)
  height: 512,          // Image height in pixels
  width: 512,           // Image width in pixels  
  num_steps: 4,         // Generation steps (4 is optimized for speed)
  seed: "random",       // Ensures unique results each time
}
```

### **3.3 🔧 Your Implementation Challenge: Image Generation**

#### **Step 1: 🔧 Update Chat Endpoint Integration**

**Open [`backend/src/server.ts`](../backend/src/server.ts) and enhance the `/chat` endpoint:**

**Your mission:**
1. **Add image generation check** - Call `handleGernarateImageCheck()` with user messages
2. **Handle image results** - If image is generated, create NFT object and call `handleCompletionWithNFT()`
3. **Include NFT data** - Add NFT data to the response when available
4. **Keep existing logic** - Maintain normal chat flow for non-image requests

**Key integration points:**
- Import: `handleGernarateImageCheck` from `./handlers/imageHandler`
- Import: `handleCompletionWithNFT` from `./handlers/nftHandler` 
- Check: `if (imageData.image)` to determine if image was generated
- Response: Include `nft: { image, prompt }` in successful responses

> 💡 **Tip:** The current endpoint only handles regular chat. You need to add image generation logic that creates NFT data for the frontend!

One way to setup the Chat Endpoint:
```js
app.post('/chat', async (req, res) => {
  try {
    const body: CompletionInput = req.body;

    // Validate request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required' 
      } as APIError);
    }

    // Check if user wants to generate an image
    const imageData = await handleGernarateImageCheck(body.messages);
    let newNFT: NFTInterface | undefined;
    let completionResult;

    if (imageData.image) {
      // Image was generated - create NFT and provide minting assistance
      newNFT = {
        image: imageData.image,
        prompt: imageData.prompt!,
        wallet: body.nft?.wallet || ''
      };

      completionResult = await handleCompletionWithNFT(body.messages, newNFT);
    } else {
      // General conversation
      completionResult = await handleCompletion(body.messages);
    }

    // Prepare response with NFT data if available
    const response: APISuccess = {
      success: true,
      result: {
        output: {
          ...completionResult.output,
          ...(newNFT ? { nft: { image: newNFT.image, prompt: newNFT.prompt } } : {})
        },
        input: completionResult.input
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ 
      error: API_RESPONSES.ERRORS.SERVER_ERROR,
      details: error instanceof Error ? error.message : 'Unknown error'
    } as APIError);
  }
});
```

#### **Step 2: 🔧 Implement Image Generation API**

**Open [`backend/src/handlers/imageHandler.ts`](../backend/src/handlers/imageHandler.ts) and complete the `submitImageGenerationRequest` function:**

**Your mission:**
1. **Remove** the hardcoded return statement  
2. **Implement** the API request to Flux.1-schnell endpoint
3. **Use** the `IMAGE_CONFIG` constants for configuration
4. **Follow** the step-by-step comments in the code

> 💡 **Tip:** Check ThetaEdgeCloud's **Flux.1-schnell** model page → **API tab** → **JavaScript/Node.js** for the exact endpoint URL.
> 
> 🎯 **Your goal:** Successfully submit image requests and return the `request_id` for polling!

#### **Step 3: Poll for Results**
```javascript
async function pollForImageResult(requestId) {
  // Check every 2 seconds for up to 30 attempts (1 minute)
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(2000);
    
    const status = await checkGenerationStatus(requestId);
    
    if (status.state === 'success') {
      return status.output.image_url; // ✅ Image ready!
    } else if (status.state === 'failed') {
      throw new Error('Generation failed'); // ❌ Error
    }
    // Otherwise: still processing, continue polling...
  }
}

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
```

### **3.4 Why Polling is Necessary**

Image generation takes time even so FLUX.1-schnell is pretty fast:
- **Simple prompts**: 1-5 seconds
- **High-quality images**: Worth the wait!

The polling system ensures:
- ✅ **Non-blocking**: Server stays responsive
- ✅ **Reliable**: Handles temporary network issues
- ✅ **User-friendly**: Shows loading states

---

## 🧪 Step 4: Test Your Image Generation

### **4.1 Basic Image Generation Test**

1. **Open Your Frontend** (`http://localhost:3000`)

2. **Try Simple Requests**:
   ```
   "Draw me a cat"
   ```
   
   Expected behavior:
   - You'll see a typing indicator
   - After 3-10 seconds, an image appears
   - The AI responds with context about the image

3. **Try Creative Requests**:
   ```
   "Generate a futuristic robot"
   "Can you show me a beautiful sunset?"
   "I want to see a magical forest"
   ```

### **4.2 Understanding What Happens**

When you send `"Draw me a cat"`:

1. **Frontend → Backend**: Sends message
2. **Backend → EdgeCloud LLM**: "Does user want image?"
3. **LLM Response**: `{"generate": true, "prompt": "cat"}`
4. **Backend → EdgeCloud Flux**: Generate image with "cat"
5. **Flux Processing**: Creates artwork (1-5 seconds)
6. **Backend → Frontend**: Returns image URL
7. **Frontend Display**: Shows generated image

### **4.3 Monitor Backend Logs**

Watch your backend console for:

```bash
# When image generation is triggered:
Generating image with prompt: cat

# During processing (you might see polling attempts):
Status check failed (attempt 3): 202  # Still processing
Status check failed (attempt 5): 202  # Still processing

# When complete:
# No specific success message, but image URL is returned
```

### **4.4 Test Different Prompt Types**

#### **Simple Objects**
```
"Draw a tree"
"Generate a flower"
"Show me a house"
```

#### **Complex Scenes**
```
"Create a cyberpunk cityscape at night"
"Generate a peaceful mountain lake at sunrise"
"Draw a steampunk airship in the clouds"
```

#### **Artistic Styles**
```
"Paint a portrait in watercolor style"
"Create a minimalist geometric design"
"Generate pixel art of a spaceship"
```

---

## 🔍 Step 5: Debugging and Troubleshooting

### **5.1 Common Issues**

#### **No Image Generated**
**Symptoms**: Chat works but no images appear

**Debugging Steps**:
1. Check backend logs for errors
2. Verify `ON_DEMAND_API_ACCESS_TOKEN` in backend `.env`
3. Confirm you have EdgeCloud credits remaining
4. Try simpler prompts like "cat" or "tree"

#### **"Could not parse LLM response" Warnings**
**Symptoms**: Warning messages in backend logs

**This is Normal!** The system has multiple fallback strategies:
- Strategy 1 fails → Try Strategy 2
- Strategy 2 fails → Try Strategy 3
- Strategy 3 always provides a result

#### **Generation Failures**
**Symptoms**: "Failed to generate image" errors

**Common Causes**:
- Invalid/inappropriate prompts
- Network connectivity issues
- EdgeCloud service temporarily unavailable
- Insufficient credits

---

## 🎨 Step 6: Advanced Image Generation

### **Understanding Generation Parameters**

You can modify these in your backend `.env`:

```env
# Image quality vs speed trade-off
IMAGE_NUM_STEPS=4     # Faster (4) vs Higher Quality (8-12)

# Image dimensions (affects generation time)
IMAGE_HEIGHT=512      # Standard: 512, High-res: 1024
IMAGE_WIDTH=512       # Square images work best

# Prompt adherence
IMAGE_GUIDANCE=3.5    # Lower (2): More creative, Higher (7): More literal
```

---

## ✅ Verification Checklist

Before moving to the next guide, ensure:

- [ ] **Chat still works** - Basic conversation functionality intact
- [ ] **Image requests detected** - "Draw me..." triggers generation
- [ ] **Images display properly** - Generated images appear in chat
- [ ] **Non-image requests ignored** - Regular chat doesn't trigger images
- [ ] **Loading states work** - Typing indicators during generation
- [ ] **Error handling** - Graceful failure for invalid requests
- [ ] **Backend logs clean** - No persistent errors or warnings

---

## 🎯 What's Next?

Outstanding work! Your AI assistant now has intelligent image generation capabilities powered by Flux.1-schnell. Users can request images in natural language, and your system intelligently detects intent and creates beautiful artwork.

In the next guide, we'll dive into **Smart Contract Development** where you'll:

- Learn Solidity fundamentals for NFT contracts
- Set up wallet creation and management  
- Deploy your NFT contract to Theta testnet
- Prepare for automated NFT minting

**Ready for blockchain development?** Let's move on to [**Guide 5: Smart Contract Development**](./05-smart-contract-guide.md)!

---

> 💡 **Pro Tip**: Try asking for different artistic styles in your prompts: "cyberpunk", "watercolor", "minimalist", "photorealistic". Flux.1-schnell understands artistic terminology very well!

> 🎨 **Creative Challenge**: Generate a few different images and think about which ones would make great NFTs. In the upcoming guides, you'll be able to mint these as actual blockchain assets!