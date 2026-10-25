import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AttackCredit is ERC20 {
    constructor() ERC20("Band Credit", "BCR") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract InflationAttackTest is Test {
    address constant TREASURY = address(0x7EA5);
    address constant ATTACKER = address(0xBAD);
    address constant VICTIM = address(0xF00D);

    AttackCredit credit;
    BandFundVault fund;

    function setUp() public {
        credit = new AttackCredit();
        fund = new BandFundVault(credit, TREASURY, type(uint256).max);
    }

    /// @dev The attacker deposits 1 wei, donates `donation` straight to the fund, then the
    /// victim deposits. Returns what each one's shares are worth before any exit fee.
    function attack(uint256 donation, uint256 deposit) internal returns (uint256 attackerWorth, uint256 victimWorth) {
        credit.mint(ATTACKER, donation + 1);
        credit.mint(VICTIM, deposit);
        vm.startPrank(ATTACKER);
        credit.approve(address(fund), type(uint256).max);
        fund.deposit(1, ATTACKER);
        credit.transfer(address(fund), donation); // a donation mints no shares
        vm.stopPrank();
        vm.startPrank(VICTIM);
        credit.approve(address(fund), type(uint256).max);
        fund.deposit(deposit, VICTIM);
        vm.stopPrank();
        attackerWorth = fund.convertToAssets(fund.balanceOf(ATTACKER));
        victimWorth = fund.convertToAssets(fund.balanceOf(VICTIM));
    }

    function test_decimals_include_the_offset() public view {
        assertEq(fund.decimals(), 21, "the fund's decimals");
        assertEq(fund.convertToShares(1), 1_000, "shares for 1 wei in an empty fund");
    }

    function test_a_large_donation_barely_touches_the_victim() public {
        (uint256 attackerWorth, uint256 victimWorth) = attack(10_000e18, 1_000e18);
        assertGe(victimWorth, 990e18, "the worth of the victim's 1,000-credit deposit after the attack");
        assertLe(attackerWorth, 6_000e18, "the worth of the attacker's shares after donating 10,000 credits");
    }

    function testFuzz_the_attacker_loses_far_more_than_the_victim(uint256 donation, uint256 deposit) public {
        donation = bound(donation, 1e18, 1_000_000e18);
        deposit = bound(deposit, 1e15, 1_000_000e18);
        (uint256 attackerWorth, uint256 victimWorth) = attack(donation, deposit);
        uint256 attackerLoss = donation + 1 > attackerWorth ? donation + 1 - attackerWorth : 0;
        uint256 victimLoss = deposit > victimWorth ? deposit - victimWorth : 0;
        assertGe(attackerLoss, victimLoss * 500, "the attacker's loss against 500 times the victim's loss");
    }
}
