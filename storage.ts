import { type ChartAnalysis, type InsertChartAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getChartAnalysis(id: string): Promise<ChartAnalysis | undefined>;
  getChartAnalysisByHash(hash: string): Promise<ChartAnalysis | undefined>;
  createChartAnalysis(analysis: InsertChartAnalysis): Promise<ChartAnalysis>;
  getRecentAnalyses(limit?: number): Promise<ChartAnalysis[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<string, ChartAnalysis>;

  constructor() {
    this.analyses = new Map();
  }

  async getChartAnalysis(id: string): Promise<ChartAnalysis | undefined> {
    return this.analyses.get(id);
  }

  async getChartAnalysisByHash(hash: string): Promise<ChartAnalysis | undefined> {
    return Array.from(this.analyses.values()).find(
      (analysis) => analysis.imageHash === hash,
    );
  }

  async createChartAnalysis(insertAnalysis: InsertChartAnalysis): Promise<ChartAnalysis> {
    const id = randomUUID();
    const analysis: ChartAnalysis = { 
      ...insertAnalysis, 
      id, 
      createdAt: new Date(),
      supportZone: insertAnalysis.supportZone || null,
      resistanceZone: insertAnalysis.resistanceZone || null,
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getRecentAnalyses(limit: number = 10): Promise<ChartAnalysis[]> {
    const allAnalyses = Array.from(this.analyses.values());
    return allAnalyses
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
