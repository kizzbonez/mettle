import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract PausingClubCoin is ERC20 {
    constructor() ERC20("Club Coin", "CLUB") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DuesPausingTest is Test {
    event Paused(address account);
    event Unpaused(address account);
    event DuesPaid(address indexed member, uint256 numYears, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    address tess = makeAddr("tess");
    address sam = makeAddr("sam");
    address mia = makeAddr("mia");
    PausingClubCoin coin;
    DuesBox box;

    function setUp() public {
        coin = new PausingClubCoin();
        box = new DuesBox(coin, 25e18, makeAddr("admin"), tess);
        bytes32 steward = box.STEWARD_ROLE();
        vm.prank(tess);
        box.grantRole(steward, sam);
        coin.mint(mia, 10_000e18);
        vm.prank(mia);
        coin.approve(address(box), type(uint256).max);
    }

    function test_pausing_stops_payments_and_announces_it() public {
        vm.expectEmit(address(box));
        emit Paused(sam);
        vm.prank(sam);
        box.pause();
        vm.prank(mia);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        box.payDues(1);
    }

    function test_the_treasurer_can_withdraw_while_paused() public {
        vm.prank(mia);
        box.payDues(2);
        vm.prank(sam);
        box.pause();
        vm.expectEmit(address(box));
        emit Withdrawn(tess, 50e18);
        vm.prank(tess);
        box.withdraw(tess, 50e18);
        assertEq(coin.balanceOf(tess), 50e18, "what the treasurer withdrew while paused");
    }

    function test_unpausing_reopens_payments() public {
        vm.startPrank(sam);
        box.pause();
        vm.expectEmit(address(box));
        emit Unpaused(sam);
        box.unpause();
        vm.expectRevert(Pausable.ExpectedPause.selector);
        box.unpause();
        vm.stopPrank();
        vm.prank(mia);
        box.payDues(1);
        assertEq(box.yearsPaid(mia), 1, "the years paid after unpausing");
    }

    function test_rejects_zero_years() public {
        vm.prank(mia);
        vm.expectRevert(DuesBox.ZeroYears.selector);
        box.payDues(0);
    }

    function testFuzz_paying_dues_moves_the_tokens(uint256 numYears) public {
        numYears = bound(numYears, 1, 50);
        vm.expectEmit(address(box));
        emit DuesPaid(mia, numYears, numYears * 25e18);
        vm.prank(mia);
        box.payDues(numYears);
        assertEq(box.yearsPaid(mia), numYears, "the years paid");
        assertEq(coin.balanceOf(address(box)), numYears * 25e18, "the tokens in the box");
        assertEq(coin.balanceOf(mia), 10_000e18 - numYears * 25e18, "the member's tokens");
    }
}
