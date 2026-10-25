import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AmountOutTest is Test {
    CreditPool pool;

    function setUp() public {
        // getAmountOut is pure: the pool's tokens are never touched here.
        pool = new CreditPool(IERC20(address(0x1111)), IERC20(address(0x2222)));
    }

    function referenceOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        // dy = y * dx' / (x + dx'), with dx' = dx * 99.7%, all scaled by 10,000
        return (reserveOut * amountIn * 9_970) / (reserveIn * 10_000 + amountIn * 9_970);
    }

    function testFuzz_matches_the_constant_product_formula(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public
        view
    {
        amountIn = bound(amountIn, 1, 1e30);
        reserveIn = bound(reserveIn, 1, 1e30);
        reserveOut = bound(reserveOut, 1, 1e30);
        assertEq(pool.getAmountOut(amountIn, reserveIn, reserveOut), referenceOut(amountIn, reserveIn, reserveOut), "getAmountOut against the formula");
    }

    function testFuzz_never_drains_and_never_lowers_k(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public view {
        amountIn = bound(amountIn, 1, 1e30);
        reserveIn = bound(reserveIn, 1e3, 1e30);
        reserveOut = bound(reserveOut, 1e3, 1e30);
        uint256 out = pool.getAmountOut(amountIn, reserveIn, reserveOut);
        assertLt(out, reserveOut, "the output against the whole reserve");
        assertGe((reserveIn + amountIn) * (reserveOut - out), reserveIn * reserveOut, "k after the swap against k before");
    }

    function test_the_fee_stays_in_the_pool() public view {
        // Without a fee, 1,000 in from 1,000,000 / 1,000,000 would buy 999 (rounded down).
        assertEq(pool.getAmountOut(1_000, 1_000_000, 1_000_000), 996, "the output of a small trade after the 0.3% fee");
    }

    function test_refuses_nothing_and_empty_reserves() public {
        vm.expectRevert(CreditPool.ZeroAmount.selector);
        pool.getAmountOut(0, 1_000, 1_000);
        vm.expectRevert(CreditPool.InsufficientLiquidity.selector);
        pool.getAmountOut(10, 0, 1_000);
        vm.expectRevert(CreditPool.InsufficientLiquidity.selector);
        pool.getAmountOut(10, 1_000, 0);
    }
}
