import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleCoin is ERC20 {
    constructor() ERC20("Coin", "COIN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ExampleTest is Test {
    event Claimed(address indexed member, uint256 amount);

    function test_example() public {
        ExampleCoin coin = new ExampleCoin();
        TipPool pool = new TipPool(coin); // the test contract is the skipper
        address ann = makeAddr("ann");
        address ben = makeAddr("ben");
        address cat = makeAddr("cat");
        pool.addCrew(ann);
        pool.addCrew(ben);
        pool.addCrew(cat);

        address passenger = makeAddr("passenger");
        coin.mint(passenger, 150);
        vm.startPrank(passenger);
        coin.approve(address(pool), 150);
        pool.tip(100);
        assertEq(pool.owed(ann), 33, "ann's share of a 100 tip");
        assertEq(pool.leftover(), 1, "the leftover after a 100 tip");
        pool.tip(50);
        vm.stopPrank();
        assertEq(pool.owed(cat), 50, "cat's share after the second tip");
        assertEq(pool.leftover(), 0, "the leftover after the second tip");

        vm.expectEmit(address(pool));
        emit Claimed(ann, 50);
        vm.prank(ann);
        pool.claim();
        assertEq(coin.balanceOf(ann), 50, "the tokens ann collected");
        assertEq(pool.owed(ben), 50, "ben's share after ann collected hers");

        vm.prank(ann);
        vm.expectRevert(TipPool.NothingOwed.selector);
        pool.claim();
    }
}
