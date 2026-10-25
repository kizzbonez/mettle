// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice A foundation's bursary pool. Donors give ether, the committee awards bursaries to
/// students, and each student claims their own award.
/// @dev This is the code as it was audited. Fix the findings in instructions.md.
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

    function donate() external payable {
        emit Donated(msg.sender, msg.value);
    }

    /// @notice Money that has not been awarded yet.
    function available() public view returns (uint256) {
        return address(this).balance - totalAwarded;
    }

    function award(address student, uint256 amount) external {
        if (amount > available()) revert NotEnoughFunds(available(), amount);
        awarded[student] += amount;
        totalAwarded += amount;
        emit Awarded(student, amount);
    }

    /// @notice Splits `total` equally between `students`.
    function awardEqually(address[] calldata students, uint256 total) external {
        if (students.length == 0) revert NoStudents();
        if (total > available()) revert NotEnoughFunds(available(), total);
        uint256 share = total / students.length;
        for (uint256 i = 0; i < students.length; i++) {
            awarded[students[i]] += share;
            emit Awarded(students[i], share);
        }
        totalAwarded += total;
    }

    function claim() external {
        uint256 amount = awarded[msg.sender];
        if (amount == 0) revert NothingToClaim();
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert PaymentFailed();
        awarded[msg.sender] = 0;
        totalAwarded -= amount;
        emit Claimed(msg.sender, amount);
    }

    function setCommittee(address next) external {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        committee = next;
    }
}
