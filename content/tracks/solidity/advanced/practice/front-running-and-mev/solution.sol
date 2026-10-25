// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title The lantern-festival treasure hunt
/// @notice Finders race to claim the prize pot by proving they know the secret phrase. A naive
/// one-step claim can be front-run: a searcher copies the phrase from the mempool and sends the
/// same claim with a higher fee. This contract uses commit-reveal, so the first finder to commit
/// wins and a searcher cannot commit and reveal in the same block after seeing the phrase.
contract TreasureHunt {
    /// @notice Blocks that must pass between a commit and its reveal.
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

    /// @notice Tops up the prize pot. Anyone may contribute.
    function fund() external payable {}

    /// @notice Commits to a phrase without revealing it. `commitment` must be
    /// `keccak256(abi.encode(phrase, salt, msg.sender))`, so only the committer can open it.
    function commit(bytes32 commitment) external {
        if (!committed[commitment]) committedAt[commitment] = block.number;
        committed[commitment] = true;
        emit Committed(commitment);
    }

    /// @notice Opens the caller's commitment and, if the phrase is right, wins the pot.
    function reveal(bytes32 phrase, bytes32 salt) external {
        if (won) revert AlreadyWon();
        bytes32 commitment = keccak256(abi.encode(phrase, salt, msg.sender));
        if (!committed[commitment]) revert NoCommitment();
        uint256 allowedFrom = committedAt[commitment] + REVEAL_DELAY;
        if (block.number < allowedFrom) revert RevealTooEarly(block.number, allowedFrom);
        if (keccak256(abi.encode(phrase)) != answer) revert WrongPhrase();

        won = true;
        winner = msg.sender;
        uint256 prize = address(this).balance;
        emit Won(msg.sender, prize);
        (bool ok,) = msg.sender.call{value: prize}("");
        if (!ok) revert PaymentFailed();
    }
}
