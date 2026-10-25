// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Neighbours pledge ether for a mural until the deadline. If the pledges reach the goal,
/// the painters share them; otherwise every backer takes their pledge back. Nobody is ever paid
/// by a push: everyone withdraws their own money.
contract MuralPot {
    enum Stage {
        Pledging,
        Funded,
        Failed
    }

    address[] public painters; // painters[0] is the lead painter
    uint256 public immutable goal;
    uint256 public immutable deadline;
    Stage public stage;
    uint256 public totalPledged;
    mapping(address backer => uint256) public pledged;
    mapping(address painter => uint256) public owed;

    event Pledged(address indexed backer, uint256 amount);
    event StageChanged(Stage from, Stage to);
    event Withdrawn(address indexed to, uint256 amount);

    error NoPainters();
    error WrongStage(Stage expected, Stage actual);
    error ZeroPledge();
    error TooEarly(uint256 deadline);
    error NothingToWithdraw(address who);
    error TransferFailed(address to);

    constructor(address[] memory painters_, uint256 goal_, uint256 deadline_) {
        if (painters_.length == 0) revert NoPainters();
        painters = painters_;
        goal = goal_;
        deadline = deadline_;
    }

    /// @dev Once the deadline has come, the pot leaves Pledging before anything else runs.
    modifier timedTransitions() {
        if (stage == Stage.Pledging && block.timestamp >= deadline) _finish();
        _;
    }

    modifier atStage(Stage expected) {
        if (stage != expected) revert WrongStage(expected, stage);
        _;
    }

    /// @notice Pledge ether before the deadline.
    function pledge() external payable timedTransitions atStage(Stage.Pledging) {
        if (msg.value == 0) revert ZeroPledge();
        pledged[msg.sender] += msg.value;
        totalPledged += msg.value;
        emit Pledged(msg.sender, msg.value);
    }

    /// @notice Anyone may close pledging once the deadline has come.
    function finish() external timedTransitions {
        if (stage == Stage.Pledging) revert TooEarly(deadline);
    }

    /// @notice A backer of a failed pot takes their pledge back.
    function refund() external timedTransitions atStage(Stage.Failed) {
        uint256 amount = pledged[msg.sender];
        if (amount == 0) revert NothingToWithdraw(msg.sender);
        pledged[msg.sender] = 0;
        _send(msg.sender, amount);
    }

    /// @notice A painter of a funded pot takes their share.
    function withdraw() external timedTransitions atStage(Stage.Funded) {
        uint256 amount = owed[msg.sender];
        if (amount == 0) revert NothingToWithdraw(msg.sender);
        owed[msg.sender] = 0;
        _send(msg.sender, amount);
    }

    function painterCount() external view returns (uint256) {
        return painters.length;
    }

    /// @dev Decides the outcome and credits the painters' shares; the lead painter gets the
    /// remainder, so the shares add up to exactly totalPledged.
    function _finish() private {
        Stage next = totalPledged >= goal ? Stage.Funded : Stage.Failed;
        emit StageChanged(stage, next);
        stage = next;
        if (next == Stage.Funded) {
            uint256 n = painters.length;
            uint256 each = totalPledged / n;
            for (uint256 i = 0; i < n; i++) {
                owed[painters[i]] += each;
            }
            owed[painters[0]] += totalPledged % n;
        }
    }

    /// @dev The only place ether leaves: always after the state is updated.
    function _send(address to, uint256 amount) private {
        emit Withdrawn(to, amount);
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed(to);
    }
}
