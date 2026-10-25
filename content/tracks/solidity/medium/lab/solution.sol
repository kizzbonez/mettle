// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

/// @notice A share in basis points: 1 bps is 0.01%, 10_000 bps is 100%.
type Bps is uint16;

/// @notice Fee arithmetic on Bps.
library BpsMath {
    uint256 internal constant DENOMINATOR = 10_000;

    /// @notice `share` of `amount`, rounded down.
    function applyTo(Bps share, uint256 amount) internal pure returns (uint256) {
        return amount * Bps.unwrap(share) / DENOMINATOR;
    }
}

using BpsMath for Bps global;

/// @notice The harbour's own token, Harbour Credit (HBC). The harbour master mints it.
contract HarbourCredit is ERC20, Ownable {
    constructor(address harbourMaster) ERC20("Harbour Credit", "HBC") Ownable(harbourMaster) {}

    /// @notice Mint `amount` HBC to `to`. Only the harbour master.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

/// @notice The quayside auction: boats list a catch, buyers bid in Harbour Credit until the
/// deadline, and a late bid extends it. Every payment is credited and then withdrawn.
contract FishAuction is Ownable2Step, ReentrancyGuardTransient {
    using SafeERC20 for IERC20;

    /// @notice A bid with less than this left extends the auction to this much from now.
    uint256 public constant EXTENSION = 5 minutes;
    /// @notice Each bid must beat the last one by at least this share (and by at least 1).
    Bps public constant MIN_RAISE = Bps.wrap(500);
    /// @notice The highest fee the harbour master may set.
    Bps public constant MAX_FEE = Bps.wrap(1_000);

    struct Auction {
        address seller;
        uint64 endsAt;
        Bps fee; // the harbour's fee, fixed when the catch is listed
        bool settled;
        address highestBidder;
        uint256 highestBid;
        uint256 reserve;
    }

    IERC20 public immutable credit;
    Bps public fee;
    uint256 public auctionCount;
    mapping(uint256 id => Auction) internal auctions;
    mapping(address account => uint256) public withdrawable;

    event FeeChanged(Bps oldFee, Bps newFee);
    event Listed(uint256 indexed id, address indexed seller, uint256 reserve, uint256 endsAt);
    event BidPlaced(uint256 indexed id, address indexed bidder, uint256 amount, uint256 endsAt);
    event Settled(uint256 indexed id, address indexed winner, uint256 price, uint256 fee);
    event Withdrawn(address indexed account, uint256 amount);

    error FeeTooHigh(Bps fee);
    error ZeroDuration();
    error UnknownAuction(uint256 id);
    error SellerCannotBid();
    error BidTooLow(uint256 id, uint256 minimum);
    error AuctionEnded(uint256 id);
    error AuctionNotEnded(uint256 id, uint256 endsAt);
    error AlreadySettled(uint256 id);
    error NothingToWithdraw();

    constructor(IERC20 credit_, address harbourMaster, Bps fee_) Ownable(harbourMaster) {
        credit = credit_;
        _setFee(fee_);
    }

    /// @notice Change the fee for catches listed from now on. Only the harbour master.
    function setFee(Bps newFee) external onlyOwner {
        _setFee(newFee);
    }

    /// @notice List a catch with a reserve price, for `duration` seconds. Ids start at 1.
    function list(uint256 reserve, uint256 duration) external returns (uint256 id) {
        if (duration == 0) revert ZeroDuration();
        id = ++auctionCount;
        uint64 endsAt = uint64(block.timestamp + duration);
        auctions[id] = Auction({
            seller: msg.sender,
            endsAt: endsAt,
            fee: fee,
            settled: false,
            highestBidder: address(0),
            highestBid: 0,
            reserve: reserve
        });
        emit Listed(id, msg.sender, reserve, endsAt);
    }

    /// @notice The lowest bid auction `id` accepts now.
    function minimumBid(uint256 id) public view returns (uint256) {
        Auction storage a = _existing(id);
        if (a.highestBidder == address(0)) return a.reserve > 0 ? a.reserve : 1;
        uint256 raise = MIN_RAISE.applyTo(a.highestBid);
        return a.highestBid + (raise > 0 ? raise : 1);
    }

    /// @notice Bid `amount` HBC; the auction must be approved for it. The bid it beats is
    /// credited back to its bidder.
    function bid(uint256 id, uint256 amount) external nonReentrant {
        Auction storage a = _existing(id);
        if (block.timestamp >= a.endsAt) revert AuctionEnded(id);
        if (msg.sender == a.seller) revert SellerCannotBid();
        uint256 minimum = minimumBid(id);
        if (amount < minimum) revert BidTooLow(id, minimum);

        if (a.highestBidder != address(0)) withdrawable[a.highestBidder] += a.highestBid;
        a.highestBidder = msg.sender;
        a.highestBid = amount;
        if (a.endsAt - block.timestamp < EXTENSION) a.endsAt = uint64(block.timestamp + EXTENSION);
        emit BidPlaced(id, msg.sender, amount, a.endsAt);

        credit.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice After the deadline, anyone may settle: the seller is credited the price minus
    /// the fee, and the harbour master the fee.
    function settle(uint256 id) external {
        Auction storage a = _existing(id);
        if (block.timestamp < a.endsAt) revert AuctionNotEnded(id, a.endsAt);
        if (a.settled) revert AlreadySettled(id);
        a.settled = true;

        uint256 feeAmount;
        if (a.highestBidder != address(0)) {
            feeAmount = a.fee.applyTo(a.highestBid);
            withdrawable[a.seller] += a.highestBid - feeAmount;
            withdrawable[owner()] += feeAmount;
        }
        emit Settled(id, a.highestBidder, a.highestBid, feeAmount);
    }

    /// @notice Withdraw everything credited to you: refunds, proceeds and fees.
    function withdraw() external nonReentrant {
        uint256 amount = withdrawable[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        withdrawable[msg.sender] = 0;
        emit Withdrawn(msg.sender, amount);
        credit.safeTransfer(msg.sender, amount);
    }

    function auctionOf(uint256 id) external view returns (Auction memory) {
        return _existing(id);
    }

    function _existing(uint256 id) internal view returns (Auction storage a) {
        if (id == 0 || id > auctionCount) revert UnknownAuction(id);
        a = auctions[id];
    }

    function _setFee(Bps newFee) internal {
        if (Bps.unwrap(newFee) > Bps.unwrap(MAX_FEE)) revert FeeTooHigh(newFee);
        emit FeeChanged(fee, newFee);
        fee = newFee;
    }
}
