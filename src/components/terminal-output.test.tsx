import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TerminalOutput } from "./terminal-output";

describe("Log Visualizer", () => {
  it("renders an idle prompt and disables clear when there are no logs", () => {
    render(<TerminalOutput outputs={[]} onClear={vi.fn()} theme="win95" />);

    expect(screen.getByText("Log Viewer")).toBeInTheDocument();
    expect(screen.getByText("_")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("renders structured log data, including bigint values, and clears on request", async () => {
    const onClear = vi.fn();
    render(
      <TerminalOutput
        outputs={[{ label: "Read: balanceOf", data: { balance: 12n } }]}
        onClear={onClear}
        theme="modern"
      />,
    );

    expect(screen.getByText("[Read: balanceOf]")).toBeInTheDocument();
    expect(screen.getByText(/"balance": "12"/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
