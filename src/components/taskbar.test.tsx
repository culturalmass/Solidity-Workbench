import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Taskbar from "./taskbar";
import type { NetworkConfig } from "../../types";

const selectedNetwork: NetworkConfig = {
  name: "baseSepolia",
  chainId: 84532,
  rpcUrl: "https://example.invalid",
};

describe("Theme manager", () => {
  it("switches from Windows 95 mode to modern mode from the taskbar", async () => {
    const setTheme = vi.fn();

    render(
      <Taskbar
        currentAddress="0x123"
        selectedNetwork={selectedNetwork}
        theme="win95"
        setTheme={setTheme}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Switch theme" }));

    expect(setTheme).toHaveBeenCalledWith("modern");
  });

  it("renders modern status information without the legacy switch", () => {
    render(
      <Taskbar
        currentAddress="0xabc"
        selectedNetwork={selectedNetwork}
        theme="modern"
        setTheme={vi.fn()}
      />,
    );

    expect(screen.getByText("Solidity Workbench")).toBeInTheDocument();
    expect(screen.getByText("0xabc")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Switch theme" })).not.toBeInTheDocument();
  });
});
