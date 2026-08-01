import type { AbiFunction } from "viem";

export function getFunctionFormKey(func: AbiFunction) {
  return `${func.name}(${func.inputs.map((input) => input.type).join(",")})`;
}

export function getInputFormKey(func: AbiFunction, inputIndex: number) {
  return `${getFunctionFormKey(func)}-${inputIndex}`;
}
