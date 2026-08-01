import { describe, expect, it } from "vitest";
import type { AbiFunction } from "viem";
import { getFunctionFormKey, getInputFormKey } from "./abi-forms";

function abiFunction(
  name: string,
  inputTypes: string[],
  inputName = "value",
): AbiFunction {
  return {
    type: "function",
    name,
    stateMutability: "nonpayable",
    inputs: inputTypes.map((type) => ({ name: inputName, type })),
    outputs: [],
  } as AbiFunction;
}

describe("ABI form keys", () => {
  it("separates inputs that share the same ABI name", () => {
    const func = abiFunction("transfer", ["address", "uint256"], "value");

    expect(getInputFormKey(func, 0)).toBe("transfer(address,uint256)-0");
    expect(getInputFormKey(func, 1)).toBe("transfer(address,uint256)-1");
    expect(getInputFormKey(func, 0)).not.toBe(getInputFormKey(func, 1));
  });

  it("separates overloaded functions with the same name", () => {
    const addressTransfer = abiFunction("transfer", ["address", "uint256"]);
    const batchTransfer = abiFunction("transfer", ["address[]", "uint256[]"]);

    expect(getFunctionFormKey(addressTransfer)).toBe("transfer(address,uint256)");
    expect(getFunctionFormKey(batchTransfer)).toBe("transfer(address[],uint256[])");
    expect(getInputFormKey(addressTransfer, 0)).not.toBe(
      getInputFormKey(batchTransfer, 0),
    );
  });
});
