import { apiRequest } from "./queryClient";
import type { ChartAnalysisResponse, ChartAnalysis } from "@shared/schema";

export async function analyzeChartImage(file: File): Promise<ChartAnalysisResponse> {
  const formData = new FormData();
  formData.append('chart', file);
  
  const response = await fetch('/api/analyze-chart', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze chart');
  }

  return response.json();
}

export async function analyzeChartBase64(imageData: string, fileName: string): Promise<ChartAnalysisResponse> {
  const response = await apiRequest('POST', '/api/analyze-chart-base64', {
    imageData,
    fileName,
  });

  return response.json();
}

export async function getRecentAnalyses(limit: number = 10): Promise<ChartAnalysis[]> {
  const response = await apiRequest('GET', `/api/recent-analyses?limit=${limit}`);
  return response.json();
}

export async function getAnalysis(id: string): Promise<ChartAnalysis> {
  const response = await apiRequest('GET', `/api/analysis/${id}`);
  return response.json();
}
