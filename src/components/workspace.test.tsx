import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AbiFunction } from "viem";
import { maxUint256 } from "viem";
import Workspace from "./workspace";
import { getInputFormKey } from "../lib/abi-forms";

function func(
  name: string,
  stateMutability: AbiFunction["stateMutability"],
  inputs: { name: string; type: string }[] = [],
): AbiFunction {
  return {
    type: "function",
    name,
    stateMutability,
    inputs,
    outputs: [],
  } as AbiFunction;
}

describe("Functions Operability", () => {
  it("keeps sibling inputs isolated and executes the selected function", async () => {
    const approve = func("approve", "nonpayable", [
      { name: "value", type: "address" },
      { name: "value", type: "uint256" },
    ]);
    const handleCall = vi.fn().mockResolvedValue(undefined);
    let formValues: Record<string, string> = {};
    const setFormValues = vi.fn((update) => {
      formValues = typeof update === "function" ? update(formValues) : update;
      rerenderView();
    });

    const renderResult = render(
      <Workspace
        functions={[approve]}
        formValues={formValues}
        setFormValues={setFormValues}
        handleCall={handleCall}
        outputs={[]}
        onClearOutputs={vi.fn()}
        theme="modern"
      />,
    );

    const rerenderView = () => {
      renderResult.rerender(
        <Workspace
          functions={[approve]}
          formValues={formValues}
          setFormValues={setFormValues}
          handleCall={handleCall}
          outputs={[]}
          onClearOutputs={vi.fn()}
          theme="modern"
        />,
      );
    };

    await userEvent.click(screen.getByRole("button", { name: "Write" }));
    const inputs = screen.getAllByRole("textbox");

    await userEvent.type(inputs[0], "0xabc");
    await userEvent.type(inputs[1], "42");

    expect(formValues[getInputFormKey(approve, 0)]).toBe("0xabc");
    expect(formValues[getInputFormKey(approve, 1)]).toBe("42");

    await userEvent.click(screen.getByRole("button", { name: "Execute" }));

    expect(handleCall).toHaveBeenCalledWith(approve);
  });

  it("separates read and write functions and can fill max allowance", async () => {
    const balanceOf = func("balanceOf", "view", [{ name: "owner", type: "address" }]);
    const approve = func("approve", "nonpayable", [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ]);
    let formValues: Record<string, string> = {};
    const setFormValues = vi.fn((update) => {
      formValues = typeof update === "function" ? update(formValues) : update;
      rerenderView();
    });

    const renderResult = render(
      <Workspace
        functions={[balanceOf, approve]}
        formValues={formValues}
        setFormValues={setFormValues}
        handleCall={vi.fn()}
        outputs={[]}
        onClearOutputs={vi.fn()}
        theme="modern"
      />,
    );

    const rerenderView = () => {
      renderResult.rerender(
        <Workspace
          functions={[balanceOf, approve]}
          formValues={formValues}
          setFormValues={setFormValues}
          handleCall={vi.fn()}
          outputs={[]}
          onClearOutputs={vi.fn()}
          theme="modern"
        />,
      );
    };

    expect(screen.getByText("balanceOf")).toBeInTheDocument();
    expect(screen.queryByText("approve")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Write" }));
    const approveGroup = screen.getByRole("group", { name: "approve" });

    expect(within(approveGroup).getByText("approve")).toBeInTheDocument();
    expect(screen.queryByText("balanceOf")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "MaxAllowance" }));

    expect(formValues[getInputFormKey(approve, 1)]).toBe(maxUint256.toString());
    expect(formValues[getInputFormKey(approve, 0)]).toBeUndefined();
  });
});
