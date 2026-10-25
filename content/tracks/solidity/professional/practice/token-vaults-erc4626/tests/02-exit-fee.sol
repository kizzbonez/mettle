import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract FeeCredit is ERC20 {
    constructor() ERC20("Band Credit", "BCR") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ExitFeeTest is Test {
    address constant TREASURY = address(0x7EA5);
    address constant ADA = address(0xADA);
    address constant BEN = address(0xBE4);

    FeeCredit credit;
    BandFundVault fund;

    function setUp() public {
        credit = new FeeCredit();
        fund = new BandFundVault(credit, TREASURY, type(uint256).max);
        credit.mint(ADA, 10_000e18);
        vm.startPrank(ADA);
        credit.approve(address(fund), type(uint256).max);
        fund.deposit(10_000e18, ADA);
        vm.stopPrank();
        credit.mint(address(fund), 1_234e18); // the fund earned something, so 1 share is not 1 credit
    }

    function testFuzz_redeem_pays_what_preview_promised(uint256 shares) public {
        shares = bound(shares, 1, fund.balanceOf(ADA));
        uint256 promised = fund.previewRedeem(shares);
        uint256 gross = fund.convertToAssets(shares);
        vm.prank(ADA);
        uint256 paid = fund.redeem(shares, BEN, ADA);
        assertEq(paid, promised, "redeem's return value against previewRedeem");
        assertEq(credit.balanceOf(BEN), promised, "credit received by the receiver against previewRedeem");
        assertLe(paid + credit.balanceOf(TREASURY), gross, "member's credit plus fee never exceed the shares' worth");
        assertEq(credit.balanceOf(TREASURY), (paid * 50 + 9_999) / 10_000, "the fee on a redemption, rounded up");
    }

    function testFuzz_withdraw_burns_what_preview_promised(uint256 assets) public {
        assets = bound(assets, 1, fund.maxWithdraw(ADA));
        uint256 promised = fund.previewWithdraw(assets);
        uint256 sharesBefore = fund.balanceOf(ADA);
        vm.prank(ADA);
        uint256 burned = fund.withdraw(assets, BEN, ADA);
        assertEq(burned, promised, "withdraw's return value against previewWithdraw");
        assertEq(sharesBefore - fund.balanceOf(ADA), promised, "shares burned against previewWithdraw");
        assertEq(credit.balanceOf(BEN), assets, "the receiver gets exactly the assets asked for");
        assertEq(credit.balanceOf(TREASURY), (assets * 50 + 9_999) / 10_000, "the fee on a withdrawal, rounded up");
    }

    function test_the_smallest_withdrawal_still_pays_a_fee() public {
        vm.prank(ADA);
        fund.withdraw(1, BEN, ADA);
        assertEq(credit.balanceOf(BEN), 1, "the receiver of a 1 wei withdrawal");
        assertEq(credit.balanceOf(TREASURY), 1, "the fee on a 1 wei withdrawal");
    }

    function test_max_withdraw_is_net_of_the_fee() public {
        uint256 most = fund.maxWithdraw(ADA);
        assertEq(most, fund.previewRedeem(fund.balanceOf(ADA)), "maxWithdraw against previewRedeem of every share");
        vm.prank(ADA);
        fund.withdraw(most, ADA, ADA);
        assertLt(fund.balanceOf(ADA), 1e6, "shares left after withdrawing the maximum");
    }

    function test_someone_else_needs_an_allowance() public {
        vm.prank(BEN);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, BEN, 0, 1e21));
        fund.redeem(1e21, BEN, ADA);
    }
}
