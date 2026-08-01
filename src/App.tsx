import { useState, useEffect, useMemo } from "react";
import { getClients, account } from "./lib/blockchain";
import type { Abi, AbiFunction } from "viem";
import type { DeployedAddresses, NetworkConfig, ThemeMode } from "../types";
import ErrorModal from "./components/error-modal";
import TitleBar from "./components/title-bar";
import MenuBar from "./components/menu-bar";
import { networkList } from "./lib/constants";
import Toolbar from "./components/toolbar";
import Workspace from "./components/workspace";
import Taskbar from "./components/taskbar";
import { getInputFormKey } from "./lib/abi-forms";

type OutputEntry = { label: string; data: unknown };
type JsonModule<T extends object> = { default?: T } & T;
type ArtifactJson = { abi: Abi };

const MAX_OUTPUT_ENTRIES = 50;
const THEME_STORAGE_KEY = "solidity-workbench-theme";
const LEGACY_THEME_STORAGE_KEY = "web3-playground-theme";

// ✅ Glob ALL chains upfront — filter dynamically by selected chainId
const artifactModules = import.meta.glob(
  "../ignition/deployments/chain-*/artifacts/*.json",
  { eager: true },
);

const deployedAddressesModules = import.meta.glob(
  "../ignition/deployments/chain-*/deployed_addresses.json",
  { eager: true },
);

export default function Dashboard() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "win95";
    const savedTheme =
      window.localStorage.getItem(THEME_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    return savedTheme === "modern" ? "modern" : "win95";
  });
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig>(() => {
    return (
      networkList.find((net) => {
        const path = `../ignition/deployments/chain-${net.chainId}/deployed_addresses.json`;
        return !!deployedAddressesModules[path];
      }) ?? networkList[0]
    );
  });
  const { publicClient, walletClient } = useMemo(
    () => getClients(selectedNetwork),
    [selectedNetwork],
  );

  const [deployedAddresses, setDeployedAddresses] = useState<DeployedAddresses>(
    {},
  );
  const [contractKeys, setContractKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [contractAbi, setContractAbi] = useState<Abi | null>(null);
  const [outputs, setOutputs] = useState<OutputEntry[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<{ title: string; message: string } | null>(
    null,
  );

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // ✅ Network change — load deployed_addresses for that chain
  useEffect(() => {
    const chainId = selectedNetwork.chainId;
    const addressesPath = `../ignition/deployments/chain-${chainId}/deployed_addresses.json`;
    const addressesModule = deployedAddressesModules[addressesPath] as
      | JsonModule<DeployedAddresses>
      | undefined;

    if (!addressesModule) {
      setDeployedAddresses({});
      setContractKeys([]);
      setSelectedKey("");
      setContractAbi(null);
      setModal(null);
      return;
    }

    const addresses = (addressesModule.default ??
      addressesModule) as DeployedAddresses;
    const keys = Object.keys(addresses);

    setDeployedAddresses(addresses);
    setContractKeys(keys);
    setSelectedKey(keys[0] ?? "");
    setContractAbi(null);
    setModal(null);
  }, [selectedNetwork]);

  // ✅ Contract change — load ABI for selected contract on current chain
  useEffect(() => {
    if (!selectedKey) return;

    const chainId = selectedNetwork.chainId;
    const safeKey = selectedKey.replace("#", "_");
    const artifactPath = `../ignition/deployments/chain-${chainId}/artifacts/${safeKey}.json`;
    const moduleData = artifactModules[artifactPath] as
      | JsonModule<ArtifactJson>
      | undefined;

    if (!moduleData) {
      setContractAbi(null);
      setModal({
        title: "Artifact Not Found",
        message: `Artifact for contract "${selectedKey}" was not found in chain-${chainId}.\n\nThe deployment may be incomplete or the artifact file is missing.`,
      });
      return;
    }

    const resolved = moduleData.default ?? moduleData;
    setContractAbi(resolved.abi);
    setModal(null);
  }, [selectedKey, selectedNetwork]);

  const functions =
    (contractAbi?.filter((item) => item.type === "function") as AbiFunction[]) ??
    [];

  const addOutput = (entry: OutputEntry) => {
    setOutputs((prev) => [entry, ...prev].slice(0, MAX_OUTPUT_ENTRIES));
  };

  const handleCall = async (func: AbiFunction) => {
    const currentAddress = deployedAddresses[selectedKey] as `0x${string}`;
    if (!contractAbi || !currentAddress) return;

    const args = func.inputs.map((input, inputIndex) => {
      const val = formValues[getInputFormKey(func, inputIndex)];

      if (input.type.includes("int")) {
        return BigInt(val || "0");
      }

      if (input.type === "bool") {
        return val === "true";
      }

      return val;
    });

    try {
      if (func.stateMutability === "view" || func.stateMutability === "pure") {
        const result = await publicClient.readContract({
          address: currentAddress,
          abi: contractAbi,
          functionName: func.name,
          args,
        });
        addOutput({ label: `Read: ${func.name}`, data: result });
      } else {
        if (!account) {
          const warningMessage =
            "Missing VITE_PRIVATE_KEY. The app is running in read-only mode. Add a valid private key to .env and restart the dev server to execute write functions.";

          setModal({
            title: "Wallet Warning",
            message: warningMessage,
          });
          addOutput({
            label: `Error: ${func.name}`,
            data: warningMessage,
          });
          return;
        }

        const hash = await walletClient.writeContract({
          address: currentAddress,
          abi: contractAbi,
          functionName: func.name,
          args,
          account,
        });
        addOutput({ label: `TX Sent: ${func.name}`, data: hash });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        addOutput({ label: `Confirmed: ${func.name}`, data: receipt });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "shortMessage" in err
            ? String(err.shortMessage)
            : "Unknown error";

      addOutput({
        label: `Error: ${func.name}`,
        data: message,
      });
    }
  };

  const currentAddress = deployedAddresses[selectedKey] ?? "N/A";

  const isModern = theme === "modern";

  if (isModern) {
    return (
      <div className="flex h-screen min-h-screen min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe,#f8fafc_38%,#eef2ff)] text-slate-950 font-sans antialiased">
        {modal && (
          <ErrorModal
            title={modal.title}
            message={modal.message}
            onClose={() => setModal(null)}
            theme={theme}
          />
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 lg:p-6">
          <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Contract Control Center
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Solidity Workbench
              </h1>
              <p className="text-sm text-slate-500">
                Manage contracts, networks, calls, and execution output.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-right shadow-lg shadow-slate-900/5 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Wallet / Contract
                </div>
                <div className="max-w-72 truncate font-mono text-xs text-slate-700">
                  {currentAddress}
                </div>
              </div>
              <button
                type="button"
                aria-label="Switch to Windows 95 theme"
                title="Switch to Windows 95 theme"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-slate-900/5 transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                onClick={() => setTheme("win95")}
              >
                <svg
                  aria-hidden="true"
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  shapeRendering="crispEdges"
                >
                  <path fill="#334155" d="M3 4h18v12H3zM8 18h8v2H8zM6 20h12v1H6z" />
                  <path fill="#e2e8f0" d="M4 5h16v10H4z" />
                  <path fill="#38bdf8" d="M5 6h14v8H5z" />
                  <path fill="#0f172a" d="M5 6h14v2H5z" opacity=".25" />
                  <path fill="#fff" d="M7 9h4v3H7z" />
                  <path fill="#2563eb" d="M7 9h4v1H7z" />
                  <path fill="#f472b6" d="M13 9h3v3h-3z" />
                  <path fill="#fde047" d="M15 12h3v2h-3z" />
                </svg>
              </button>
            </div>
          </header>

          <section className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Network</div>
              <div className="mt-2 text-xl font-bold">{selectedNetwork.name}</div>
              <div className="font-mono text-xs text-slate-500">Chain {selectedNetwork.chainId}</div>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Contracts</div>
              <div className="mt-2 text-xl font-bold">{contractKeys.length}</div>
              <div className="text-xs text-slate-500">available on this network</div>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Activity</div>
              <div className="mt-2 text-xl font-bold">{outputs.length}</div>
              <div className="text-xs text-slate-500">recent log entries</div>
            </div>
          </section>

          <section className="mb-5 overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur">
            <Toolbar
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
              currentAddress={currentAddress}
              contractKeys={contractKeys}
              theme={theme}
            />
          </section>

          <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-2xl shadow-slate-900/10 backdrop-blur">
            <Workspace
              functions={functions}
              formValues={formValues}
              setFormValues={setFormValues}
              handleCall={handleCall}
              outputs={outputs}
              onClearOutputs={() => setOutputs([])}
              theme={theme}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 flex flex-col h-screen overflow-hidden transition-all min-w-0">
      {modal && (
        <ErrorModal
          title={modal.title}
          message={modal.message}
          onClose={() => setModal(null)}
          theme={theme}
        />
      )}

      {/* Main Application Window */}
      <div className="win95-outset flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
        {/* Title Bar */}

        <TitleBar selectedNetwork={selectedNetwork} theme={theme} />

        {/* Menu Bar */}
        <MenuBar theme={theme} />

        {/* Toolbar */}
        <Toolbar
          selectedKey={selectedKey}
          setSelectedKey={setSelectedKey}
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={setSelectedNetwork}
          currentAddress={currentAddress}
          contractKeys={contractKeys}
          theme={theme}
        />

        {/* Workspace */}
        <Workspace
          functions={functions}
          formValues={formValues}
          setFormValues={setFormValues}
          handleCall={handleCall}
          outputs={outputs}
          onClearOutputs={() => setOutputs([])}
          theme={theme}
        />
      </div>

      {/* Taskbar */}
      <Taskbar
        currentAddress={currentAddress}
        selectedNetwork={selectedNetwork}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
}
