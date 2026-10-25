// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title The lantern-festival treasure hunt
/// @notice Finders race to claim the prize pot by proving they know the secret phrase.
/// @dev This reveal can be front-run. A commitment can be opened in the same block it was made,
/// so a searcher who sees a phrase in the mempool can commit it and reveal it in one bundle,
/// ahead of the finder. Enforce the `REVEAL_DELAY` so a reveal must come in a later block than
/// its commit.
contract TreasureHunt {
    uint256 public constant REVEAL_DELAY = 1;

    bytes32 public immutable answer; // keccak256(abi.encode(phrase))
    bool public won;
    address public winner;
    mapping(bytes32 commitment => bool) public committed;
    mapping(bytes32 commitment => uint256 blockNumber) public committedAt;

    event Committed(bytes32 indexed commitment);
    event Won(address indexed winner, uint256 prize);

    error NoCommitment();
    error RevealTooEarly(uint256 nowBlock, uint256 allowedFrom);
    error WrongPhrase();
    error AlreadyWon();
    error PaymentFailed();

    constructor(bytes32 answer_) {
        answer = answer_;
    }

    function fund() external payable {}

    /// @notice Commits to a phrase. `commitment` is `keccak256(abi.encode(phrase, salt, msg.sender))`.
    function commit(bytes32 commitment) external {
        if (!committed[commitment]) committedAt[commitment] = block.number;
        committed[commitment] = true;
        emit Committed(commitment);
    }

    function reveal(bytes32 phrase, bytes32 salt) external {
        if (won) revert AlreadyWon();
        bytes32 commitment = keccak256(abi.encode(phrase, salt, msg.sender));
        if (!committed[commitment]) revert NoCommitment();
        // Missing: a check that enough blocks have passed since the commit.
        if (keccak256(abi.encode(phrase)) != answer) revert WrongPhrase();

        won = true;
        winner = msg.sender;
        uint256 prize = address(this).balance;
        emit Won(msg.sender, prize);
        (bool ok,) = msg.sender.call{value: prize}("");
        if (!ok) revert PaymentFailed();
    }
}
