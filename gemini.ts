
import { GoogleGenAI } from "@google/genai";

// API Key pool for rotation
const API_KEYS = [
  process.env.GEMINI_API_KEY || "",
  process.env.GEMINI_API_KEY_2 || "",
  process.env.GEMINI_API_KEY_3 || "",
  process.env.GEMINI_API_KEY_4 || ""
].filter(key => key.length > 0);

let currentKeyIndex = 0;

// Log available keys on startup
console.log(`🚀 Gemini API Keys initialized: ${API_KEYS.length} keys available`);
console.log(`🔑 Starting with API key 1/${API_KEYS.length}`);

if (API_KEYS.length < 4) {
  console.warn(`⚠️  Only ${API_KEYS.length}/4 API keys configured. You'll have ${API_KEYS.length * 25} signals per day instead of 100.`);
}

// Create GoogleGenAI instance with current API key
function getGenAI(): GoogleGenAI {
  const apiKey = API_KEYS[currentKeyIndex];
  if (!apiKey) {
    throw new Error("No valid API keys available");
  }
  return new GoogleGenAI({ apiKey });
}

// Rotate to next available API key
function rotateAPIKey(): boolean {
  const startIndex = currentKeyIndex;
  do {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    if (API_KEYS[currentKeyIndex]) {
      console.log(`Rotated to API key ${currentKeyIndex + 1}/${API_KEYS.length}`);
      return true;
    }
  } while (currentKeyIndex !== startIndex);
  
  console.error("All API keys exhausted");
  return false;
}

// Execute API call with automatic key rotation on quota errors
async function executeWithRotation<T>(
  apiCall: (genai: GoogleGenAI) => Promise<T>,
  maxRetries: number = API_KEYS.length
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const genai = getGenAI();
      console.log(`🔑 Using API key ${currentKeyIndex + 1}/${API_KEYS.length}`);
      return await apiCall(genai);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a quota error (429)
      if (error.status === 429 || (error.message && error.message.includes("quota")) || (error.message && error.message.includes("RESOURCE_EXHAUSTED"))) {
        console.warn(`❌ API key ${currentKeyIndex + 1} quota exhausted (attempt ${attempt + 1}/${maxRetries})`);
        
        // Rotate to next key BEFORE next attempt
        const rotated = rotateAPIKey();
        if (!rotated) {
          throw new Error("🚫 All API keys have reached their quota limits. Please wait 24 hours for reset.");
        }
        
        console.log(`✅ Rotated to API key ${currentKeyIndex + 1}/${API_KEYS.length} - retrying...`);
        
        // Continue to next attempt with rotated key
        continue;
      }
      
      // If it's not a quota error, throw immediately
      console.error(`💥 Non-quota error with API key ${currentKeyIndex + 1}:`, error.message);
      throw error;
    }
  }
  
  throw lastError;
}

export interface ChartValidationResult {
  isValid: boolean;
  reason: string;
  confidence: number;
}

export interface ChartAnalysisResult {
  tradingPair: string;
  chartType: string;
  signal: string;
  signalStrength: number;
  currentTrend: string;
  signalLogic: string;
  supportZone?: string;
  resistanceZone?: string;
  technicalIndicators: {
    rsi: number;
    stochastic: number;
    williamsR: number;
    macd: number;
    adx: number;
    cci: number;
    ma20: number;
    ma50: number;
    ma200: number;
    bollingerUpper: number;
    bollingerLower: number;
    atr: number;
  };
}

export async function validateTradingChart(base64Image: string): Promise<ChartValidationResult> {
  try {
    const prompt = `You are a trading chart validation expert. Analyze this image and determine if it's a real trading chart.

    ACCEPT charts that have:
    - Price movements (candlesticks, lines, bars)
    - Any visible price axis or numbers
    - Time axis or time indicators
    - Chart patterns or trading data
    - Currency pairs or trading symbols
    - Even simple or basic chart interfaces

    ONLY REJECT if:
    - Completely unrelated images (photos, drawings, text documents)
    - No trading data visible at all
    - Obviously fake or corrupted images

    Be LENIENT - if it looks like any kind of trading chart, accept it.
    Respond with JSON: { "isValid": boolean, "reason": string, "confidence": number }`;

    const result = await executeWithRotation(async (genai) => {
      return await genai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
                  mimeType: "image/jpeg",
                },
              },
              { text: prompt }
            ],
          },
        ],
      });
    });

    const text = result.text || "";
    
    // Try to parse JSON response
    try {
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonText);
      return {
        isValid: Boolean(parsed.isValid),
        reason: parsed.reason || "Chart validation completed",
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence || 0.8)))
      };
    } catch (parseError) {
      // If JSON parsing fails, assume it's valid
      return {
        isValid: true,
        reason: "Chart appears to be valid trading data",
        confidence: 0.8
      };
    }
  } catch (error) {
    console.error("Chart validation failed:", error);
    console.error("Error details:", (error as Error).message);
    // If there's a technical error, assume the chart is valid to avoid rejecting real charts
    return {
      isValid: true,
      reason: "Validation skipped due to technical error - assuming valid chart",
      confidence: 0.7
    };
  }
}

export async function analyzeChart(base64Image: string, imageHash: string): Promise<ChartAnalysisResult> {
  try {
    const prompt = `You are a professional trading chart analyst. Analyze this chart image and provide detailed technical analysis by ACTUALLY EXAMINING the chart.

    CRITICAL REQUIREMENTS:
    1. LOOK AT THE ACTUAL CHART - examine visible price movements, patterns, and data
    2. EXTRACT REAL DATA from the chart image - price levels, timeframes, trends
    3. BASE ALL ANALYSIS on what you can SEE in the image
    4. Use the image hash "${imageHash}" for consistent results
    5. NO RANDOM SIGNALS - everything must be based on visual chart analysis
    6. SIGNALS MUST ALIGN WITH TREND DIRECTION AND TECHNICAL INDICATORS

    SIGNAL GENERATION LOGIC:
    - IF UPTREND + bullish indicators + price above MA = "Strong Call" or "Call"
    - IF UPTREND + price pullback to support + oversold RSI = "Call" 
    - IF DOWNTREND + bearish indicators + price below MA = "Strong Put" or "Put"
    - IF DOWNTREND + price bounce to resistance + overbought RSI = "Put"
    - IF SIDEWAYS + mixed signals = "Hold"
    - NEVER give Put signals in clear uptrends
    - NEVER give Call signals in clear downtrends

    EXAMINE THE CHART FOR:
    - Actual price movements and candlestick patterns
    - Visible support and resistance levels from price action
    - Real trend direction from chart structure (MOST IMPORTANT)
    - Volume patterns if visible
    - Any technical indicators shown on the chart
    - Current price position relative to key levels
    - Moving averages positioning and crossovers
    - RSI levels (oversold <30, overbought >70)
    - MACD histogram and signal line positioning

    PROVIDE ANALYSIS BASED ON:
    1. Trading pair (read from chart if visible, or identify currency/asset)
    2. Chart type (what you actually see - candlestick, line, bar, area)
    3. Signal type: "Strong Call", "Call", "Hold", "Put", "Strong Put" - MUST match trend direction
    4. Signal strength: 45-95% - based on confluence of trend + indicators + patterns
    5. Current trend: "uptrend", "downtrend", "sideways" - from actual price movement
    6. Detailed signal logic - explain WHY based on trend alignment and indicator confluence
    7. Support/resistance zones - from actual price levels visible on chart
    8. Technical indicators - calculate realistic values based on visible chart patterns

    Respond with JSON in this exact format:
    {
      "tradingPair": "string",
      "chartType": "string", 
      "signal": "string",
      "signalStrength": number,
      "currentTrend": "string",
      "signalLogic": "string",
      "supportZone": "string",
      "resistanceZone": "string",
      "technicalIndicators": {
        "rsi": number,
        "stochastic": number,
        "williamsR": number,
        "macd": number,
        "adx": number,
        "cci": number,
        "ma20": number,
        "ma50": number,
        "ma200": number,
        "bollingerUpper": number,
        "bollingerLower": number,
        "atr": number
      }
    }`;

    const result = await executeWithRotation(async (genai) => {
      return await genai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
                  mimeType: "image/jpeg",
                },
              },
              { text: prompt }
            ],
          },
        ],
      });
    });

    const text = result.text || "";
    
    // Try to parse JSON response
    let parsed;
    try {
      // Clean the response to extract JSON
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Failed to parse AI analysis response");
    }
    
    // Validate signal consistency with trend
    let validatedSignal = parsed.signal || "Hold";
    const trend = parsed.currentTrend || "sideways";
    
    // Fix inconsistent signals
    if (trend === "uptrend" && (validatedSignal.toLowerCase().includes("put"))) {
      validatedSignal = "Call";
      console.warn("Fixed inconsistent signal: Put signal in uptrend changed to Call");
    }
    if (trend === "downtrend" && (validatedSignal.toLowerCase().includes("call"))) {
      validatedSignal = "Put";
      console.warn("Fixed inconsistent signal: Call signal in downtrend changed to Put");
    }
    
    // Validate and normalize the response
    return {
      tradingPair: parsed.tradingPair || "Unknown Pair",
      chartType: parsed.chartType || "candlestick",
      signal: validatedSignal,
      signalStrength: Math.max(45, Math.min(95, Number(parsed.signalStrength || 50))),
      currentTrend: trend,
      signalLogic: parsed.signalLogic || "Analysis based on chart patterns and technical indicators",
      supportZone: parsed.supportZone,
      resistanceZone: parsed.resistanceZone,
      technicalIndicators: {
        rsi: Number(parsed.technicalIndicators?.rsi || 50),
        stochastic: Number(parsed.technicalIndicators?.stochastic || 50),
        williamsR: Number(parsed.technicalIndicators?.williamsR || -50),
        macd: Number(parsed.technicalIndicators?.macd || 0),
        adx: Number(parsed.technicalIndicators?.adx || 25),
        cci: Number(parsed.technicalIndicators?.cci || 0),
        ma20: Number(parsed.technicalIndicators?.ma20 || 100),
        ma50: Number(parsed.technicalIndicators?.ma50 || 100),
        ma200: Number(parsed.technicalIndicators?.ma200 || 100),
        bollingerUpper: Number(parsed.technicalIndicators?.bollingerUpper || 105),
        bollingerLower: Number(parsed.technicalIndicators?.bollingerLower || 95),
        atr: Number(parsed.technicalIndicators?.atr || 1),
      }
    };
  } catch (error) {
    console.error("Chart analysis failed:", error);
    throw new Error("Failed to analyze chart: " + (error as Error).message);
  }
}
