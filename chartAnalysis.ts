import crypto from "crypto";
import { analyzeChart, validateTradingChart } from "./gemini";
import { storage } from "../storage";
import type { ChartAnalysisResponse, InsertChartAnalysis } from "@shared/schema";

export function generateImageHash(imageData: string): string {
  return crypto.createHash('sha256').update(imageData).digest('hex');
}

export async function processChartAnalysis(
  imageData: string, 
  fileName: string
): Promise<ChartAnalysisResponse> {
  try {
    // Generate consistent hash for image
    const imageHash = generateImageHash(imageData);
    
    // Check if we already analyzed this exact image
    const existingAnalysis = await storage.getChartAnalysisByHash(imageHash);
    if (existingAnalysis) {
      return {
        analysis: existingAnalysis,
        isValid: true
      };
    }

    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    
    // Validate that this is a real trading chart
    const validation = await validateTradingChart(base64Data);
    
    if (!validation.isValid) {
      return {
        analysis: {} as any,
        isValid: false,
        error: `Invalid trading chart: ${validation.reason}. Please upload a real trading chart with visible price data, timeframes, and trading pairs.`
      };
    }

    // Perform AI analysis
    const additionalIndicators = {
    candlestickPattern: "Engulfing", // Example pattern
    chartPattern: "Head and Shoulders" // Example pattern
  };
  
  const analysisResult = await analyzeChart(base64Data, imageHash);
  analysisResult.technicalIndicators = { 
    ...analysisResult.technicalIndicators, 
    ...additionalIndicators
  };
    
    // Create analysis record
    const insertData: InsertChartAnalysis = {
      imageHash,
      tradingPair: analysisResult.tradingPair,
      chartType: analysisResult.chartType,
      signal: analysisResult.signal,
      signalStrength: analysisResult.signalStrength,
      currentTrend: analysisResult.currentTrend,
      signalLogic: analysisResult.signalLogic,
      supportZone: analysisResult.supportZone,
      resistanceZone: analysisResult.resistanceZone,
      technicalIndicators: analysisResult.technicalIndicators,
    };

    const analysis = await storage.createChartAnalysis(insertData);

    return {
      analysis,
      isValid: true
    };

  } catch (error) {
    console.error("Chart analysis processing failed:", error);
    return {
      analysis: {} as any,
      isValid: false,
      error: "Failed to process chart analysis. Please try again."
    };
  }
}
