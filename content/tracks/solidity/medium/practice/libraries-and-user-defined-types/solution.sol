// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice A weight of coffee beans, in grams. Never mixed up with a plain number.
type Grams is uint256;

using {addGrams as +, subGrams as -, lessThanGrams as <, equalGrams as ==} for Grams global;

function addGrams(Grams a, Grams b) pure returns (Grams) {
    return Grams.wrap(Grams.unwrap(a) + Grams.unwrap(b));
}

/// @dev Checked arithmetic: taking more than there is reverts with panic 0x11.
function subGrams(Grams a, Grams b) pure returns (Grams) {
    return Grams.wrap(Grams.unwrap(a) - Grams.unwrap(b));
}

function lessThanGrams(Grams a, Grams b) pure returns (bool) {
    return Grams.unwrap(a) < Grams.unwrap(b);
}

function equalGrams(Grams a, Grams b) pure returns (bool) {
    return Grams.unwrap(a) == Grams.unwrap(b);
}

/// @notice Roasting drives water out of the beans: they lose a share of their weight.
library Roast {
    error LossTooHigh(uint256 lossBps);

    /// @notice 10,000 basis points are 100%.
    uint256 internal constant MAX_BPS = 10_000;

    /// @notice The weight left after roasting `green` with a loss of `lossBps`, rounded down.
    function roasted(Grams green, uint256 lossBps) internal pure returns (Grams) {
        if (lossBps >= MAX_BPS) revert LossTooHigh(lossBps);
        // Multiply before dividing, so that nothing is lost before the share is taken.
        return Grams.wrap((Grams.unwrap(green) * (MAX_BPS - lossBps)) / MAX_BPS);
    }

    /// @notice The green weight to roast so that at least `target` is left, rounded up.
    function greenNeeded(Grams target, uint256 lossBps) internal pure returns (Grams) {
        if (lossBps >= MAX_BPS) revert LossTooHigh(lossBps);
        uint256 keep = MAX_BPS - lossBps;
        // Rounding up guarantees roasted(greenNeeded(t)) >= t: the order is never short.
        return Grams.wrap((Grams.unwrap(target) * MAX_BPS + keep - 1) / keep);
    }
}

/// @notice The roastery's stock ledger: green beans in, roasted beans out.
contract Roastery {
    using Roast for Grams;

    event Roasted(Grams green, Grams roasted);

    error NotRoaster(address caller);
    error NotEnoughGreen(Grams stock, Grams needed);

    address public immutable roaster;
    uint256 public immutable lossBps;
    Grams public greenStock;
    Grams public roastedStock;

    constructor(uint256 lossBps_) {
        if (lossBps_ >= Roast.MAX_BPS) revert Roast.LossTooHigh(lossBps_);
        roaster = msg.sender;
        lossBps = lossBps_;
    }

    modifier onlyRoaster() {
        if (msg.sender != roaster) revert NotRoaster(msg.sender);
        _;
    }

    function receiveGreen(Grams amount) external onlyRoaster {
        greenStock = greenStock + amount;
    }

    /// @notice Roasts `green` grams from the stock and returns the roasted weight.
    function roast(Grams green) public onlyRoaster returns (Grams out) {
        if (greenStock < green) revert NotEnoughGreen(greenStock, green);
        out = green.roasted(lossBps);
        greenStock = greenStock - green;
        roastedStock = roastedStock + out;
        emit Roasted(green, out);
    }

    /// @notice Roasts just enough green beans to have at least `target` roasted grams.
    function roastFor(Grams target) external onlyRoaster returns (Grams out) {
        return roast(target.greenNeeded(lossBps));
    }
}
