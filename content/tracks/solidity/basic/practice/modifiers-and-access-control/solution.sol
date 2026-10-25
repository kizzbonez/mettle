// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Telescope rota
/// @notice Observers book the telescope one night at a time; the director runs the rota.
contract TelescopeRota {
    address public director;
    /// @notice The account offered the directorship, or the zero address if there is no offer.
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

    /// @dev Checks msg.sender, the direct caller; never tx.origin.
    modifier onlyObserver() {
        if (!isObserver[msg.sender]) revert NotObserver(msg.sender);
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert RotaPaused();
        _;
    }

    /// @notice Give or take away an account's right to book nights.
    function setObserver(address account, bool allowed) external onlyDirector {
        isObserver[account] = allowed;
        emit ObserverSet(account, allowed);
    }

    /// @notice Close the rota, for example while the dome is repaired.
    function pause() external onlyDirector {
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Open the rota again.
    function unpause() external onlyDirector {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Book a free night for yourself.
    function bookNight(uint256 night) external onlyObserver whenNotPaused {
        address booked = observerOn[night];
        if (booked != address(0)) revert NightTaken(night, booked);
        observerOn[night] = msg.sender;
        emit NightBooked(night, msg.sender);
    }

    /// @notice Offer the directorship to `next`; nothing changes until they accept.
    /// @dev A new offer replaces the previous one.
    function offerDirectorship(address next) external onlyDirector {
        candidate = next;
        emit DirectorshipOffered(director, next);
    }

    /// @notice Accept the directorship you were offered.
    /// @dev The event names the old director, so it is emitted before the change.
    function acceptDirectorship() external {
        if (msg.sender != candidate) revert NotCandidate(msg.sender);
        emit DirectorChanged(director, msg.sender);
        director = msg.sender;
        candidate = address(0);
    }
}
