import type { NetworkConfig, ThemeMode } from "../../types";

export default function TitleBar({
  selectedNetwork,
  theme,
}: {
  selectedNetwork: NetworkConfig;
  theme: ThemeMode;
}) {
  if (theme === "modern") {
    return (
      <header className="flex items-center justify-between gap-4 px-6 py-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Solidity Workbench
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Contract Control Center
          </h1>
          <p className="text-sm text-slate-500">
            Connected workspace for {selectedNetwork.name}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          Chain {selectedNetwork.chainId}
        </div>
      </header>
    );
  }

  return (
    <div className="win95-titlebar">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-zinc-400 border border-white flex items-center justify-center text-[10px] text-black italic">
          S
        </div>
        <span>Solidity_Workbench.exe - [{selectedNetwork.name}]</span>
      </div>
      <div className="flex gap-1">
        <button className="win95-outset w-4 h-4 text-black text-[10px] flex items-center justify-center font-bold pb-1">
          _
        </button>
        <button className="win95-outset w-4 h-4 text-black text-[10px] flex items-center justify-center font-bold">
          x
        </button>
      </div>
    </div>
  );
}
