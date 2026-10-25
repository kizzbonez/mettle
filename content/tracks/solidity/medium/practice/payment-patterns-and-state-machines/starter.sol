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

    // Task 1: once the deadline has come, leave Pledging (call _finish) before the body runs.
    modifier timedTransitions() {
        revert("not implemented: timedTransitions");
        _;
    }

    // Task 2: revert with WrongStage(expected, stage) unless the pot is in `expected`.
    modifier atStage(Stage expected) {
        revert("not implemented: atStage");
        _;
    }

    // Task 3
    function pledge() external payable timedTransitions atStage(Stage.Pledging) {
        revert("not implemented: pledge");
    }

    // Task 4
    function finish() external timedTransitions {
        revert("not implemented: finish");
    }

    // Task 5
    function refund() external timedTransitions atStage(Stage.Failed) {
        revert("not implemented: refund");
    }

    // Task 6
    function withdraw() external timedTransitions atStage(Stage.Funded) {
        revert("not implemented: withdraw");
    }

    function painterCount() external view returns (uint256) {
        return painters.length;
    }

    // Task 7: decide Funded or Failed, emit StageChanged, store the stage and credit the shares.
    function _finish() private {
        revert("not implemented: _finish");
    }

    /// @dev Sends `amount` to `to` and reverts with TransferFailed if the recipient refuses.
    /// Call it only after your state changes are done.
    function _send(address to, uint256 amount) private {
        emit Withdrawn(to, amount);
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed(to);
    }
}
