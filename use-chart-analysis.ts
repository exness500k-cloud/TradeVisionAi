import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeChartImage, getRecentAnalyses } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useChartAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: analyzeChartImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recent-analyses'] });
      toast({
        title: "Analysis Complete",
        description: "Your chart has been successfully analyzed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    analyzeChart: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    analysisResult: analyzeMutation.data,
    analysisError: analyzeMutation.error,
  };
}

export function useRecentAnalyses(limit: number = 10) {
  return useQuery({
    queryKey: ['/api/recent-analyses', limit],
    queryFn: () => getRecentAnalyses(limit),
  });
}
