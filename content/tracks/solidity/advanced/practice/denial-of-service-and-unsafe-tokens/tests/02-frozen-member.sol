import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Like some real stablecoins, the issuer can freeze an address: it can no longer send or receive.
contract FreezableCoin is ERC20 {
    mapping(address => bool) public frozen;

    error AccountFrozen(address account);

    constructor() ERC20("Coin", "COIN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function freeze(address account) external {
        frozen[account] = true;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (frozen[from]) revert AccountFrozen(from);
        if (frozen[to]) revert AccountFrozen(to);
        super._update(from, to, value);
    }
}

contract FrozenMemberTest is Test {
    FreezableCoin coin;
    TipPool pool;
    address ann = makeAddr("ann");
    address ben = makeAddr("ben");
    address cat = makeAddr("cat");

    function setUp() public {
        coin = new FreezableCoin();
        pool = new TipPool(coin);
        pool.addCrew(ann);
        pool.addCrew(ben);
        pool.addCrew(cat);
        coin.mint(address(this), 300);
        coin.approve(address(pool), 300);
        pool.tip(300);
    }

    function test_a_frozen_member_does_not_block_the_crew() public {
        coin.freeze(ben);
        vm.prank(ann);
        try pool.claim() {} catch {}
        vm.prank(cat);
        try pool.claim() {} catch {}
        assertEq(coin.balanceOf(ann), 100, "the tokens ann collected while ben was frozen");
        assertEq(coin.balanceOf(cat), 100, "the tokens cat collected while ben was frozen");
    }

    function test_a_frozen_member_keeps_their_share() public {
        coin.freeze(ben);
        vm.prank(ben);
        try pool.claim() {} catch {}
        assertEq(pool.owed(ben), 100, "ben's share after his claim failed");
        assertEq(coin.balanceOf(address(pool)), 300, "the tokens in the pool after ben's claim failed");
    }

    function test_shares_add_up_until_collected() public {
        pool.tip(0);
        coin.mint(address(this), 60);
        coin.approve(address(pool), 60);
        pool.tip(60);
        vm.prank(cat);
        pool.claim();
        assertEq(coin.balanceOf(cat), 120, "the tokens cat collected from two tips");
        assertEq(pool.owed(ann), 120, "ann's share after two tips");
    }
}
