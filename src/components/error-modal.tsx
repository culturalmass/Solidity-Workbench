import type { ThemeMode } from "../../types";

export default function ErrorModal({
  title,
  message,
  onClose,
  theme,
}: {
  title: string;
  message: string;
  onClose: () => void;
  theme: ThemeMode;
}) {
  if (theme === "modern") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-xl">
              ⚠️
            </div>
            <div>
              <h2 className="font-bold text-slate-950">{title}</h2>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Action required
              </p>
            </div>
          </div>
          <p className="mb-6 text-sm leading-6 text-slate-600">{message}</p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="win95-outset w-80 flex flex-col">
        <div className="win95-titlebar">
          <div className="flex items-center gap-1">
            <span>⚠️ {title}</span>
          </div>
          <button
            onClick={onClose}
            className="win95-outset w-4 h-4 text-black text-[10px] flex items-center justify-center font-bold"
          >
            x
          </button>
        </div>

        <div className="bg-[#c0c0c0] p-4 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">🚫</span>
            <p className="text-xs leading-relaxed">{message}</p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="win95-outset px-8 py-1 text-xs active:translate-x-px active:translate-y-px active:shadow-none hover:bg-[#d0d0d0] font-bold"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
