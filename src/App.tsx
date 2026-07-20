import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, Play, Sparkles, Upload, X, Zap } from 'lucide-react';
import { ProcessingOverlay } from './ProcessingOverlay';
import { SlideDeck } from './SlideDeck';
import { useShohaiEngine, AnalysisResponse } from './hooks/useShohaiEngine';

type Stage = 'intake' | 'parsing' | 'parsed' | 'processing' | 'analyzed';

function App() {
  const { isLoading, loadingStep, analysisResult, error, runAudit, reset } = useShohaiEngine();
  const [stage, setStage] = useState<Stage>('intake');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    setStage('processing');
    setUploadedFile(file);
    runAudit(file);
  };

  const handleClearWorkspace = () => {
    setStage('intake');
    setDragOver(false);
    setUploadedFile(null);
    reset();
    // Reset the file input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const finishAnalysis = () => {
    if (analysisResult) setStage('analyzed');
  };

  useEffect(() => {
    if (analysisResult && !isLoading) {
      finishAnalysis();
    }
  }, [analysisResult, isLoading]);

  return (
    <div className="min-h-screen w-full bg-alabaster paper-grain text-espresso">
      <ProcessingOverlay active={isLoading} currentStep={loadingStep} onComplete={finishAnalysis} />
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600 shadow-soft">
          {error}
        </div>
      )}
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <LeftPane
          stage={stage}
          dragOver={dragOver}
          setDragOver={setDragOver}
          onFileUpload={handleFileUpload}
          fileInputRef={fileInputRef}
          onRunAnalysis={() => setStage('analyzed')}
          analysisResult={analysisResult}
          onClearWorkspace={handleClearWorkspace}
          uploadedFile={uploadedFile}
        />
        <RightPane stage={stage} analysisResult={analysisResult} />
      </div>
    </div>
  );
}

/* ==================== Left Pane ==================== */

function LeftPane({
  stage,
  dragOver,
  setDragOver,
  onFileUpload,
  fileInputRef,
  onRunAnalysis,
  analysisResult,
  onClearWorkspace,
  uploadedFile,
}: {
  stage: Stage;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFileUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onRunAnalysis: () => void;
  analysisResult: AnalysisResponse | null;
  onClearWorkspace: () => void;
  uploadedFile: File | null;
}) {
  return (
    <aside className="flex w-full flex-col border-r border-taupe bg-alabaster/80 backdrop-blur-sm lg:w-[40%] lg:min-w-[460px]">
      {/* App bar - serif wordmark with parallel rules */}
      <header className="flex items-start justify-between px-8 pt-8 pb-6">
        <div className="flex flex-col items-center">
          <h1 className="font-serif text-[22px] font-semibold tracking-tight leading-none text-espresso">
            Shōhai
          </h1>
          <div className="mt-1 flex flex-col gap-[3px] items-center">
            <div className="h-[3px] w-12 rounded-full bg-espresso" />
            <div className="h-[3px] w-12 rounded-full bg-espresso" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-taupe bg-white px-3 py-1.5 shadow-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulseDot rounded-full bg-ochre opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ochre" />
          </span>
          <span className="text-[11px] font-semibold tracking-wide text-espresso-soft">
            Engine Active
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-slim px-8 pb-8">
        {stage === 'intake' && (
          <IntakeZone
            dragOver={dragOver}
            setDragOver={setDragOver}
            onFileUpload={onFileUpload}
            fileInputRef={fileInputRef}
          />
        )}
        {(stage === 'parsing' || stage === 'processing') && <ParsingState />}
        {(stage === 'parsed' || stage === 'analyzed') && (
          <ParsedAudit analyzed={stage === 'analyzed'} onRunAnalysis={onRunAnalysis} analysisResult={analysisResult} uploadedFile={uploadedFile} onClearWorkspace={onClearWorkspace} />
        )}
      </div>
    </aside>
  );
}

/* ==================== Intake Zone ==================== */

function IntakeZone({
  dragOver,
  setDragOver,
  onFileUpload,
  fileInputRef,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFileUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="flex h-full flex-col animate-fadeIn">
      <div className="mb-6 mt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso-soft">
          Step 01
        </p>
        <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-espresso">
          Drop a job listing
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-espresso-faint">
          Upload a screenshot, PDF, or paste raw text. We parse the role description and
          surface hidden manual-labor bottlenecks.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className="group relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-espresso/40 bg-white/40 px-8 py-16 text-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-espresso hover:bg-espresso/[0.05] hover:shadow-lift"
        style={{
          backgroundColor: dragOver ? 'rgba(54,34,25,0.05)' : undefined,
          borderColor: dragOver ? '#362219' : undefined,
          transform: dragOver ? 'scale(1.01)' : undefined,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileUpload(e.target.files[0]);
            }
          }}
        />
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-espresso/10 text-espresso transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:bg-espresso group-hover:text-white"
          style={{ transform: dragOver ? 'scale(1.15)' : undefined }}
        >
          <Upload className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <p className="mt-5 font-serif text-base font-medium text-espresso-soft">
          {dragOver ? 'Release to ingest' : 'Drag a file here, or click to browse'}
        </p>
        <p className="mt-1.5 text-xs font-medium text-espresso-faint">
          PNG, JPG, PDF, TXT - up to 10MB
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-full border border-taupe bg-white px-3.5 py-1.5 shadow-soft">
          <Sparkles className="h-3.5 w-3.5 text-ochre" />
          <span className="text-[11px] font-semibold text-espresso-soft">
            Auto-detects job-board screenshots
          </span>
        </div>
      </label>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { icon: FileText, label: 'PDF resumes' },
          { icon: Sparkles, label: 'Screenshots' },
          { icon: Play, label: 'Raw paste' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 rounded-xl border border-taupe bg-white px-3 py-2.5"
          >
            <s.icon className="h-3.5 w-3.5 text-espresso-soft" />
            <span className="text-[11px] font-medium text-espresso-faint">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== Parsing State ==================== */

function ParsingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center animate-fadeIn">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-espresso/10" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-espresso shadow-lift">
          <Sparkles className="h-7 w-7 animate-pulse text-white" />
        </div>
      </div>
      <p className="mt-6 font-serif text-base font-medium text-espresso">Parsing listing...</p>
      <p className="mt-1 text-sm text-espresso-faint">Detecting manual-task sentences</p>
      <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-taupe">
        <div className="h-full w-1/3 animate-[slideIn_1.4s_ease-in-out_infinite] rounded-full bg-espresso" />
      </div>
    </div>
  );
}

/* ==================== Parsed Audit ==================== */

function ParsedAudit({
  analyzed,
  onRunAnalysis,
  analysisResult,
  uploadedFile,
  onClearWorkspace,
}: {
  analyzed: boolean;
  onRunAnalysis: () => void;
  analysisResult: AnalysisResponse | null;
  uploadedFile: File | null;
  onClearWorkspace: () => void;
}) {
  const totalTasks = analysisResult?.estimated_monthly_tasks || 0;

  // Format file name and size
  const fileName = uploadedFile?.name || 'ap-coordinator-listing.png';
  const fileSizeKB = uploadedFile ? Math.round(uploadedFile.size / 1024) : 412;

  return (
    <div className="animate-springUp">
      {/* File chip */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 rounded-xl border border-taupe bg-white px-3 py-2 shadow-soft">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-espresso/10">
            <FileText className="h-3.5 w-3.5 text-espresso" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-espresso-soft">{fileName}</p>
            <p className="text-[10px] text-espresso-faint">{fileSizeKB} KB parsed just now</p>
          </div>
        </div>
        <button 
          onClick={onClearWorkspace}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-espresso-faint transition-colors hover:bg-taupe/50 hover:text-espresso-soft"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      {/* Job header */}
      <div className="rounded-2xl border border-taupe bg-white p-6 shadow-soft">
        <div className="mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-espresso-faint">Role:</span>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-espresso">
            {analysisResult?.job_title || 'Analyzing Role...'}
          </h2>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-espresso-faint">Company:</span>
          <p className="text-sm font-medium text-espresso-faint">
            {analysisResult?.company_name && analysisResult.company_name !== 'N/A' ? analysisResult.company_name : 'NA'}
          </p>
        </div>

        {/* waste banner */}
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-ochre/20 bg-ochre-faint/50 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ochre text-white">
            <Zap className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-serif text-sm font-semibold text-espresso">
              {totalTasks.toLocaleString()} automated tasks per month
            </p>
            <p className="text-[11px] text-espresso-faint">
              Major implicit bottlenecks identified in the role description.
            </p>
          </div>
        </div>
      </div>

      {/* Run analysis CTA */}
      {!analyzed && (
        <button
          onClick={onRunAnalysis}
          className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-espresso px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:scale-[1.01] hover:shadow-lift"
        >
          <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
          Run Bottleneck Arbitrage Analysis
        </button>
      )}
      {analyzed && (
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-espresso/15 bg-espresso/[0.04] px-5 py-3.5 text-sm font-semibold text-espresso">
          <CheckCircle2 className="h-4 w-4" />
          Analysis complete - see dashboard
        </div>
      )}

      {/* Job description card - bound to extracted_job_description */}
      <div className="mt-5 rounded-2xl border border-taupe bg-white p-6 shadow-soft">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-espresso-soft">
          Job Description
        </h3>
        <p className="mb-4 text-sm leading-[1.8] text-espresso-soft whitespace-pre-wrap">
          {analysisResult?.extracted_job_description || analysisResult?.extractedJobDescription || 'Primary workflow extraction pending...'}
        </p>
      </div>

      {/* Detected bottlenecks - solution value below */}
      <div className="mt-5 rounded-2xl border border-taupe bg-white p-6 shadow-soft">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-espresso-soft">
          Primary Bottleneck
        </h3>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-ochre-faint">
            <Zap className="h-4 w-4 text-ochre" />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold text-espresso">
              {analysisResult?.detected_bottleneck || analysisResult?.detectedBottleneck || 'Manual operational constraints'}
            </p>
            <p className="mt-1 text-[11px] italic leading-relaxed text-espresso-faint">
              {analysisResult?.calculated_financials?.solution_value || 
               analysisResult?.calculatedFinancials?.solution_value || 
               analysisResult?.calculated_financials?.solution_value || 
               'ROI potential to be calculated.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== Right Pane ==================== */

function RightPane({ stage, analysisResult }: { stage: Stage, analysisResult: AnalysisResponse | null }) {
  const ready = stage === 'analyzed' && !!analysisResult;
  return (
    <main className="flex w-full flex-col bg-alabaster lg:w-[60%]">
      <header className="flex items-center justify-between border-b border-taupe px-8 py-5">
        <h2 className="font-serif text-base font-semibold tracking-tight text-espresso">
          Arbitrage Dashboard
        </h2>
        <div className="hidden items-center gap-2 rounded-lg border border-taupe bg-white px-3 py-1.5 sm:flex">
          <span className="h-2 w-2 rounded-full bg-ochre" />
          <span className="text-[11px] font-semibold text-espresso-soft">Live estimate</span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <SlideDeck ready={ready} analysisResult={analysisResult} />
      </div>
    </main>
  );
}

export default App;




