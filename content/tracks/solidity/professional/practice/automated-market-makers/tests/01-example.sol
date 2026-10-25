import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleCredit is ERC20 {
    constructor(string memory symbol) ERC20(symbol, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ExampleTest is Test {
    event Swapped(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    address constant SOCIETY = address(0x50C1);
    address constant TRADER = address(0x7AD3);

    function test_example() public {
        vm.warp(1_000_000);
        ExampleCredit water = new ExampleCredit("WTR");
        ExampleCredit compost = new ExampleCredit("CMP");
        CreditPool pool = new CreditPool(water, compost);
        water.mint(SOCIETY, 4_000e18);
        compost.mint(SOCIETY, 9_000e18);
        water.mint(TRADER, 250e18);

        vm.startPrank(SOCIETY);
        water.approve(address(pool), type(uint256).max);
        compost.approve(address(pool), type(uint256).max);
        uint256 shares = pool.addLiquidity(4_000e18, 9_000e18, 0);
        vm.stopPrank();
        assertEq(shares, 6_000e18 - 1_000, "the society's shares: sqrt(4,000 * 9,000) minus the locked minimum");

        uint256 quote = pool.getAmountOut(250e18, 4_000e18, 9_000e18);
        assertEq(quote, 527_916_691_180_796_611_166, "getAmountOut(250 water) from 4,000 water and 9,000 compost");

        vm.startPrank(TRADER);
        water.approve(address(pool), type(uint256).max);
        vm.expectEmit(address(pool));
        emit Swapped(TRADER, address(water), 250e18, quote);
        uint256 out = pool.swap(address(water), 250e18, 520e18, block.timestamp + 60);
        vm.stopPrank();
        assertEq(out, quote, "the swap's output against the quote");
        assertEq(compost.balanceOf(TRADER), quote, "the trader's compost after the swap");
        assertEq(pool.reserveWater(), 4_250e18, "reserveWater after the swap");
        assertEq(pool.reserveCompost(), 9_000e18 - quote, "reserveCompost after the swap");

        vm.prank(SOCIETY);
        (uint256 waterOut, uint256 compostOut) = pool.removeLiquidity(shares / 2, 0, 0, block.timestamp);
        console.log("half the shares returned water", waterOut, "and compost", compostOut);
        assertEq(waterOut, (shares / 2) * 4_250e18 / 6_000e18, "water for half the shares");
        assertEq(compostOut, (shares / 2) * (9_000e18 - quote) / 6_000e18, "compost for half the shares");
    }
}
