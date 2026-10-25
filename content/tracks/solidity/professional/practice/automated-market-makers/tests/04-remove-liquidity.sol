import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract LiquidityCredit is ERC20 {
    constructor(string memory symbol) ERC20(symbol, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract RemoveLiquidityTest is Test {
    event LiquidityRemoved(address indexed provider, uint256 waterAmount, uint256 compostAmount, uint256 shares);

    address constant SOCIETY = address(0x50C1);
    address constant MEMBER = address(0x3E3B);
    address constant TRADER = address(0x7AD3);

    LiquidityCredit water;
    LiquidityCredit compost;
    CreditPool pool;
    uint256 societyShares;

    function setUp() public {
        vm.warp(1_000_000);
        water = new LiquidityCredit("WTR");
        compost = new LiquidityCredit("CMP");
        pool = new CreditPool(water, compost);
        address[3] memory people = [SOCIETY, MEMBER, TRADER];
        for (uint256 i = 0; i < 3; i++) {
            water.mint(people[i], 50_000e18);
            compost.mint(people[i], 50_000e18);
            vm.startPrank(people[i]);
            water.approve(address(pool), type(uint256).max);
            compost.approve(address(pool), type(uint256).max);
            vm.stopPrank();
        }
        vm.prank(SOCIETY);
        societyShares = pool.addLiquidity(2_000e18, 8_000e18, 0);
    }

    function test_removal_pays_a_proportional_part() public {
        vm.prank(TRADER);
        pool.swap(address(compost), 1_000e18, 0, block.timestamp); // the pool earns a fee
        uint256 supply = pool.totalSupply();
        uint256 expectedWater = societyShares * pool.reserveWater() / supply;
        uint256 expectedCompost = societyShares * pool.reserveCompost() / supply;
        vm.prank(SOCIETY);
        vm.expectEmit(address(pool));
        emit LiquidityRemoved(SOCIETY, expectedWater, expectedCompost, societyShares);
        (uint256 waterOut, uint256 compostOut) = pool.removeLiquidity(societyShares, 0, 0, block.timestamp);
        assertEq(waterOut, expectedWater, "water for every share of the society");
        assertEq(compostOut, expectedCompost, "compost for every share of the society");
        assertEq(pool.balanceOf(SOCIETY), 0, "the society's shares after removing them all");
        assertEq(pool.totalSupply(), 1_000, "the supply left: the locked minimum");
        assertEq(pool.reserveWater(), water.balanceOf(address(pool)), "reserveWater against the pool's balance");
        assertEq(pool.reserveCompost(), compost.balanceOf(address(pool)), "reserveCompost against the pool's balance");
    }

    function testFuzz_add_then_remove_never_profits(uint256 waterAmount) public {
        waterAmount = bound(waterAmount, 1e12, 10_000e18);
        uint256 compostAmount = waterAmount * 4; // the pool's ratio
        vm.startPrank(MEMBER);
        uint256 shares = pool.addLiquidity(waterAmount, compostAmount, 1);
        (uint256 waterOut, uint256 compostOut) = pool.removeLiquidity(shares, 0, 0, block.timestamp);
        vm.stopPrank();
        assertLe(waterOut, waterAmount, "water back after adding and removing at once");
        assertLe(compostOut, compostAmount, "compost back after adding and removing at once");
    }

    function test_the_minimums_and_the_deadline_are_enforced() public {
        uint256 half = societyShares / 2;
        uint256 waterOut = half * pool.reserveWater() / pool.totalSupply();
        uint256 compostOut = half * pool.reserveCompost() / pool.totalSupply();
        vm.startPrank(SOCIETY);
        vm.expectRevert(abi.encodeWithSelector(CreditPool.InsufficientOutput.selector, waterOut, waterOut + 1));
        pool.removeLiquidity(half, waterOut + 1, 0, block.timestamp);
        vm.expectRevert(abi.encodeWithSelector(CreditPool.InsufficientOutput.selector, compostOut, compostOut + 1));
        pool.removeLiquidity(half, 0, compostOut + 1, block.timestamp);
        vm.expectRevert(abi.encodeWithSelector(CreditPool.Expired.selector, block.timestamp - 1));
        pool.removeLiquidity(half, 0, 0, block.timestamp - 1);
        vm.expectRevert(CreditPool.ZeroAmount.selector);
        pool.removeLiquidity(0, 0, 0, block.timestamp);
        vm.stopPrank();
        assertEq(pool.balanceOf(SOCIETY), societyShares, "the society's shares after refused removals");
    }

    function test_nobody_removes_shares_they_do_not_hold() public {
        vm.prank(MEMBER);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, MEMBER, 0, 1e18));
        pool.removeLiquidity(1e18, 0, 0, block.timestamp);
    }
}
