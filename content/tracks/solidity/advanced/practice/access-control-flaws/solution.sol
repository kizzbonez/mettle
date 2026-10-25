// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title The village observatory equipment fund
/// @notice Stargazers donate ether for new equipment. The warden (set once, at initialisation)
/// appoints keepers, who log observing nights, and spends the fund. Everyone else can only
/// donate and read.
contract ObservatoryFund {
    address public warden;
    bool private initialised;
    uint256 public nights;
    mapping(address keeper => bool) public isKeeper;

    event Initialised(address indexed warden);
    event KeeperAdded(address indexed keeper);
    event KeeperRemoved(address indexed keeper);
    event NightLogged(address indexed keeper, uint256 nights);
    event Spent(address indexed to, uint256 amount);

    error AlreadyInitialised();
    error ZeroAddress();
    error NotWarden(address caller);
    error NotKeeper(address caller);
    error InsufficientFunds(uint256 available, uint256 needed);
    error PaymentFailed();

    modifier onlyWarden() {
        if (msg.sender != warden) revert NotWarden(msg.sender);
        _;
    }

    modifier onlyKeeper() {
        if (!isKeeper[msg.sender]) revert NotKeeper(msg.sender);
        _;
    }

    /// @notice Sets the warden, once. Reverts on a second call.
    function initialise(address warden_) external {
        if (initialised) revert AlreadyInitialised();
        if (warden_ == address(0)) revert ZeroAddress();
        initialised = true;
        warden = warden_;
        emit Initialised(warden_);
    }

    function donate() external payable {}

    function addKeeper(address keeper) external onlyWarden {
        isKeeper[keeper] = true;
        emit KeeperAdded(keeper);
    }

    function removeKeeper(address keeper) external onlyWarden {
        isKeeper[keeper] = false;
        emit KeeperRemoved(keeper);
    }

    function logNight() external onlyKeeper {
        nights += 1;
        emit NightLogged(msg.sender, nights);
    }

    /// @notice Spends `amount` of the fund on equipment. Only the warden, checked by `msg.sender`.
    function spend(address to, uint256 amount) external onlyWarden {
        uint256 available = address(this).balance;
        if (amount > available) revert InsufficientFunds(available, amount);
        emit Spent(to, amount);
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }
}
