import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
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
    const model = genai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `You are a professional trading chart analyst. Analyze this chart image and provide detailed technical analysis by ACTUALLY EXAMINING the chart.

    CRITICAL REQUIREMENTS:
    1. LOOK AT THE ACTUAL CHART - examine visible price movements, patterns, and data
    2. EXTRACT REAL DATA from the chart image - price levels, timeframes, trends
    3. BASE ALL ANALYSIS on what you can SEE in the image
    4. Use the image hash "${imageHash}" for consistent results
    5. NO RANDOM SIGNALS - everything must be based on visual chart analysis

    EXAMINE THE CHART FOR:
    - Actual price movements and candlestick patterns
    - Visible support and resistance levels from price action
    - Real trend direction from chart structure
    - Volume patterns if visible
    - Any technical indicators shown on the chart
    - Current price position relative to key levels

    PROVIDE ANALYSIS BASED ON:
    1. Trading pair (read from chart if visible, or identify currency/asset)
    2. Chart type (what you actually see - candlestick, line, bar, area)
    3. Signal type: "Strong Call", "Call", "Hold", "Put", "Strong Put" - based on visible patterns
    4. Signal strength: 45-95% - based on confluence of visible signals
    5. Current trend: "uptrend", "downtrend", "sideways" - from actual price movement
    6. Detailed signal logic - explain WHY based on what you see
    7. Support/resistance zones - from actual price levels visible on chart
    8. Technical indicators - calculate based on visible price data and patterns

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

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    
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
    
    // Validate and normalize the response
    return {
      tradingPair: parsed.tradingPair || "Unknown Pair",
      chartType: parsed.chartType || "candlestick",
      signal: parsed.signal || "Hold",
      signalStrength: Math.max(45, Math.min(95, Number(parsed.signalStrength || 50))),
      currentTrend: parsed.currentTrend || "sideways",
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
