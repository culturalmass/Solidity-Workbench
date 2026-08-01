import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenBuild", (m) => {
  const initialHolder = m.getAccount(0);

  const usdt = m.contract("USDT", [initialHolder]);
  const usdc = m.contract("USDC", [initialHolder]);

  return { usdt, usdc };
});
