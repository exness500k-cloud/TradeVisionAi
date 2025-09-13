import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chartAnalyses = pgTable("chart_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageHash: text("image_hash").notNull().unique(),
  tradingPair: text("trading_pair").notNull(),
  chartType: text("chart_type").notNull(),
  signal: text("signal").notNull(),
  signalStrength: integer("signal_strength").notNull(),
  currentTrend: text("current_trend").notNull(),
  signalLogic: text("signal_logic").notNull(),
  supportZone: text("support_zone"),
  resistanceZone: text("resistance_zone"),
  technicalIndicators: jsonb("technical_indicators").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChartAnalysisSchema = createInsertSchema(chartAnalyses).omit({
  id: true,
  createdAt: true,
});

export type InsertChartAnalysis = z.infer<typeof insertChartAnalysisSchema>;
export type ChartAnalysis = typeof chartAnalyses.$inferSelect;

export interface TechnicalIndicators {
  // Momentum Oscillators
  rsi: number;
  stochastic: number;
  williamsR: number;

  // Trend Following
  macd: number;
  adx: number;
  cci: number;

  // Moving Averages
  ma20: number;
  ma50: number;
  ma200: number;

  // Volatility & Bands
  bollingerUpper: number;
  bollingerLower: number;
  atr: number;

  // New Indicators
  candlestickPattern?: string; // e.g., Engulfing, Doji
  chartPattern?: string; // e.g., Head and Shoulders, Double Top
}

export interface ChartAnalysisRequest {
  imageData: string; // base64 encoded image
  fileName: string;
}

export interface ChartAnalysisResponse {
  analysis: ChartAnalysis;
  isValid: boolean;
  error?: string;
}
export interface TechnicalIndicators {
  // Existing fields...

  // New Indicators
  swingHighsLows?: { swingHigh: number, swingLow: number }; 
  breakoutFakeout?: string; // Description of breakout/fakeout events
  liquidityZones?: { orderBlock: string, stopHuntZone: string };
  fairValueGaps?: { bullishFVG: boolean, bearishFVG: boolean };
  smartMoneyConcepts?: { orderBlocks: string, breakerBlocks: string, premiumDiscountZones: string };
}
