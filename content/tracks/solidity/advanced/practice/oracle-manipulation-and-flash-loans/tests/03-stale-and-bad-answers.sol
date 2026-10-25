import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CheckToken is ERC20 {
    constructor(string memory symbol) ERC20(symbol, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CheckFeed is IPriceFeed {
    uint8 public constant decimals = 8;
    int256 public answer;
    uint256 public updatedAt;

    function set(int256 answer_, uint256 updatedAt_) external {
        answer = answer_;
        updatedAt = updatedAt_;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (3, answer, updatedAt, updatedAt, 3);
    }
}

contract StaleAndBadAnswersTest is Test {
    CheckToken watt;
    CheckToken coin;
    CheckFeed feed;
    CreditDesk desk;
    uint256 constant T = 1_700_000_000;

    function setUp() public {
        vm.warp(T);
        watt = new CheckToken("WATT");
        coin = new CheckToken("COIN");
        feed = new CheckFeed();
        desk = new CreditDesk(watt, coin, new WattPool(watt, coin), feed);
        coin.mint(address(desk), 10_000e18);
        feed.set(2e8, T);
    }

    function test_accepts_an_answer_exactly_max_age_old() public {
        vm.warp(T + 1 hours);
        assertEq(desk.wattPrice(), 2e18, "the price when the answer is exactly MAX_AGE old");
    }

    function test_rejects_an_answer_one_second_too_old() public {
        vm.warp(T + 1 hours + 1);
        vm.expectRevert(abi.encodeWithSelector(CreditDesk.StalePrice.selector, T));
        desk.wattPrice();
    }

    function test_rejects_a_round_that_never_updated() public {
        feed.set(2e8, 0);
        vm.expectRevert(abi.encodeWithSelector(CreditDesk.StalePrice.selector, 0));
        desk.wattPrice();
    }

    function test_rejects_zero_and_negative_answers() public {
        feed.set(0, T);
        vm.expectRevert(abi.encodeWithSelector(CreditDesk.BadPrice.selector, int256(0)));
        desk.wattPrice();
        feed.set(-5e8, T);
        vm.expectRevert(abi.encodeWithSelector(CreditDesk.BadPrice.selector, int256(-5e8)));
        desk.wattPrice();
    }

    function test_refuses_to_lend_on_a_stale_price() public {
        address member = makeAddr("member");
        watt.mint(member, 100e18);
        vm.startPrank(member);
        watt.approve(address(desk), 100e18);
        desk.deposit(100e18);
        vm.warp(T + 3 hours);
        vm.expectRevert(abi.encodeWithSelector(CreditDesk.StalePrice.selector, T));
        desk.borrow(1e18);
        vm.stopPrank();
        assertEq(coin.balanceOf(member), 0, "COIN lent on a stale price");
    }
}
