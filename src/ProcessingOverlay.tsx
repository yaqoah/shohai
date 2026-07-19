import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

export type ProcessingStep = {
  id: string;
  label: string;
};

export const PROCESSING_STEPS: ProcessingStep[] = [
  { id: 'scan', label: 'Scanning job layout & reading visual text constraints...' },
  { id: 'isolate', label: 'Isolating implicit administrative and operational bottlenecks...' },
  { id: 'arbitrage', label: 'Running UAE-market labor arbitrage vs. token consumption formulas...' },
  { id: 'synthesize', label: 'Synthesizing customized AI Agent system architecture...' },
];

type StepStatus = 'pending' | 'active' | 'complete';

export function ProcessingOverlay({
  active,
  currentStep,
  onComplete,
}: {
  active: boolean;
  currentStep: number;
  onComplete?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      setLeaving(false);
    } else if (visible) {
      setLeaving(true);
      const t = setTimeout(() => {
        setVisible(false);
        setLeaving(false);
        onComplete?.();
      }, 460);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!visible) return null;

  const progress = Math.min(100, ((currentStep + 1) / PROCESSING_STEPS.length) * 100);

  return (
    <div className="pointer-events-none fixed right-6 top-24 z-50 w-[340px] max-w-[calc(100vw-3rem)]">
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/60 bg-white/60 p-5 shadow-lift backdrop-blur-md ${
          leaving ? 'animate-overlayOut' : 'animate-overlayIn'
        }`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ochre/20 blur-2xl animate-liquidDrift" />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-espresso/15 blur-2xl animate-liquidDrift"
          style={{ animationDelay: '2.5s' }}
        />

        <div className="relative mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-espresso/10">
            <Sparkles className="h-4 w-4 animate-glowPulse text-espresso" />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-[14px] font-semibold tracking-tight text-espresso">
              Shōhai Engine
            </p>
            <p className="text-[10px] font-medium text-espresso-faint">Processing live intake</p>
          </div>
          <span className="ml-auto text-[11px] font-bold tabular-nums text-ochre">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="relative mb-5 h-1.5 w-full overflow-hidden rounded-full bg-taupe/70">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-ochre transition-[width] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-0 h-full w-10 rounded-full bg-ochre/50 blur-[3px] transition-[left] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ left: `calc(${progress}% - 24px)` }}
          />
        </div>

        <ol className="relative space-y-3">
          {PROCESSING_STEPS.map((step, i) => {
            const status: StepStatus =
              i < currentStep ? 'complete' : i === currentStep ? 'active' : 'pending';
            return (
              <li
                key={step.id}
                className={`flex items-start gap-3 ${
                  status === 'pending' ? 'opacity-40' : 'opacity-100'
                }`}
                style={{
                  animation: 'stepFadeIn 0.4s cubic-bezier(0.25,1,0.5,1) forwards',
                  animationDelay: `${i * 60}ms`,
                  opacity: status === 'pending' ? 0.4 : undefined,
                }}
              >
                <span className="relative mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  {status === 'complete' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ochre-faint animate-checkPop">
                      <Check className="h-3 w-3 text-ochre" strokeWidth={3} />
                    </span>
                  )}
                  {status === 'active' && (
                    <>
                      <span className="absolute h-5 w-5 rounded-full bg-ochre/30 animate-ping" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-ochre animate-glowPulse" />
                    </>
                  )}
                  {status === 'pending' && (
                    <span className="h-2 w-2 rounded-full border border-espresso-mist bg-transparent" />
                  )}
                </span>
                <span
                  className={`text-[12px] leading-snug ${
                    status === 'complete'
                      ? 'text-espresso-faint line-through decoration-espresso-mist'
                      : status === 'active'
                        ? 'font-semibold text-espresso'
                        : 'text-espresso-faint'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="relative mt-4 flex items-center justify-between border-t border-white/50 pt-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-espresso-faint">
            {leaving ? 'Complete' : 'Analyzing'}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-espresso-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-espresso animate-glowPulse" />
            Stream {currentStep + 1}/{PROCESSING_STEPS.length}
          </span>
        </div>
      </div>
    </div>
  );
}
