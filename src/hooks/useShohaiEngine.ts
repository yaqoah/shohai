import { useState } from 'react';

// Strongly typed interfaces matching the Backend's AnalysisResponse
export interface NodeModel {
  id: string;
  label: string;
  type: 'trigger' | 'process' | 'output';
}

export interface CalculatedFinancials {
  base_salary: number;
  estimated_overhead_cost: number;
  total_human_cost: number;
  estimated_ai_token_cost: number;
  net_monthly_savings: number;
  roi_multiplier: number;
}

export interface TimelinePhase {
  phase_number?: string;
  title: string;
  duration: string;
  description: string;
  // CamelCase variant
  phaseNumber?: string;
}

export interface AnalysisResponse {
  job_title?: string;
  company_name?: string;
  detected_bottleneck?: string;
  estimated_monthly_tasks?: number;
  inferred_seniority?: 'Junior' | 'Mid' | 'Senior';
  proposed_nodes?: NodeModel[];
  calculated_financials?: CalculatedFinancials;
  implementation_timeline?: TimelinePhase[];
  // CamelCase variants for potential API compatibility
  jobTitle?: string;
  companyName?: string;
  detectedBottleneck?: string;
  estimatedMonthlyTasks?: number;
  inferredSeniority?: 'Junior' | 'Mid' | 'Senior';
  proposedNodes?: NodeModel[];
  calculatedFinancials?: CalculatedFinancials;
  implementationTimeline?: TimelinePhase[];
}

export function useShohaiEngine() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compressAndEncodeImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > 1024) {
            height = Math.round((height * 1024) / width);
            width = 1024;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Failed to get canvas context'));
          
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type || 'image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const runAudit = async (file: File) => {
    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    setAnalysisResult(null);

    // Simulate step progress while processing
    const totalSteps = 4;
    const progressInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < totalSteps - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      let base64String = '';
      if (file.type.startsWith('image/')) {
        base64String = await compressAndEncodeImage(file);
      } else {
        const reader = new FileReader();
        base64String = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64String }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();
      setAnalysisResult(data);
      setLoadingStep(3);
    } catch (err: any) {
      console.error('Audit failed:', err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  return {
    isLoading,
    loadingStep,
    analysisResult,
    error,
    runAudit,
    reset: () => {
      setIsLoading(false);
      setLoadingStep(0);
      setAnalysisResult(null);
      setError(null);
    },
  };
}
