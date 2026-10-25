import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Like some real tokens, transfer and transferFrom return nothing instead of a bool.
contract SilentCoin {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
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

/// Keeps 2% of every transfer.
contract FeeCoin is ERC20 {
    constructor() ERC20("Fee", "FEE") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0) || to == address(0)) return super._update(from, to, value);
        uint256 fee = value / 50;
        super._update(from, address(0xFEE), fee);
        super._update(from, to, value - fee);
    }
}

/// Returns false instead of reverting when a transfer cannot be made.
contract FalseCoin {
    function balanceOf(address) external pure returns (uint256) {
        return 0;
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        return false;
    }
}

contract UnusualTokensTest is Test {
    address ann = makeAddr("ann");
    address ben = makeAddr("ben");
    address cat = makeAddr("cat");

    function crewUp(TipPool pool) internal {
        pool.addCrew(ann);
        pool.addCrew(ben);
        pool.addCrew(cat);
    }

    function test_a_token_without_return_values() public {
        SilentCoin coin = new SilentCoin();
        TipPool pool = new TipPool(IERC20(address(coin)));
        crewUp(pool);
        coin.mint(address(this), 90);
        coin.approve(address(pool), 90);
        pool.tip(90);
        vm.prank(ben);
        pool.claim();
        assertEq(coin.balanceOf(ben), 30, "the tokens ben collected from a token without return values");
    }

    function testFuzz_a_fee_on_transfer_token_never_overpays(uint64 amount) public {
        FeeCoin coin = new FeeCoin();
        TipPool pool = new TipPool(coin);
        crewUp(pool);
        coin.mint(address(this), amount);
        coin.approve(address(pool), amount);
        pool.tip(amount);
        uint256 credited = pool.owed(ann) + pool.owed(ben) + pool.owed(cat) + pool.leftover();
        assertEq(credited, coin.balanceOf(address(pool)), "the shares and leftover against the tokens held");
        address[3] memory members = [ann, ben, cat];
        for (uint256 i = 0; i < 3; i++) {
            if (pool.owed(members[i]) == 0) continue;
            vm.prank(members[i]);
            pool.claim();
        }
        assertEq(pool.owed(cat), 0, "cat's share after every member collected");
    }

    function test_a_token_that_returns_false() public {
        FalseCoin coin = new FalseCoin();
        TipPool pool = new TipPool(IERC20(address(coin)));
        crewUp(pool);
        try pool.tip(90) {} catch {}
        assertEq(pool.owed(ann), 0, "ann's share of a tip the token refused to move");
    }
}
