// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Simple ERC20 with fixed max supply minted on deploy.
/// @dev No fees, no blacklist, no pausable, no mint after deploy.
contract USDT is ERC20, Ownable {
    uint256 public immutable maxSupply = 1000000 * 10 ** 18;

    /// @notice Deploys Bankii and mints full supply to `initialHolder`
    /// @param initialHolder The wallet receiving the entire supply
    constructor(
        address initialHolder
    ) ERC20("Usdt", "USDT") Ownable(msg.sender) {
        require(initialHolder != address(0), "Invalid initial holder");

        // Mint entire supply to the specified wallet
        _mint(initialHolder, maxSupply);
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     * @param amount The amount of tokens to destroy.
     */
    function burn(uint256 amount) public virtual {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's allowance.
     * @param account The account to burn tokens from.
     * @param amount The amount of tokens to destroy.
     */
    function burnFrom(address account, uint256 amount) public virtual {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    /**
     * @dev Withdraws Ether from the contract.
     * @param recipient The recipient of the Ether.
     * @param amount The amount of Ether to withdraw.
     */
    function withdraw(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid Address!");
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    /**
     * @dev Withdraws ERC20 tokens from the contract.
     * @param token The ERC20 token to withdraw.
     * @param recipient The recipient of the tokens.
     * @param amount The amount of tokens to withdraw.
     */
    function withdrawToken(
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(recipient != address(0), "Invalid recipient address!");
        require(token != address(0), "Invalid token address!");
        bool sent = IERC20(token).transfer(recipient, amount);
        require(sent, "Failed to send tokens");
    }
}
