import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SwapCredit is ERC20 {
    constructor(string memory symbol) ERC20(symbol, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SwapProtectionTest is Test {
    address constant TRADER = address(0x7AD3);
    address constant SANDWICHER = address(0x5A4D);

    SwapCredit water;
    SwapCredit compost;
    CreditPool pool;

    function setUp() public {
        vm.warp(1_000_000);
        water = new SwapCredit("WTR");
        compost = new SwapCredit("CMP");
        pool = new CreditPool(water, compost);
        water.mint(address(this), 10_000e18);
        compost.mint(address(this), 10_000e18);
        water.approve(address(pool), type(uint256).max);
        compost.approve(address(pool), type(uint256).max);
        pool.addLiquidity(10_000e18, 10_000e18, 0);
        for (uint256 i = 0; i < 2; i++) {
            address who = i == 0 ? TRADER : SANDWICHER;
            water.mint(who, 5_000e18);
            compost.mint(who, 5_000e18);
            vm.startPrank(who);
            water.approve(address(pool), type(uint256).max);
            compost.approve(address(pool), type(uint256).max);
            vm.stopPrank();
        }
    }

    function test_a_deadline_in_the_past_is_refused() public {
        vm.prank(TRADER);
        vm.expectRevert(abi.encodeWithSelector(CreditPool.Expired.selector, 999_999));
        pool.swap(address(water), 1e18, 0, 999_999);
        vm.prank(TRADER);
        pool.swap(address(water), 1e18, 0, 1_000_000); // a deadline of exactly now is still fine
    }

    function test_an_unknown_token_is_refused() public {
        vm.prank(TRADER);
        vm.expectRevert(abi.encodeWithSelector(CreditPool.UnknownToken.selector, address(0xC0FFEE)));
        pool.swap(address(0xC0FFEE), 1e18, 0, block.timestamp);
    }

    function test_the_minimum_output_is_enforced() public {
        uint256 quote = pool.getAmountOut(100e18, 10_000e18, 10_000e18);
        vm.prank(TRADER);
        vm.expectRevert(abi.encodeWithSelector(CreditPool.InsufficientOutput.selector, quote, quote + 1));
        pool.swap(address(water), 100e18, quote + 1, block.timestamp);
        vm.prank(TRADER);
        assertEq(pool.swap(address(water), 100e18, quote, block.timestamp), quote, "a swap whose minimum is exactly the quote");
    }

    function test_a_sandwich_cannot_squeeze_a_protected_trade() public {
        // The trader quotes 500 water, accepts 1% less, and sends the transaction.
        uint256 quote = pool.getAmountOut(500e18, pool.reserveWater(), pool.reserveCompost());
        uint256 minOut = quote * 99 / 100;
        // A sandwicher sees it and buys compost first, which raises its price.
        vm.prank(SANDWICHER);
        pool.swap(address(water), 1_000e18, 0, block.timestamp);
        uint256 nowOut = pool.getAmountOut(500e18, pool.reserveWater(), pool.reserveCompost());
        vm.prank(TRADER);
        vm.expectRevert(abi.encodeWithSelector(CreditPool.InsufficientOutput.selector, nowOut, minOut));
        pool.swap(address(water), 500e18, minOut, block.timestamp);
        assertEq(compost.balanceOf(TRADER), 5_000e18, "the trader's compost after the refused swap");
    }

    function testFuzz_reserves_track_both_directions(uint256 waterIn, uint256 compostIn) public {
        waterIn = bound(waterIn, 1, 5_000e18);
        compostIn = bound(compostIn, 1, 5_000e18);
        uint256 kBefore = pool.reserveWater() * pool.reserveCompost();
        vm.startPrank(TRADER);
        uint256 compostOut = pool.swap(address(water), waterIn, 0, block.timestamp);
        uint256 waterOut = pool.swap(address(compost), compostIn, 0, block.timestamp);
        vm.stopPrank();
        assertEq(pool.reserveWater(), water.balanceOf(address(pool)), "reserveWater against the pool's water balance");
        assertEq(pool.reserveCompost(), compost.balanceOf(address(pool)), "reserveCompost against the pool's compost balance");
        assertEq(water.balanceOf(TRADER), 5_000e18 - waterIn + waterOut, "the trader's water after two swaps");
        assertEq(compost.balanceOf(TRADER), 5_000e18 - compostIn + compostOut, "the trader's compost after two swaps");
        assertGe(pool.reserveWater() * pool.reserveCompost(), kBefore, "k after two swaps");
    }
}
