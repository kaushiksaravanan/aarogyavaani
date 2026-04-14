# AarogyaVaani — Vapi Assistant Setup Guide

Complete step-by-step instructions to get AarogyaVaani running on Vapi.

---

## Prerequisites

- A deployed backend server with the `/vapi/webhook` endpoint live (see `../backend/` for deployment instructions)
- Your backend server URL (e.g., `https://your-app.onrender.com`)

---

## Step 1: Create a Vapi Account

1. Go to [https://vapi.ai](https://vapi.ai)
2. Click **Sign Up** and create an account (Google or email)
3. Once in the dashboard, go to **Settings > Billing**
4. Enter promo code **`vapixhackblr`** to receive **$30 in free credits**
5. Note your **API Key** from **Settings > API Keys** — you will need it for programmatic setup

---

## Step 2: Create the Assistant via Dashboard

### Option A: Dashboard (Recommended for first-time setup)

1. In the Vapi dashboard, click **Assistants** in the left sidebar
2. Click **+ Create Assistant**
3. Give it the name: **AarogyaVaani**
4. Under **Model**, select:
   - Provider: **OpenAI**
   - Model: **gpt-4o**
   - Temperature: **0.3**
   - Max Tokens: **1024**
5. Paste the full system prompt from `assistant_config.json` → `model.messages[0].content` into the **System Prompt** field
6. Click **Save**

### Option B: API (Programmatic)

```bash
# Replace YOUR_API_KEY and SERVER_URL before running
# On Linux/Mac, use sed or envsubst to replace {{SERVER_URL}}

export VAPI_API_KEY="your-api-key-here"
export SERVER_URL="https://your-backend.onrender.com"

# First, replace the placeholder in the config
sed "s|{{SERVER_URL}}|$SERVER_URL|g" assistant_config.json > assistant_config_final.json

# Create the assistant
curl -X POST https://api.vapi.ai/assistant \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @assistant_config_final.json
```

The response will contain the assistant ID — save it.

---

## Step 3: Add Tools (Function Calling)

### Via Dashboard

1. Open your **AarogyaVaani** assistant in the dashboard
2. Scroll down to the **Tools** section
3. Click **+ Add Tool** and select **Function**
4. For the first tool:
   - Name: `query_health_knowledge`
   - Description: `Search the health knowledge base and user's personal history for relevant medical and scheme information.`
   - Server URL: `https://your-backend-url.com/vapi/webhook`
   - Parameters: Copy the schema from `tool_schemas.json` (the first tool's `parameters` object)
5. For the second tool:
   - Name: `save_conversation_summary`
   - Description: `Save a summary of this conversation for future reference. Call this when the conversation is ending.`
   - Server URL: `https://your-backend-url.com/vapi/webhook`
   - Parameters: Copy the schema from `tool_schemas.json` (the second tool's `parameters` object)
6. Click **Save**

### Important

- The server URL must point to your **deployed** backend, not localhost
- Both tools use the same webhook endpoint — the backend differentiates by `function_name` in the request body
- Make sure your backend is running and responding before testing

---

## Step 4: Configure Voice Settings

1. In the assistant settings, go to the **Voice** section
2. Select provider: **ElevenLabs**
3. Voice ID: `pFZP5JQG7iQjIQuC4Bku` (Lily — warm, female, clear voice)
4. Set **Stability**: `0.6` (slight natural variation)
5. Set **Similarity Boost**: `0.8` (close to original voice)

### Voice Recommendations for Indian Languages

| Setting | Recommended Value | Why |
|---------|-------------------|-----|
| Stability | 0.5 - 0.6 | Lower stability gives more natural intonation for Hindi |
| Similarity Boost | 0.75 - 0.85 | High enough for clarity, not so high it sounds robotic |
| Speed | Default (1.0) | Don't speed up — rural callers need time to process |
| Provider | ElevenLabs | Best multilingual support for Hindi/Kannada |

**Alternative voices to try:**
- `EXAVITQu4vr4xnSDxMaL` (Bella — warm, conversational)
- `pNInz6obpgDQGcFmaJgB` (Adam — if you prefer a male voice)
- For best Hindi, test multiple voices in the Vapi simulator and pick what sounds most natural

---

## Step 5: Configure the Transcriber

1. In the assistant settings, go to the **Transcriber** section
2. Select provider: **Deepgram**
3. Model: **nova-2**
4. Language: **multi** (enables automatic language detection across Hindi, English, Kannada)

> **Note:** The `multi` language setting is critical for AarogyaVaani since callers may speak Hindi, English, Kannada, or mix languages within a single call.

---

## Step 6: Get a Phone Number

### Via Dashboard

1. Go to **Phone Numbers** in the left sidebar
2. Click **+ Buy Number**
3. Select country: **India (+91)** if available, otherwise use a **US number** for testing
4. Assign the number to your **AarogyaVaani** assistant
5. Click **Save**

### Via API

```bash
# Buy a number
curl -X POST https://api.vapi.ai/phone-number \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "vapi",
    "assistantId": "YOUR_ASSISTANT_ID"
  }'
```

### Using Your Own Twilio Number

If you already have a Twilio number:

1. Go to **Phone Numbers > Import**
2. Enter your Twilio Account SID and Auth Token
3. Select the number to import
4. Assign it to AarogyaVaani

---

## Step 7: Testing

### Test 1: Vapi Simulator (Start Here)

1. Open your assistant in the dashboard
2. Click the **phone icon** (bottom-right) or the **Test** button
3. This opens a browser-based call simulator
4. Speak in Hindi: "Mujhe sugar ki bimari ke baare mein jaankari chahiye"
5. Verify:
   - The assistant responds in Hindi
   - It calls the `query_health_knowledge` tool (check logs)
   - The response is warm and informative

### Test 2: Real Phone Call

1. Call the phone number assigned to your assistant
2. Test these scenarios:

| Scenario | What to Say | Expected Behavior |
|----------|------------|-------------------|
| Hindi greeting | "Namaste" | Responds in Hindi, asks how to help |
| Health query | "Mujhe do din se bukhar hai" | Calls knowledge tool, gives advice, says see doctor |
| Scheme info | "Ayushman Bharat card kaise banega?" | Calls knowledge tool, explains eligibility and steps |
| Emergency | "Seene mein bahut dard ho raha hai" | Immediately says call 108, go to hospital |
| English | "I have diabetes" | Switches to English, queries knowledge base |
| Off-topic | "Cricket ka score kya hai?" | Politely redirects to health topics |
| End call | "Bas itna hi tha, dhanyavaad" | Saves summary, says caring goodbye |

### Test 3: Check Webhook Logs

1. In your backend server logs, verify:
   - Tool calls arrive at `/vapi/webhook`
   - The request body contains `message.functionCall.name` and `message.functionCall.parameters`
   - Your server responds with the correct format:
     ```json
     {
       "results": [
         {
           "toolCallId": "...",
           "result": "Your response content here"
         }
       ]
     }
     ```

---

## Step 8: Advanced Configuration

### Adjust Timeouts

In the assistant config:
- `maxDurationSeconds: 900` — 15-minute max call (increase if needed)
- `silenceTimeoutSeconds: 30` — hangs up after 30s silence (increase to 45 for elderly callers)

### Enable End-of-Call Report

In dashboard under **Advanced**:
- Enable **End Call Function** — lets the model decide when to end the call
- Set **End Call Message** — the goodbye message in Hindi

### Set Up Webhook for Call Events (Optional)

You can receive events for call start, end, transcript, etc.:

```bash
curl -X PATCH https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serverUrl": "https://your-backend.onrender.com/vapi/events"
  }'
```

---

## Troubleshooting

### "Tool call failed" or no response from function

- **Check**: Is your backend server running and publicly accessible?
- **Check**: Does `curl https://your-backend.com/vapi/webhook` return a response (even an error)?
- **Check**: Is the server URL in the tool config correct (no trailing slash, https not http)?
- **Fix**: Check your backend logs for incoming requests and errors

### Assistant doesn't speak Hindi / wrong language

- **Check**: Is the transcriber set to `multi` language mode?
- **Check**: Is the system prompt intact (not truncated)?
- **Fix**: In the transcriber settings, explicitly set language to `hi` for Hindi-only mode, or keep `multi` for auto-detect

### Voice sounds robotic or unnatural

- **Fix**: Lower `stability` to 0.4-0.5 for more natural variation
- **Fix**: Try different ElevenLabs voices — some handle Hindi better
- **Fix**: Ensure the system prompt tells the model to use simple, conversational Hindi

### Call drops immediately

- **Check**: Do you have sufficient Vapi credits? (Settings > Billing)
- **Check**: Is the phone number properly assigned to the assistant?
- **Fix**: Test with the simulator first to isolate phone vs. assistant issues

### Latency is too high (slow responses)

- **Fix**: Reduce `maxTokens` to 512 for faster responses
- **Fix**: Ensure your backend server is in a region close to Vapi's servers (US-East)
- **Fix**: Add response caching in your backend for common queries
- **Fix**: Consider using `gpt-4o-mini` for faster (but slightly less accurate) responses

### Knowledge base returns empty results

- **Check**: Have you populated the vector database with health content?
- **Check**: Is the embedding service running?
- **Fix**: Check the `/vapi/webhook` endpoint logs to see what query is being sent

---

## Quick Reference

| Item | Value |
|------|-------|
| Vapi Dashboard | https://dashboard.vapi.ai |
| API Base URL | https://api.vapi.ai |
| Promo Code | `vapixhackblr` ($30 credits) |
| Emergency Number | 108 (ambulance) |
| Mental Health Helpline | iCALL: 9152987821 |
| Transcriber | Deepgram nova-2 (multi) |
| Voice | ElevenLabs `pFZP5JQG7iQjIQuC4Bku` |
| Model | GPT-4o (temp 0.3) |
| Max Call Duration | 15 minutes |
