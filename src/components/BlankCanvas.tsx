import { type FC, useState, useEffect } from 'react';
import { Box, Check, Copy, Sparkles, Terminal } from 'lucide-react';

export const BlankCanvas: FC = () => {
  const [copied, setCopied] = useState(false);
  const [quickNote, setQuickNote] = useState(() => {
    return localStorage.getItem('blank_project_note') || '';
  });

  useEffect(() => {
    localStorage.setItem('blank_project_note', quickNote);
  }, [quickNote]);

  const handleCopyStatus = () => {
    navigator.clipboard.writeText('Blank Project initialized & ready.');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stackBadges = [
    { id: 'badge-react', label: 'React 19' },
    { id: 'badge-vite', label: 'Vite 8' },
    { id: 'badge-tailwind', label: 'Tailwind CSS' },
    { id: 'badge-typescript', label: 'TypeScript' },
  ];

  return (
    <main
      id="blank-project-root"
      className="min-h-screen w-full flex flex-col justify-between bg-neutral-50 text-neutral-900 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Top Bar */}
      <header
        id="top-bar"
        className="w-full max-w-2xl mx-auto flex items-center justify-between pb-6 border-b border-neutral-200/80"
      >
        <div id="brand-indicator" className="flex items-center gap-2.5">
          <div
            id="status-dot-container"
            className="relative flex h-2.5 w-2.5 items-center justify-center"
          >
            <span
              id="status-ping"
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
            />
            <span
              id="status-dot"
              className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"
            />
          </div>
          <span
            id="status-label"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-600 whitespace-nowrap"
          >
            Workspace Ready
          </span>
        </div>

        <button
          id="copy-status-btn"
          type="button"
          onClick={handleCopyStatus}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check id="icon-check" className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy id="icon-copy" className="w-3.5 h-3.5 text-neutral-500" />
              <span>Copy Status</span>
            </>
          )}
        </button>
      </header>

      {/* Center Stage */}
      <div id="center-stage" className="w-full max-w-2xl mx-auto my-auto py-12">
        <div
          id="project-card"
          className="bg-white border border-neutral-200/90 rounded-2xl p-8 sm:p-10 shadow-xs flex flex-col items-center text-center transition-all duration-300"
        >
          {/* Minimalist Icon Badge */}
          <div
            id="icon-wrapper"
            className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 mb-6"
          >
            <Box id="icon-box" className="w-7 h-7 stroke-[1.5]" />
          </div>

          {/* Heading */}
          <h1
            id="main-title"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-3"
          >
            Blank Project
          </h1>

          {/* Description */}
          <p
            id="main-description"
            className="text-neutral-600 text-sm sm:text-base leading-relaxed max-w-md mb-8"
          >
            Your workspace is set up and running smoothly. Tell the assistant what
            application, interface, or workflow you would like to build.
          </p>

          {/* Stack Chips */}
          <div
            id="stack-chips-container"
            className="flex flex-wrap items-center justify-center gap-2 mb-8"
          >
            {stackBadges.map((badge) => (
              <span
                key={badge.id}
                id={badge.id}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/70 whitespace-nowrap"
              >
                {badge.label}
              </span>
            ))}
          </div>

          {/* Scratchpad note area for prompt planning */}
          <div
            id="scratchpad-section"
            className="w-full text-left bg-neutral-50/80 border border-neutral-200 rounded-xl p-4"
          >
            <div
              id="scratchpad-header"
              className="flex items-center justify-between mb-2 text-xs font-medium text-neutral-500"
            >
              <div className="flex items-center gap-1.5">
                <Terminal id="terminal-icon" className="w-3.5 h-3.5 text-neutral-400" />
                <span>Quick Prompt Notes (Local Scratchpad)</span>
              </div>
              {quickNote && (
                <button
                  id="clear-note-btn"
                  type="button"
                  onClick={() => setQuickNote('')}
                  className="hover:text-neutral-700 text-neutral-400 text-xs transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              id="scratchpad-input"
              rows={3}
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="e.g. Build an invoice generator, a fitness tracker, a minimalist habit dashboard..."
              className="w-full bg-transparent border-0 p-0 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-hidden resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Subtle Bottom Bar */}
      <footer
        id="bottom-bar"
        className="w-full max-w-2xl mx-auto pt-6 border-t border-neutral-200/80 flex items-center justify-between text-xs text-neutral-500"
      >
        <div id="ready-status-text" className="flex items-center gap-1.5">
          <Sparkles id="sparkles-icon" className="w-3.5 h-3.5 text-neutral-400" />
          <span>Listening for your next instruction</span>
        </div>
        <span id="port-indicator" className="font-mono text-[11px] text-neutral-400">
          port 3000
        </span>
      </footer>
    </main>
  );
};
