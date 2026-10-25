import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract CapCredit is ERC20 {
    constructor() ERC20("Band Credit", "BCR") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CapTest is Test {
    address constant TREASURY = address(0x7EA5);
    address constant ADA = address(0xADA);
    uint256 constant CAP = 1_000e18;

    CapCredit credit;
    BandFundVault fund;

    function setUp() public {
        credit = new CapCredit();
        fund = new BandFundVault(credit, TREASURY, CAP);
        credit.mint(ADA, 5_000e18);
        vm.prank(ADA);
        credit.approve(address(fund), type(uint256).max);
    }

    function test_max_deposit_is_the_room_left() public {
        assertEq(fund.maxDeposit(ADA), CAP, "maxDeposit of an empty fund");
        vm.prank(ADA);
        fund.deposit(400e18, ADA);
        assertEq(fund.maxDeposit(ADA), 600e18, "maxDeposit after 400 credits");
        assertEq(fund.maxDeposit(address(0xB0B)), 600e18, "maxDeposit is the same for everyone");
    }

    function test_a_deposit_over_the_cap_is_refused() public {
        vm.prank(ADA);
        fund.deposit(900e18, ADA);
        vm.prank(ADA);
        vm.expectRevert(abi.encodeWithSelector(ERC4626.ERC4626ExceededMaxDeposit.selector, ADA, 200e18, 100e18));
        fund.deposit(200e18, ADA);
        vm.prank(ADA);
        fund.deposit(100e18, ADA);
        assertEq(fund.totalAssets(), CAP, "totalAssets when the fund is full");
        assertEq(fund.maxDeposit(ADA), 0, "maxDeposit of a full fund");
        assertEq(fund.maxMint(ADA), 0, "maxMint of a full fund");
    }

    function test_a_donation_past_the_cap_does_not_break_max_deposit() public {
        vm.prank(ADA);
        fund.deposit(900e18, ADA);
        credit.mint(address(fund), 300e18); // sent straight to the fund: 1,200 held
        assertEq(fund.maxDeposit(ADA), 0, "maxDeposit when donations pushed the fund past its cap");
        assertEq(fund.maxMint(ADA), 0, "maxMint when donations pushed the fund past its cap");
    }

    function testFuzz_max_mint_never_needs_more_than_max_deposit(uint256 first, uint256 earned) public {
        first = bound(first, 1, CAP - 1);
        earned = bound(earned, 0, 50e18);
        vm.prank(ADA);
        fund.deposit(first, ADA);
        credit.mint(address(fund), earned);
        uint256 room = fund.maxDeposit(ADA);
        uint256 most = fund.maxMint(ADA);
        assertLe(fund.previewMint(most), room, "credit needed to mint maxMint shares, against maxDeposit");
        if (most > 0) {
            vm.prank(ADA);
            fund.mint(most, ADA);
            assertLe(fund.totalAssets(), CAP, "totalAssets after minting maxMint shares");
        }
    }
}
