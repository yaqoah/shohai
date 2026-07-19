import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Cpu,
  Database,
  Mail,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { AnalysisResponse } from './hooks/useShohaiEngine';

const TABS = [
  { id: 'financials', label: 'The Financials', num: '01' },
  { id: 'architecture', label: 'The AI Architecture', num: '02' },
  { id: 'implementation', label: 'The Implementation', num: '03' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SlideDeck({ ready, analysisResult }: { ready: boolean, analysisResult: AnalysisResponse | null }) {
  const [tab, setTab] = useState<TabId>('financials');

  return (
    <div className="flex h-full flex-col">
      <nav className="flex items-center gap-1 border-b border-taupe px-8">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-4 font-serif text-[14px] font-medium tracking-tight transition-colors duration-300 ${
                active ? 'text-espresso' : 'text-espresso-faint hover:text-espresso-soft'
              }`}
            >
              <span className="mr-1.5 font-sans text-[10px] font-bold tabular-nums opacity-60">
                {t.num}.
              </span>
              {t.label}
              <span
                className={`absolute bottom-0 left-3 right-3 h-[2.5px] rounded-full bg-espresso transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
                style={{ transformOrigin: 'left' }}
              />
            </button>
          );
        })}
      </nav>

      <div className="flex-1 overflow-hidden">
        {tab === 'financials' && (
          <div className="h-full overflow-y-auto scrollbar-slim px-8 py-7">
            <FinancialsTab ready={ready} analysisResult={analysisResult} />
          </div>
        )}
        {tab === 'architecture' && <ArchitectureTab analysisResult={analysisResult} />}
        {tab === 'implementation' && (
          <div className="h-full overflow-y-auto scrollbar-slim px-8 py-7">
            <ImplementationTab analysisResult={analysisResult} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== Tab 1: Financials ============== */

function FinancialsTab({ ready, analysisResult }: { ready: boolean, analysisResult: AnalysisResponse | null }) {
  // Use camelCase/snake_case compatible access
  const getFinancials = () => {
    const fin = (analysisResult as any)?.calculated_financials ?? (analysisResult as any)?.calculatedFinancials;
    return {
      baseSalary: fin?.base_salary ?? fin?.baseSalary ?? 58000,
      totalHumanCost: fin?.total_human_cost ?? fin?.totalHumanCost ?? 58000 * 1.25 / 12,
    };
  };

  const humanSalary = getFinancials().baseSalary;
  const humanMonthly = getFinancials().totalHumanCost;

  // Initialize volume from API payload when ready
  const [volumeOverride, setVolumeOverride] = useState(1000);
  
  useEffect(() => {
    if (ready) {
      const volume = (analysisResult as any)?.estimated_monthly_tasks ?? (analysisResult as any)?.estimatedMonthlyTasks;
      if (volume) {
        setVolumeOverride(volume);
      }
    }
  }, [ready, analysisResult]);

  // Dynamic calculations - all update instantly on slider drag
  const aiMonthly = Math.max(5.0, volumeOverride * 0.00015);
  const netSavings = Math.max(0, humanMonthly - aiMonthly);
  const annualized = netSavings * 12;

  return (
    <div className="animate-fadeIn">
      <div className="mb-5">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-espresso">The Financials</h2>
        <p className="mt-1 text-sm text-espresso-faint">
          Side-by-side cost of human labor vs. an always-on AI agent performing the same work.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Card A — Human Labor */}
        <div className="rounded-2xl border border-taupe bg-alabasterdark p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-taupe">
                <Workflow className="h-4 w-4 text-espresso-soft" />
              </div>
              <span className="font-serif text-base font-semibold tracking-tight text-espresso">
                Human Labor Cost
              </span>
            </div>
            <span className="rounded-full bg-taupe px-2.5 py-0.5 text-[10px] font-bold text-espresso-soft">
              FTE
            </span>
          </div>
          <div className="mt-5">
            <p className="text-[11px] font-medium text-espresso-faint">Base salary</p>
            <p className="mt-0.5 font-serif text-3xl font-semibold tracking-tight text-espresso">
              ${ready ? humanSalary.toLocaleString() : '—'}
              <span className="font-sans text-sm font-medium text-espresso-faint">/yr</span>
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-taupe/60 px-3 py-2">
            <span className="text-[11px] font-semibold text-espresso-faint">
              Overhead multiplier
            </span>
            <span className="ml-auto font-serif text-sm font-bold text-espresso">×1.25</span>
          </div>
          <div className="mt-4 border-t border-taupe pt-4">
            <p className="text-[11px] font-medium text-espresso-faint">Loaded monthly cost</p>
            <p className="mt-0.5 font-serif text-3xl font-semibold tracking-tight text-espresso">
              ${ready ? Math.round(humanMonthly).toLocaleString() : '—'}
              <span className="font-sans text-sm font-medium text-espresso-faint">/mo</span>
            </p>
          </div>
        </div>

        {/* AI Agent Cost */}
        <div className="relative rounded-2xl border-2 border-espresso/30 bg-white p-6 shadow-lift">
          <div className="absolute -right-3 top-5 rounded-full bg-espresso px-3 py-1 text-[10px] font-bold text-white shadow-soft">
            AI AGENT
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-espresso/10">
              <Cpu className="h-4 w-4 text-espresso" />
            </div>
            <span className="font-serif text-base font-semibold tracking-tight text-espresso">
              AI Agent Cost
            </span>
          </div>
          <div className="mt-5">
            <p className="text-[11px] font-medium text-espresso-faint">Token cost per task (scaled)</p>
            <p className="mt-0.5 font-serif text-3xl font-semibold tracking-tight text-espresso">
              $0.00015
              <span className="font-sans text-sm font-medium text-espresso-faint">/doc</span>
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-espresso/5 px-3 py-2">
            <span className="text-[11px] font-semibold text-espresso-soft">Volume</span>
            <span className="ml-auto font-serif text-sm font-bold tabular-nums text-espresso">
              {volumeOverride.toLocaleString()}/mo
            </span>
          </div>
          <div className="mt-4 border-t border-taupe pt-4">
            <p className="text-[11px] font-medium text-espresso-faint">Monthly API cost (with $5 floor)</p>
            <p className="mt-0.5 font-serif text-3xl font-semibold tabular-nums tracking-tight text-espresso">
              ${ready ? aiMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              <span className="font-sans text-sm font-medium text-espresso-faint">/mo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Volume slider */}
      <div className="mt-6 rounded-2xl border border-taupe bg-white p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-semibold text-espresso">Monthly invoice volume</h3>
            <p className="text-[11px] text-espresso-faint">
              Drag to see how AI cost scales linearly — labor stays flat.
            </p>
          </div>
          <span className="rounded-lg bg-espresso/5 px-3 py-1.5 font-serif text-sm font-bold tabular-nums text-espresso">
            {volumeOverride.toLocaleString()} docs
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={5000}
          step={50}
          value={volumeOverride}
          onChange={(e) => setVolumeOverride(parseInt(e.target.value))}
          className="slider-ochre w-full"
          style={{
            ['--fill' as string]: `${((volumeOverride - 100) / (5000 - 100)) * 100}%`,
          }}
        />
        <div className="mt-1.5 flex justify-between text-[10px] font-medium text-espresso-faint">
          <span>100</span>
          <span>5,000</span>
        </div>
      </div>

      {/* Net savings */}
      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-ochre/25 bg-ochre-faint/40 p-6">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-ochre text-white shadow-soft">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ochre">
            Net Monthly Savings
          </p>
          <p className="font-serif text-3xl font-semibold tabular-nums tracking-tight text-ochre">
            ${ready ? netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            <span className="font-sans text-sm font-medium text-ochre/70">/mo</span>
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-[11px] font-medium text-espresso-soft">Annualized</p>
          <p className="font-serif text-lg font-semibold tabular-nums text-espresso">
            ${ready ? annualized.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============== Tab 2: AI Architecture — full-height canvas ============== */

type AnyNode = {
  id: string;
  label: string;
  type: 'trigger' | 'process' | 'output';
};

type AnyPhase = {
  phase_number?: string;
  phaseNumber?: string;
  title?: string;
  duration?: string;
  description?: string;
};

function ArchitectureTab({ analysisResult }: { analysisResult: AnalysisResponse | null }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Support both snake_case and camelCase for API compatibility
  const nodes: AnyNode[] = (analysisResult as any)?.proposed_nodes ?? (analysisResult as any)?.proposedNodes ?? [];

  const getBehaviorForType = (type: string) => {
    if (type === 'trigger') return 'Listens for incoming webhooks or uploaded assets and securely passes the raw payload to the orchestrator within milliseconds.';
    if (type === 'output') return 'Formats the structured payload and executes a secure write API call directly to your target CRM or database.';
    return 'Uses structured parsing to extract precise, implicit intent from messy human input, stripping away corporate fluff.';
  };

  const nodeLabel = (node: AnyNode) => node.type === 'trigger' ? Mail : node.type === 'output' ? Database : Cpu;

  // Zoom handlers for trackpad
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(2, Math.max(0.5, scale + delta));
    setScale(newScale);
  };

  // Pan handlers for mouse/touch drag
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    setPanX(e.clientX - dragStartRef.current.x);
    setPanY(e.clientY - dragStartRef.current.y);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Show placeholder if no nodes available
  if (!nodes || nodes.length === 0) {
    return (
      <div className="relative h-full animate-fadeIn">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(54,34,25,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(54,34,25,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative flex h-full flex-col items-center justify-center px-8 py-7">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-taupe/20">
            <Sparkles className="h-8 w-8 text-espresso-faint" />
          </div>
          <p className="mt-6 font-serif text-base text-espresso-faint">
            No architecture nodes extracted from the job posting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full animate-fadeIn">
      {/* Blueprint grid fills entire tab area */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(54,34,25,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(54,34,25,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Content overlay */}
      <div className="relative flex h-full flex-col px-8 py-7">
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-espresso">
            The AI Architecture
          </h2>
          <p className="mt-1 text-sm text-espresso-faint">
            The agent blueprint — a three-node pipeline from raw intake to ERP write.
          </p>
        </div>

        {/* Zoomable/Pannable Nodes canvas */}
        <div 
          className="flex flex-1 flex-col items-center justify-center overflow-hidden"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div 
            className="flex w-full max-w-3xl flex-col items-stretch gap-6 md:flex-row md:items-center md:justify-center md:gap-4"
            style={{
              transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            }}
          >
            {nodes.map((node, i) => {
              const Icon = nodeLabel(node);
              const isHovered = hovered === node.id;
              return (
                <div
                  key={node.id}
                  className="flex flex-col items-center md:flex-row md:flex-1"
                >
                  <div
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="group relative w-full max-w-[240px] cursor-pointer"
                  >
                    <div
                      className={`relative rounded-2xl border bg-white p-5 shadow-soft transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                        isHovered
                          ? 'border-espresso shadow-lift -translate-y-1'
                          : 'border-taupe hover:border-espresso/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 ${
                            isHovered ? 'bg-espresso text-white' : 'bg-espresso/10 text-espresso'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ochre">
                            {node.type} Node
                          </p>
                          <p className="font-serif text-sm font-semibold leading-tight text-espresso">
                            {node.label}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* micro-modal */}
                    <div
                      className={`absolute left-1/2 top-full z-20 mt-3 w-[280px] -translate-x-1/2 transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                        isHovered
                          ? 'pointer-events-auto translate-y-0 opacity-100'
                          : 'pointer-events-none translate-y-2 opacity-0'
                      }`}
                    >
                      <div className="rounded-xl border border-espresso/15 bg-white p-4 shadow-lift">
                        <div className="mb-2 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-espresso" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-espresso">
                            Functional Behavior
                          </span>
                        </div>
                        <p className="text-[12px] font-medium leading-[1.7] text-espresso-soft">
                          {getBehaviorForType(node.type)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {i < nodes.length - 1 && (
                    <div className="my-2 flex items-center justify-center md:mx-2 md:my-0">
                      <div className="hidden h-px w-10 bg-gradient-to-r from-espresso/30 to-espresso/60 md:block" />
                      <ArrowRight className="h-4 w-4 text-espresso/50 md:ml-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* legend */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {['Trigger', 'LLM', 'Action'].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full bg-espresso"
                  style={{ opacity: 1 - i * 0.2 }}
                />
                <span className="text-[11px] font-medium text-espresso-soft">{s}</span>
              </div>
            ))}
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-espresso-faint">
              <Sparkles className="h-3 w-3 text-ochre" /> Hover any node for security detail
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== Tab 3: Implementation — editorial timeline ============== */

function ImplementationTab({ analysisResult }: { analysisResult: AnalysisResponse | null }) {
  // Log incoming data for debugging
  useEffect(() => {
    if (analysisResult) {
      console.log('ImplementationTab received data:', {
        snake_case: (analysisResult as any).implementation_timeline,
        camelCase: (analysisResult as any).implementationTimeline,
        keys: Object.keys(analysisResult),
      });
    }
  }, [analysisResult]);

  // Support both snake_case and camelCase for API compatibility
  const phasesData: AnyPhase[] = (analysisResult as any)?.implementation_timeline ?? (analysisResult as any)?.implementationTimeline ?? [];

  // Show placeholder if no phases available
  if (!phasesData || phasesData.length === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-8">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-espresso">
            The Implementation
          </h2>
          <p className="mt-1 text-sm text-espresso-faint">
            A low-risk, three-phase rollout from sandbox to seamless hand-off.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-taupe/20 mx-auto">
              <Sparkles className="h-8 w-8 text-espresso-faint" />
            </div>
            <p className="mt-4 font-serif text-base text-espresso-faint">
              No implementation timeline available yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-espresso">
          The Implementation
        </h2>
        <p className="mt-1 text-sm text-espresso-faint">
          A low-risk, three-phase rollout from sandbox to seamless hand-off.
        </p>
      </div>

      <div className="relative">
        {/* vertical divider */}
        <div className="absolute left-[31px] top-4 bottom-4 w-px bg-espresso/20" />

        <ol className="space-y-10">
          {phasesData.map((p, i) => {
            // Defensive extraction with multiple fallbacks
            const phaseNum = p.phase_number ?? p.phaseNumber ?? String(i + 1);
            const phaseTitle = p.title ?? 'Phase ' + (i + 1);
            const phaseDuration = p.duration ?? '2 weeks';
            const phaseDescription = p.description ?? 'Implementation phase details to be determined.';
            
            return (
            <li
              key={`${phaseNum}-${i}`}
              className="relative pl-20"
              style={{
                animation: 'stepFadeIn 0.5s cubic-bezier(0.25,1,0.5,1) forwards',
                animationDelay: `${i * 140}ms`,
                opacity: 0,
              }}
            >
              {/* Large serif step number */}
              <div className="absolute left-0 top-0 flex h-16 w-16 flex-shrink-0 items-center justify-center">
                <span className="font-serif text-[42px] font-medium leading-none text-espresso">
                  {phaseNum}
                </span>
              </div>

              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ochre">
                  Phase {phaseNum}
                </span>
                <h3 className="mt-1.5 font-serif text-xl font-semibold tracking-tight text-espresso">
                  {phaseTitle}
                </h3>
                <span className="mt-1.5 inline-block rounded-full border border-taupe bg-alabasterdark px-3 py-0.5 text-[11px] font-semibold text-espresso-soft">
                  {phaseDuration}
                </span>
                <p className="mt-3 max-w-md text-[14px] leading-[1.8] text-espresso-soft">
                  {phaseDescription}
                </p>
              </div>

              {/* soft divider between phases */}
              {i < phasesData.length - 1 && (
                <div className="mt-8 h-px w-full bg-taupe/60" />
              )}
            </li>
          );
          })}
        </ol>
      </div>
    </div>
  );
}
