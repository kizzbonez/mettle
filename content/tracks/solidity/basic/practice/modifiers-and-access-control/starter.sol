// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TelescopeRota {
    address public director;
    address public candidate;
    bool public paused;
    mapping(address => bool) public isObserver;
    mapping(uint256 => address) public observerOn;

    event ObserverSet(address indexed account, bool allowed);
    event NightBooked(uint256 indexed night, address indexed observer);
    event DirectorshipOffered(address indexed director, address indexed candidate);
    event DirectorChanged(address indexed previousDirector, address indexed newDirector);
    event Paused(address by);
    event Unpaused(address by);

    error NotDirector(address caller);
    error NotObserver(address caller);
    error NotCandidate(address caller);
    error RotaPaused();
    error NightTaken(uint256 night, address observer);

    constructor() {
        director = msg.sender;
    }

    modifier onlyDirector() {
        if (msg.sender != director) revert NotDirector(msg.sender);
        _;
    }

    // Task 1: write the onlyObserver modifier here.

    // Task 2: write the whenNotPaused modifier here.

    function setObserver(address account, bool allowed) external onlyDirector {
        isObserver[account] = allowed;
        emit ObserverSet(account, allowed);
    }

    // Task 3: only the director may pause and unpause. Add the missing guard to both.
    function pause() external {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // Task 4: guard this function with onlyObserver and whenNotPaused, in that order.
    function bookNight(uint256 night) external {
        address booked = observerOn[night];
        if (booked != address(0)) revert NightTaken(night, booked);
        observerOn[night] = msg.sender;
        emit NightBooked(night, msg.sender);
    }

    // Task 5
    function offerDirectorship(address next) external {
        revert("not implemented: offerDirectorship");
    }

    // Task 6
    function acceptDirectorship() external {
        revert("not implemented: acceptDirectorship");
    }
}
