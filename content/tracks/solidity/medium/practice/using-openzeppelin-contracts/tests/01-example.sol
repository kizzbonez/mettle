import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract ExampleClubCoin is ERC20 {
    constructor() ERC20("Club Coin", "CLUB") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DuesExampleTest is Test {
    event DuesPaid(address indexed member, uint256 numYears, uint256 amount);

    function test_example() public {
        address admin = makeAddr("admin");
        address tess = makeAddr("tess");
        address sam = makeAddr("sam");
        address mia = makeAddr("mia");
        address clubAccount = makeAddr("club account");
        ExampleClubCoin coin = new ExampleClubCoin();
        DuesBox box = new DuesBox(coin, 30e18, admin, tess);

        bytes32 steward = box.STEWARD_ROLE();
        vm.prank(tess);
        box.grantRole(steward, sam);
        assertTrue(box.hasRole(steward, sam), "whether sam is a steward after tess appointed him");

        coin.mint(mia, 100e18);
        vm.startPrank(mia);
        coin.approve(address(box), 60e18);
        vm.expectEmit(address(box));
        emit DuesPaid(mia, 2, 60e18);
        box.payDues(2);
        vm.stopPrank();
        assertEq(box.yearsPaid(mia), 2, "the years mia has paid");
        assertEq(coin.balanceOf(address(box)), 60e18, "the tokens in the box");

        vm.prank(sam);
        box.pause();
        vm.prank(mia);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        box.payDues(1);

        vm.prank(tess);
        box.withdraw(clubAccount, 60e18);
        assertEq(coin.balanceOf(clubAccount), 60e18, "the club account after the treasurer withdrew");

        vm.prank(sam);
        box.unpause();
        assertFalse(box.paused(), "whether the box is paused after unpause");
    }
}
