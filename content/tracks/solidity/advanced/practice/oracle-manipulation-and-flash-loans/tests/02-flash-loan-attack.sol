import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20FlashMint} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";
import {IERC3156FlashBorrower} from "@openzeppelin/contracts/interfaces/IERC3156FlashBorrower.sol";

/// COIN can lend itself for one transaction, as many real tokens can.
contract FlashCoin is ERC20, ERC20FlashMint {
    constructor() ERC20("COIN", "COIN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract AttackWatt is ERC20 {
    constructor() ERC20("WATT", "WATT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SteadyFeed is IPriceFeed {
    uint8 public constant decimals = 8;

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (1, 2e8, block.timestamp, block.timestamp, 1);
    }
}

/// Flash-borrows COIN, pumps WATT in the pool, borrows against 100 WATT, dumps, repays.
contract PumpAttacker is IERC3156FlashBorrower {
    FlashCoin immutable coin;
    AttackWatt immutable watt;
    WattPool immutable pool;
    CreditDesk immutable desk;

    constructor(FlashCoin coin_, AttackWatt watt_, WattPool pool_, CreditDesk desk_) {
        (coin, watt, pool, desk) = (coin_, watt_, pool_, desk_);
    }

    function attack(uint256 loan) external {
        coin.flashLoan(this, address(coin), loan, "");
    }

    function onFlashLoan(address, address, uint256 amount, uint256 fee, bytes calldata) external returns (bytes32) {
        coin.approve(address(pool), type(uint256).max);
        watt.approve(address(pool), type(uint256).max);
        watt.approve(address(desk), type(uint256).max);
        uint256 bought = pool.buyWatt(amount);
        desk.deposit(100e18);
        uint256 limit = desk.maxBorrow(address(this));
        uint256 cash = coin.balanceOf(address(desk));
        desk.borrow(limit < cash ? limit : cash);
        pool.sellWatt(bought - 100e18);
        coin.approve(msg.sender, amount + fee);
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
}

contract FlashLoanAttackTest is Test {
    FlashCoin coin;
    AttackWatt watt;
    WattPool pool;
    CreditDesk desk;

    function setUp() public {
        coin = new FlashCoin();
        watt = new AttackWatt();
        pool = new WattPool(watt, coin);
        desk = new CreditDesk(watt, coin, pool, new SteadyFeed());
        watt.mint(address(this), 1_000e18);
        coin.mint(address(this), 2_000e18);
        watt.approve(address(pool), 1_000e18);
        coin.approve(address(pool), 2_000e18);
        pool.addLiquidity(1_000e18, 2_000e18);
        coin.mint(address(desk), 10_000e18);
    }

    function test_flash_loan_pump_does_not_drain_the_desk() public {
        PumpAttacker attacker = new PumpAttacker(coin, watt, pool, desk);
        try attacker.attack(18_000e18) {} catch {}
        assertEq(coin.balanceOf(address(desk)), 10_000e18, "COIN left in the desk after the flash loan attack");
        assertEq(coin.balanceOf(address(attacker)), 0, "COIN the attacker kept");
    }

    function testFuzz_pool_trades_do_not_move_the_lending_price(uint256 coinIn) public {
        coinIn = bound(coinIn, 1e18, 1_000_000e18);
        address member = makeAddr("member");
        watt.mint(member, 100e18);
        vm.startPrank(member);
        watt.approve(address(desk), 100e18);
        desk.deposit(100e18);
        vm.stopPrank();

        address trader = makeAddr("trader");
        coin.mint(trader, coinIn);
        vm.startPrank(trader);
        coin.approve(address(pool), coinIn);
        pool.buyWatt(coinIn);
        vm.stopPrank();

        assertEq(desk.wattPrice(), 2e18, "the lending price after a large trade in the pool");
        assertEq(desk.maxBorrow(member), 100e18, "a member's limit after a large trade in the pool");
    }
}
