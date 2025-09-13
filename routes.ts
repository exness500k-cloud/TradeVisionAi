import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { processChartAnalysis } from "./services/chartAnalysis";
import type { ChartAnalysisRequest } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, and WebP are allowed.'));
    }
  }
});

const chartAnalysisRequestSchema = z.object({
  imageData: z.string().min(1),
  fileName: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload and analyze chart
  app.post('/api/analyze-chart', upload.single('chart'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No chart image uploaded. Please select a valid trading chart.' 
        });
      }

      // Validate file size
      if (req.file.size < 50 * 1024) {
        return res.status(400).json({ 
          error: 'File too small. Minimum size is 50KB.' 
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ 
          error: 'File too large. Maximum size is 5MB.' 
        });
      }

      // Convert buffer to base64
      const imageData = req.file.buffer.toString('base64');
      const fileName = req.file.originalname;

      const result = await processChartAnalysis(imageData, fileName);
      
      if (!result.isValid) {
        return res.status(400).json({ 
          error: result.error 
        });
      }

      res.json(result);

    } catch (error) {
      console.error('Chart analysis error:', error);
      
      // Check if it's an API key error
      if ((error as Error).message && ((error as Error).message.includes('API key') || (error as Error).message.includes('401'))) {
        return res.status(400).json({ 
          error: 'OpenAI API key issue. Please check your API key configuration and ensure you have billing credits available.' 
        });
      }
      
      res.status(500).json({ 
        error: 'Internal server error during chart analysis. Please try again.' 
      });
    }
  });

  // Analyze chart from base64 data
  app.post('/api/analyze-chart-base64', async (req, res) => {
    try {
      const validation = chartAnalysisRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid request data. Please provide imageData and fileName.' 
        });
      }

      const { imageData, fileName } = validation.data;
      
      const result = await processChartAnalysis(imageData, fileName);
      
      if (!result.isValid) {
        return res.status(400).json({ 
          error: result.error 
        });
      }

      res.json(result);

    } catch (error) {
      console.error('Chart analysis error:', error);
      
      // Check if it's an API key error
      if ((error as Error).message && ((error as Error).message.includes('API key') || (error as Error).message.includes('401'))) {
        return res.status(400).json({ 
          error: 'OpenAI API key issue. Please check your API key configuration and ensure you have billing credits available.' 
        });
      }
      
      res.status(500).json({ 
        error: 'Internal server error during chart analysis. Please try again.' 
      });
    }
  });

  // Get recent analyses
  app.get('/api/recent-analyses', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getRecentAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      res.status(500).json({ 
        error: 'Failed to fetch recent analyses.' 
      });
    }
  });

  // Get specific analysis
  app.get('/api/analysis/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getChartAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ 
          error: 'Analysis not found.' 
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analysis.' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
