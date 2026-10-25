import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

/// A token that reports a failed transfer by returning false instead of reverting.
contract FalseReturningCoin {
    function transfer(address, uint256) external pure returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        return false;
    }
}

/// An older style of token whose transfer functions return nothing at all.
contract SilentCoin {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }

    function transfer(address to, uint256 amount) external {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }

    function transferFrom(address from, address to, uint256 amount) external {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}

/// A token that calls back into the box while it is being paid, as a token with transfer hooks can.
contract CallbackCoin {
    DuesBox public box;
    bool public armed;

    function arm(DuesBox box_) external {
        box = box_;
        armed = true;
    }

    function transferFrom(address, address, uint256) external returns (bool) {
        if (armed) {
            armed = false;
            box.payDues(1);
        }
        return true;
    }

    function transfer(address, uint256) external pure returns (bool) {
        return true;
    }
}

contract DuesUnusualTokensTest is Test {
    address tess = makeAddr("tess");
    address mia = makeAddr("mia");

    function _box(address token) internal returns (DuesBox) {
        return new DuesBox(IERC20(token), 25e18, makeAddr("admin"), tess);
    }

    function test_a_payment_that_returns_false_is_refused() public {
        FalseReturningCoin coin = new FalseReturningCoin();
        DuesBox box = _box(address(coin));
        vm.prank(mia);
        vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(coin)));
        box.payDues(1);
        assertEq(box.yearsPaid(mia), 0, "the years recorded for a payment that failed");
    }

    function test_a_withdrawal_that_returns_false_is_refused() public {
        FalseReturningCoin coin = new FalseReturningCoin();
        DuesBox box = _box(address(coin));
        vm.prank(tess);
        vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(coin)));
        box.withdraw(tess, 1e18);
    }

    function test_a_token_without_return_values_still_works() public {
        SilentCoin coin = new SilentCoin();
        DuesBox box = _box(address(coin));
        coin.mint(mia, 100e18);
        vm.startPrank(mia);
        coin.approve(address(box), 50e18);
        box.payDues(2);
        vm.stopPrank();
        assertEq(coin.balanceOf(address(box)), 50e18, "the box's balance of a token without return values");

        vm.prank(tess);
        box.withdraw(tess, 20e18);
        assertEq(coin.balanceOf(tess), 20e18, "the treasurer's balance of a token without return values");
    }

    function test_a_token_cannot_call_back_into_payDues() public {
        CallbackCoin coin = new CallbackCoin();
        DuesBox box = _box(address(coin));
        coin.arm(box);
        vm.prank(mia);
        vm.expectRevert(ReentrancyGuardTransient.ReentrancyGuardReentrantCall.selector);
        box.payDues(1);
    }
}
