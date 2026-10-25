// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice A foundation's bursary pool. Donors give ether, the committee awards bursaries to
/// students, and each student claims their own award.
/// @dev The audit's findings are fixed: H-01 (committee check on both award functions), H-02
/// (checks-effects-interactions in claim), M-01 (only what was handed out is recorded) and
/// L-01 (event and zero check in setCommittee).
contract BursaryPool {
    address public immutable owner;
    address public committee;
    /// @notice The sum of all awards that are not claimed yet.
    uint256 public totalAwarded;
    mapping(address => uint256) public awarded;

    event Donated(address indexed donor, uint256 amount);
    event Awarded(address indexed student, uint256 amount);
    event Claimed(address indexed student, uint256 amount);
    event CommitteeChanged(address indexed previous, address indexed next);

    error NotOwner(address caller);
    error NotCommittee(address caller);
    error NotEnoughFunds(uint256 available, uint256 needed);
    error NothingToClaim();
    error NoStudents();
    error ZeroAddress();
    error PaymentFailed();

    constructor(address committee_) {
        owner = msg.sender;
        committee = committee_;
    }

    /// @dev H-01: every function that creates awards needs this check.
    modifier onlyCommittee() {
        if (msg.sender != committee) revert NotCommittee(msg.sender);
        _;
    }

    function donate() external payable {
        emit Donated(msg.sender, msg.value);
    }

    /// @notice Money that has not been awarded yet.
    function available() public view returns (uint256) {
        return address(this).balance - totalAwarded;
    }

    /// @notice Awards `amount` wei to `student`. Committee only.
    function award(address student, uint256 amount) external onlyCommittee {
        if (amount > available()) revert NotEnoughFunds(available(), amount);
        awarded[student] += amount;
        totalAwarded += amount;
        emit Awarded(student, amount);
    }

    /// @notice Splits `total` equally between `students`. Committee only. The remainder of the
    /// division is not awarded and stays available.
    function awardEqually(address[] calldata students, uint256 total) external onlyCommittee {
        if (students.length == 0) revert NoStudents();
        if (total > available()) revert NotEnoughFunds(available(), total);
        uint256 share = total / students.length;
        for (uint256 i = 0; i < students.length; i++) {
            awarded[students[i]] += share;
            emit Awarded(students[i], share);
        }
        // M-01: record what was handed out, not what was asked for.
        totalAwarded += share * students.length;
    }

    /// @notice Pays the caller's whole award.
    function claim() external {
        uint256 amount = awarded[msg.sender];
        if (amount == 0) revert NothingToClaim();
        // H-02: effects before the interaction, so a reentrant call finds nothing to claim.
        awarded[msg.sender] = 0;
        totalAwarded -= amount;
        emit Claimed(msg.sender, amount);
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }

    /// @notice Replaces the committee. Owner only.
    function setCommittee(address next) external {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        if (next == address(0)) revert ZeroAddress();
        emit CommitteeChanged(committee, next);
        committee = next;
    }
}
