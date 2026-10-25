import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ScaleToken is ERC20 {
    constructor(string memory symbol) ERC20(symbol, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ScaleFeed is IPriceFeed {
    uint8 public immutable decimals;
    int256 public answer;

    constructor(uint8 decimals_, int256 answer_) {
        decimals = decimals_;
        answer = answer_;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (9, answer, block.timestamp, block.timestamp, 9);
    }
}

contract DecimalsTest is Test {
    ScaleToken watt = new ScaleToken("WATT");
    ScaleToken coin = new ScaleToken("COIN");

    function deskWith(uint8 decimals, int256 answer) internal returns (CreditDesk) {
        return new CreditDesk(watt, coin, new WattPool(watt, coin), new ScaleFeed(decimals, answer));
    }

    function test_eighteen_decimals_are_used_as_they_are() public {
        assertEq(deskWith(18, 3e18).wattPrice(), 3e18, "the price from an 18-decimal feed");
    }

    function test_six_decimals_are_scaled_up() public {
        assertEq(deskWith(6, 2_500_000).wattPrice(), 2.5e18, "the price from a 6-decimal feed");
    }

    function testFuzz_eight_decimals_are_scaled_up(uint256 answer) public {
        answer = bound(answer, 1, 1e15);
        assertEq(deskWith(8, int256(answer)).wattPrice(), answer * 1e10, "the price from an 8-decimal feed");
    }

    function testFuzz_the_limit_is_half_the_collateral_value(uint96 amount) public {
        CreditDesk desk = deskWith(8, 3e8);
        address member = makeAddr("member");
        watt.mint(member, amount);
        vm.startPrank(member);
        watt.approve(address(desk), amount);
        desk.deposit(amount);
        vm.stopPrank();
        assertEq(desk.maxBorrow(member), uint256(amount) * 3 / 2, "the limit at 3 COIN per WATT");
    }
}
