import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./App";

vi.mock("./lib/blockchain", () => ({
  account: undefined,
  getClients: () => ({
    publicClient: { readContract: vi.fn() },
    walletClient: { writeContract: vi.fn() },
  }),
}));

describe("General Operation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts in Windows 95 mode by default and shows the main workbench shell", async () => {
    render(<Dashboard />);

    expect(screen.getByText(/Solidity_Workbench\.exe/)).toBeInTheDocument();
    expect(screen.getByText("Functions")).toBeInTheDocument();
    expect(screen.getByText("Log Viewer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch theme" })).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem("solidity-workbench-theme")).toBe("win95");
    });
  });

  it("loads the saved modern theme and can switch back to Windows 95", async () => {
    window.localStorage.setItem("solidity-workbench-theme", "modern");

    render(<Dashboard />);

    expect(screen.getByText("Contract Control Center")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Switch to Windows 95 theme" }),
    );

    expect(screen.getByRole("button", { name: "Switch theme" })).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("solidity-workbench-theme")).toBe("win95");
    });
  });

  it("migrates the legacy Web3 Playground theme preference", () => {
    window.localStorage.setItem("web3-playground-theme", "modern");

    render(<Dashboard />);

    expect(screen.getByText("Contract Control Center")).toBeInTheDocument();
  });
});
