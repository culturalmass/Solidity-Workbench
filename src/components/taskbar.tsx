import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { NetworkConfig, ThemeMode } from "../../types";

export default function Taskbar({
  currentAddress,
  selectedNetwork,
  theme,
  setTheme,
}: {
  currentAddress: string;
  selectedNetwork: NetworkConfig;
  theme: ThemeMode;
  setTheme: Dispatch<SetStateAction<ThemeMode>>;
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (theme === "modern") {
    return (
      <footer className="mt-3 flex h-12 items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 text-sm text-slate-600 shadow-lg shadow-slate-900/5 backdrop-blur">
        <div className="font-semibold text-slate-950">Solidity Workbench</div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="min-w-0 flex-1 truncate font-mono text-xs">
          {currentAddress}
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {selectedNetwork.name}
        </div>
        <div className="font-mono text-xs">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </footer>
    );
  }

  return (
    <footer className="h-8 mt-1 flex items-center px-2 gap-2 transition-all bg-[#c0c0c0] border-t-2 border-white">
      <button className="flex items-center gap-1 px-2 h-6 font-bold text-sm active:inset-shadow win95-outset italic">
        <div className="w-4 h-4 bg-zinc-400 border border-white mr-1" />
        Start
      </button>

      <div className="w-px h-5 bg-[#7f7f7f] mx-1 border-r border-white" />

      <div className="flex-1 h-6 flex items-center px-2 text-xs font-bold truncate win95-inset bg-[#c0c0c0]">
        {currentAddress}
      </div>

      <div className="h-6 px-2 flex items-center text-xs gap-2 win95-inset bg-[#c0c0c0]">
        <span className="text-[10px] text-zinc-600 border-r border-[#7f7f7f] pr-2">
          🌐 {selectedNetwork.name}
        </span>
        <button
          type="button"
          aria-label="Switch theme"
          title="Switch theme"
          className="win95-outset flex h-5 w-6 items-center justify-center bg-[#c0c0c0] active:win95-inset"
          onClick={() => setTheme("modern")}
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            viewBox="0 0 16 16"
            shapeRendering="crispEdges"
          >
            <path fill="#000" d="M1 2h14v10H1zM5 13h6v1H5zM4 14h8v1H4z" />
            <path fill="#c0c0c0" d="M2 3h12v8H2z" />
            <path fill="#008080" d="M3 4h10v6H3z" />
            <path fill="#fff" d="M4 5h3v2H4z" />
            <path fill="#000080" d="M4 5h3v1H4z" />
            <path fill="#ff00ff" d="M8 5h2v2H8z" />
            <path fill="#ffff00" d="M10 7h2v2h-2z" />
            <path fill="#00ff00" d="M7 8h2v1H7z" />
          </svg>
        </button>
        <span className="font-mono border-l border-[#7f7f7f] pl-2">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </footer>
  );
}
