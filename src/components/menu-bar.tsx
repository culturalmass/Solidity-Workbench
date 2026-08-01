import type { ThemeMode } from "../../types";

export default function MenuBar({ theme }: { theme: ThemeMode }) {
  if (theme === "modern") {
    return (
      <nav className="flex gap-2 border-b border-slate-200/80 px-5 pb-4 text-sm font-medium text-slate-600">
        {['Dashboard', 'Contracts', 'Deployments', 'Help'].map((item) => (
          <span
            key={item}
            className="cursor-default rounded-full px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-950"
          >
            {item}
          </span>
        ))}
      </nav>
    );
  }

  return (
    <div className="flex gap-4 px-2 py-1 border-b border-[#7f7f7f] text-xs">
      {['File', 'Edit', 'View', 'Help'].map((item) => (
        <span
          key={item}
          className="cursor-default hover:bg-[#000080] hover:text-white px-1"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
