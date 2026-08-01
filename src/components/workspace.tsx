import { useState, useMemo } from "react";
import { TerminalOutput } from "./terminal-output";
import type { AbiFunction } from "viem";
import { maxUint256 } from "viem";
import type { ThemeMode } from "../../types";
import { getFunctionFormKey, getInputFormKey } from "../lib/abi-forms";

type OutputEntry = { label: string; data: unknown };

export default function Workspace({
  functions,
  formValues,
  setFormValues,
  handleCall,
  outputs,
  onClearOutputs,
  theme,
}: {
  functions: AbiFunction[];
  formValues: Record<string, string>;
  setFormValues: (value: React.SetStateAction<Record<string, string>>) => void;
  handleCall: (func: AbiFunction) => Promise<void>;
  outputs: OutputEntry[];
  onClearOutputs: () => void;
  theme: ThemeMode;
}) {
  const [activeTab, setActiveTab] = useState<"read" | "write">("read");
  const isModern = theme === "modern";

  const readFunctions = useMemo(
    () =>
      functions.filter(
        (f) =>
          !f.stateMutability ||
          f.stateMutability === "view" ||
          f.stateMutability === "pure",
      ),
    [functions],
  );

  const writeFunctions = useMemo(
    () =>
      functions.filter(
        (f) =>
          f.stateMutability === "nonpayable" || f.stateMutability === "payable",
      ),
    [functions],
  );

  const currentFunctions =
    activeTab === "read" ? readFunctions : writeFunctions;
  const hasContractLoaded = functions.length > 0;

  const tabClass = (tab: "read" | "write") =>
    isModern
      ? `rounded-xl px-4 py-2 text-sm font-semibold transition ${
          activeTab === tab
            ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`
      : `px-2 py-0.5 text-[10px] ${activeTab === tab ? "win95-inset" : "win95-outset"}`;

  return (
    <div
      className={
        isModern
          ? "flex h-full min-h-0 min-w-0 gap-4 overflow-hidden bg-transparent p-5"
          : "flex-1 min-h-0 min-w-0 overflow-hidden flex bg-[#808080] p-2 gap-2"
      }
    >
      <div
        className={
          isModern
            ? "flex h-full min-h-0 min-w-0 w-1/2 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
            : "win95-outset w-1/2 min-w-0 min-h-0 flex flex-col"
        }
      >
        <div
          className={
            isModern
              ? "flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"
              : "bg-[#c0c0c0] px-2 py-0.5 border-b border-[#7f7f7f] text-xs font-bold flex items-center justify-between"
          }
        >
          <div>
            <span
              className={
                isModern
                  ? "text-base font-bold text-slate-950"
                  : "truncate mr-2"
              }
            >
              Functions
            </span>
            {isModern && (
              <p className="text-xs text-slate-500">
                ABI generated read/write actions
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setActiveTab("read")} className={tabClass("read")}>
              Read
            </button>
            <button onClick={() => setActiveTab("write")} className={tabClass("write")}>
              Write
            </button>
          </div>
        </div>

        <div
          className={
            isModern
              ? "flex-1 min-h-0 space-y-4 overflow-y-auto p-5"
              : "flex-1 min-h-0 overflow-y-auto p-4 space-y-6"
          }
        >
          {currentFunctions.length === 0 && (
            <div
              className={
                isModern
                  ? "rounded-3xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 text-sm text-slate-600 shadow-inner"
                  : "win95-inset bg-[#ffffcc] p-4 text-xs"
              }
            >
              {hasContractLoaded ? (
                <div className={isModern ? "space-y-2" : "space-y-2"}>
                  <div className={isModern ? "text-lg font-bold text-slate-950" : "font-bold"}>
                    No {activeTab} functions found
                  </div>
                  <p>
                    This contract does not expose any {activeTab} functions in its ABI.
                  </p>
                </div>
              ) : isModern ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-600/20">
                      🚀
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">
                        No deployment loaded
                      </h3>
                      <p className="text-sm text-slate-500">
                        Deploy contracts to this network to unlock the controls.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-white p-4">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Next step
                    </div>
                    <code className="block rounded-xl bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300">
                      pnpm run deploy
                    </code>
                    <p className="mt-3 text-xs text-slate-500">
                      Choose a network when prompted, then restart the app.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <span>⚠️</span>
                    <span>No deployment loaded</span>
                  </div>
                  <p>
                    No contracts are deployed for the selected network yet.
                  </p>
                  <div className="win95-inset bg-white p-2 font-mono">
                    pnpm run deploy
                  </div>
                  <p className="text-[10px]">
                    Choose a network when prompted, then restart the app.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentFunctions.map((func) => (
            <fieldset
              key={getFunctionFormKey(func)}
              className={
                isModern
                  ? "rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                  : "border-2 border-white border-t-[#7f7f7f] border-l-[#7f7f7f] p-4 relative pt-5"
              }
            >
              <legend
                className={
                  isModern
                    ? "px-2 text-sm font-bold text-slate-900"
                    : "absolute -top-2 left-2 bg-[#c0c0c0] px-1 text-xs font-bold"
                }
              >
                {func.name}
              </legend>
              <div className="space-y-4">
                {func.inputs.map((input, inputIndex) => (
                  <div key={getInputFormKey(func, inputIndex)} className="flex flex-col gap-1.5">
                    <label
                      className={
                        isModern
                          ? "text-xs font-semibold uppercase tracking-wide text-slate-500"
                          : "text-xs"
                      }
                    >
                      {input.name || `input ${inputIndex + 1}`} ({input.type})
                    </label>
                    <input
                      className={
                        isModern
                          ? "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          : "win95-inset w-full px-1 py-0.5 text-sm outline-none focus:bg-[#ffffcc]"
                      }
                      value={formValues[getInputFormKey(func, inputIndex)] ?? ""}
                      onChange={(e) => {
                        const inputKey = getInputFormKey(func, inputIndex);
                        setFormValues((prev) => ({
                          ...prev,
                          [inputKey]: e.target.value,
                        }));
                      }}
                    />
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCall(func)}
                    className={
                      isModern
                        ? "rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                        : "win95-outset px-6 py-1 text-xs active:translate-x-px active:translate-y-px active:shadow-none hover:bg-[#d0d0d0]"
                    }
                  >
                    {isModern ? "Execute" : <><span className="underline italic">E</span>xecute</>}
                  </button>
                  {func.name === "approve" && (
                    <button
                      onClick={() => {
                        const amountInputIndex = func.inputs.findIndex((i) =>
                          i.type.includes("int"),
                        );
                        if (amountInputIndex >= 0) {
                          setFormValues((prev) => ({
                            ...prev,
                            [getInputFormKey(func, amountInputIndex)]:
                              maxUint256.toString(),
                          }));
                        }
                      }}
                      className={
                        isModern
                          ? "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          : "win95-outset px-4 py-1 text-xs active:translate-x-px active:translate-y-px active:shadow-none hover:bg-[#d0d0d0]"
                      }
                    >
                      MaxAllowance
                    </button>
                  )}
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <TerminalOutput outputs={outputs} onClear={onClearOutputs} theme={theme} />
    </div>
  );
}
