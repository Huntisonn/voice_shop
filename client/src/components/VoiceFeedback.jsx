import { useEffect, useState } from "react";

/**
 * VoiceFeedback — fixed top bar showing mic state and last parsed action
 */
export default function VoiceFeedback({
  listening,
  transcript,
  intent,
  error,
  onStart,
  onStop,
}) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (listening) setPulseKey((k) => k + 1);
  }, [listening]);

  const stateLabel = listening
    ? "Listening…"
    : transcript
    ? "Command received"
    : "Tap mic to speak";

  const barColor = listening
    ? "from-emerald-500/20 to-teal-500/20 border-emerald-500/40"
    : transcript
    ? "from-violet-500/20 to-indigo-500/20 border-violet-500/40"
    : "from-slate-800/60 to-slate-700/60 border-slate-600/40";

  const intentChips = intent
    ? Object.entries(intent)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => ({ k, v }))
    : [];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-2 
        bg-gradient-to-r ${barColor} backdrop-blur-md border-b transition-all duration-500`}
    >
      {/* Mic Button */}
      <button
        onClick={listening ? onStop : onStart}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full 
          border-2 transition-all duration-300 flex-shrink-0 
          ${listening
            ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/30"
            : "border-slate-500 bg-slate-700/50 text-slate-300 hover:border-violet-400 hover:text-violet-300"
          }`}
        title={listening ? "Stop listening" : "Start voice command"}
        aria-label={listening ? "Stop listening" : "Start voice command"}
      >
        {/* Pulse ring when listening */}
        {listening && (
          <span
            key={pulseKey}
            className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-60"
          />
        )}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2z"/>
          <path d="M19 11a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V22h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.062A8 8 0 0 1 4 12a1 1 0 0 1 2 0 6 6 0 1 0 12 0 1 1 0 0 1 1-1z"/>
        </svg>
      </button>

      {/* Status label */}
      <div className="flex flex-col min-w-0">
        <span className={`text-xs font-semibold tracking-wide uppercase 
          ${listening ? "text-emerald-400" : "text-slate-400"}`}>
          {stateLabel}
        </span>
        {transcript && (
          <span className="text-sm text-slate-200 truncate max-w-xs" title={transcript}>
            "{transcript}"
          </span>
        )}
      </div>

      {/* Intent chips */}
      {intentChips.length > 0 && (
        <div className="flex gap-1.5 flex-wrap ml-2">
          {intentChips.map(({ k, v }) => (
            <span
              key={k}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/30 
                text-violet-200 border border-violet-500/40"
            >
              <span className="text-violet-400">{k}:</span> {String(v)}
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <span className="ml-auto text-xs text-red-400 flex items-center gap-1 flex-shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {error}
        </span>
      )}

      {/* Keyboard shortcut hint */}
      <span className="ml-auto text-xs text-slate-600 flex-shrink-0 hidden sm:block">
        Press <kbd className="px-1 py-0.5 rounded bg-slate-700 text-slate-400 text-xs font-mono">Space</kbd> to talk
      </span>
    </div>
  );
}
