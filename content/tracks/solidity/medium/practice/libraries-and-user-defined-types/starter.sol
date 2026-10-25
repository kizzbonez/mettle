// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice A weight of coffee beans, in grams. Never mixed up with a plain number.
type Grams is uint256;

using {addGrams as +, subGrams as -, lessThanGrams as <, equalGrams as ==} for Grams global;

function addGrams(Grams a, Grams b) pure returns (Grams) {
    return Grams.wrap(Grams.unwrap(a) + Grams.unwrap(b));
}

// Task 1: a - b in grams, with checked arithmetic.
function subGrams(Grams a, Grams b) pure returns (Grams) {
    revert("not implemented: subGrams");
}

function lessThanGrams(Grams a, Grams b) pure returns (bool) {
    return Grams.unwrap(a) < Grams.unwrap(b);
}

// Task 1: true when both weights are the same.
function equalGrams(Grams a, Grams b) pure returns (bool) {
    revert("not implemented: equalGrams");
}

/// @notice Roasting drives water out of the beans: they lose a share of their weight.
library Roast {
    error LossTooHigh(uint256 lossBps);

    /// @notice 10,000 basis points are 100%.
    uint256 internal constant MAX_BPS = 10_000;

    // Task 2: the weight left after roasting `green` with a loss of `lossBps`, rounded down.
    function roasted(Grams green, uint256 lossBps) internal pure returns (Grams) {
        revert("not implemented: roasted");
    }

    // Task 3: the green weight to roast so that at least `target` is left, rounded up.
    function greenNeeded(Grams target, uint256 lossBps) internal pure returns (Grams) {
        revert("not implemented: greenNeeded");
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

    // Task 4: roast `green` grams from the stock and return the roasted weight.
    function roast(Grams green) public onlyRoaster returns (Grams out) {
        revert("not implemented: roast");
    }

    // Task 5: roast just enough green beans to have at least `target` roasted grams.
    function roastFor(Grams target) external onlyRoaster returns (Grams out) {
        revert("not implemented: roastFor");
    }
}
