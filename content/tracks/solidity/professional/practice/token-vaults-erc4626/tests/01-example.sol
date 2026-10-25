import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleCredit is ERC20 {
    constructor() ERC20("Band Credit", "BCR") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ExampleTest is Test {
    address constant TREASURY = address(0x7EA5);
    address constant ADA = address(0xADA);

    function test_example() public {
        ExampleCredit credit = new ExampleCredit();
        BandFundVault fund = new BandFundVault(credit, TREASURY, 5_000e18);
        assertEq(fund.decimals(), 21, "the fund's decimals: the credit's 18 plus the offset");

        credit.mint(ADA, 1_000e18);
        vm.startPrank(ADA);
        credit.approve(address(fund), type(uint256).max);
        uint256 shares = fund.deposit(1_000e18, ADA);
        assertEq(shares, 1_000e21, "shares for the first 1,000 credits");
        assertEq(fund.maxDeposit(ADA), 4_000e18, "room left under the cap");

        uint256 burned = fund.withdraw(100e18, ADA, ADA);
        console.log("shares burned to withdraw 100 credits:", burned);
        assertEq(credit.balanceOf(ADA), 100e18, "Ada's credits after withdrawing 100");
        assertEq(credit.balanceOf(TREASURY), 0.5e18, "the treasury's fee on a 100-credit withdrawal");

        uint256 out = fund.redeem(fund.balanceOf(ADA), ADA, ADA);
        vm.stopPrank();
        console.log("credits for the remaining shares:", out);
        assertEq(fund.totalSupply(), 0, "shares left after redeeming them all");
        assertLt(credit.balanceOf(ADA), 1_000e18, "Ada paid exit fees");
        assertEq(credit.balanceOf(ADA) + credit.balanceOf(TREASURY) + credit.balanceOf(address(fund)), 1_000e18, "no credit created or lost");
    }
}
