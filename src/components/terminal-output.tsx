import type { ThemeMode } from "../../types";

const MAX_LOG_CHARS = 10_000;

function stringifyLogData(data: unknown) {
  try {
    const json = JSON.stringify(
      data,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    );

    if (!json) return String(data);

    if (json.length <= MAX_LOG_CHARS) return json;

    return `${json.slice(0, MAX_LOG_CHARS)}\n\n... log truncated (${json.length - MAX_LOG_CHARS} more chars)`;
  } catch (err) {
    return String(err instanceof Error ? err.message : data);
  }
}

export function TerminalOutput({
  outputs,
  onClear,
  theme,
}: {
  outputs: {
    label: string;
    data: unknown;
  }[];
  onClear: () => void;
  theme: ThemeMode;
}) {
  const isModern = theme === "modern";

  return (
    <div
      className={
        isModern
          ? "flex h-full min-h-0 min-w-0 w-1/2 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-900/10"
          : "win95-outset w-1/2 min-w-0 min-h-0 overflow-hidden flex flex-col bg-[#c0c0c0]"
      }
    >
      <div
        className={
          isModern
            ? "flex items-center justify-between gap-2 border-b border-slate-800 px-5 py-4"
            : "bg-[#000080] text-white px-2 py-0.5 text-xs font-bold flex items-center justify-between gap-2"
        }
      >
        <div>
          <span
            className={
              isModern ? "font-bold text-white" : undefined
            }
          >
            Log Viewer
          </span>
          {isModern && <p className="text-xs text-slate-400">Live execution trace</p>}
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={outputs.length === 0}
          className={
            isModern
              ? "rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              : "win95-outset bg-[#c0c0c0] px-2 py-0.5 text-[10px] font-normal text-black disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 active:translate-x-px active:translate-y-px"
          }
        >
          Clear
        </button>
      </div>
      <div
        className={
          isModern
            ? "flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 font-mono text-sm text-emerald-300"
            : "flex-1 min-h-0 m-1 bg-black p-2 font-mono text-sm overflow-y-auto overscroll-contain text-[#00ff00]"
        }
      >
        <div
          className={
            isModern
              ? "mb-4 border-b border-slate-800 pb-3 text-xs text-slate-500"
              : "opacity-50 text-xs mb-4 border-b border-[#333] pb-1"
          }
        >
          Solidity Workbench (R) Version 26
          <br />
          (C)Copyright Solidity Workbench 2026.
        </div>
        {outputs.length === 0 && <span className="animate-pulse">_</span>}
        {outputs.map((op, i) => (
          <div
            key={i}
            className={
              isModern
                ? "mb-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-3"
                : "mb-4"
            }
          >
            <div
              className={
                isModern
                  ? "mb-2 text-xs font-bold text-white"
                  : "text-white text-xs underline mb-1"
              }
            >
              [{op.label}]
            </div>
            <pre className="max-w-full whitespace-pre-wrap break-all text-xs">
              {stringifyLogData(op.data)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
