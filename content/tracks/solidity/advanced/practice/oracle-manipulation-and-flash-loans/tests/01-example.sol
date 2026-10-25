import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleToken is ERC20 {
    constructor(string memory symbol) ERC20(symbol, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ExampleFeed is IPriceFeed {
    uint8 public immutable decimals;
    int256 public answer;
    uint256 public updatedAt;

    constructor(uint8 decimals_) {
        decimals = decimals_;
    }

    function set(int256 answer_, uint256 updatedAt_) external {
        answer = answer_;
        updatedAt = updatedAt_;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (7, answer, updatedAt, updatedAt, 7);
    }
}

contract ExampleTest is Test {
    function test_example() public {
        ExampleToken watt = new ExampleToken("WATT");
        ExampleToken coin = new ExampleToken("COIN");
        WattPool pool = new WattPool(watt, coin);
        ExampleFeed feed = new ExampleFeed(8);
        feed.set(2e8, block.timestamp); // 2.00000000 COIN per WATT
        CreditDesk desk = new CreditDesk(watt, coin, pool, feed);
        coin.mint(address(desk), 10_000e18);

        address member = makeAddr("member");
        watt.mint(member, 100e18);
        vm.startPrank(member);
        watt.approve(address(desk), 100e18);
        desk.deposit(100e18);
        assertEq(desk.wattPrice(), 2e18, "the WATT price, scaled to 18 decimals");
        assertEq(desk.maxBorrow(member), 100e18, "the limit on 100 WATT");
        desk.borrow(60e18);
        assertEq(coin.balanceOf(member), 60e18, "COIN the member received");
        vm.expectRevert(abi.encodeWithSelector(CreditDesk.OverLimit.selector, 41e18, 40e18));
        desk.borrow(41e18);
        vm.stopPrank();

        uint256 updatedAt = block.timestamp;
        vm.warp(block.timestamp + 2 hours); // the feed has stopped updating
        vm.expectRevert(abi.encodeWithSelector(CreditDesk.StalePrice.selector, updatedAt));
        desk.maxBorrow(member);
    }
}
