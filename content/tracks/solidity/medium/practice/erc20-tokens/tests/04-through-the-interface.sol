/// A market stall that only knows the IERC20 interface and takes payment in shares.
contract KelpStall {
    error PaymentFailed();

    IERC20 public immutable shares;
    address public immutable stallholder;
    uint256 public basketsSold;

    constructor(IERC20 shares_) {
        shares = shares_;
        stallholder = msg.sender;
    }

    function buyBasket(uint256 price) external {
        if (!shares.transferFrom(msg.sender, stallholder, price)) revert PaymentFailed();
        basketsSold++;
    }
}

contract KelpInterfaceTest is Test {
    KelpShare share;
    address hana = makeAddr("hana");

    function setUp() public {
        share = new KelpShare();
        share.mint(hana, 2_000);
    }

    function test_the_metadata() public view {
        assertEq(share.decimals(), 2, "the decimals of a share");
        assertEq(share.symbol(), "KELP", "the symbol");
        assertEq(share.secretary(), address(this), "the secretary is the deployer");
    }

    function test_a_stall_takes_payment_through_the_interface() public {
        KelpStall stall = new KelpStall(IERC20(address(share)));
        vm.startPrank(hana);
        share.approve(address(stall), 750);
        stall.buyBasket(500);
        vm.stopPrank();
        assertEq(stall.basketsSold(), 1, "baskets sold after one payment");
        assertEq(share.balanceOf(address(this)), 500, "the stallholder's takings");
        assertEq(share.allowance(hana, address(stall)), 250, "the stall's allowance after one basket");

        vm.expectRevert(
            abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, address(stall), 250, 500)
        );
        vm.prank(hana);
        stall.buyBasket(500);
        assertEq(stall.basketsSold(), 1, "baskets sold after a refused payment");
    }

    function test_the_supply_matches_the_balances() public {
        IERC20 token = IERC20(address(share));
        address ivo = makeAddr("ivo");
        share.mint(ivo, 300);
        vm.prank(hana);
        token.transfer(ivo, 700);
        vm.prank(ivo);
        token.transfer(address(this), 50);
        uint256 sum = token.balanceOf(hana) + token.balanceOf(ivo) + token.balanceOf(address(this));
        assertEq(sum, token.totalSupply(), "the balances add up to the supply");
        assertEq(token.balanceOf(ivo), 950, "ivo's balance after the transfers");
    }
}
