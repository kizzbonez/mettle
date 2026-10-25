import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CrewCoin is ERC20 {
    constructor() ERC20("Coin", "COIN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract BoundedCrewTest is Test {
    CrewCoin coin;
    TipPool pool;

    function setUp() public {
        coin = new CrewCoin();
        pool = new TipPool(coin);
    }

    function test_the_crew_is_capped() public {
        for (uint160 i = 1; i <= 12; i++) {
            pool.addCrew(address(i + 0x100));
        }
        assertEq(pool.crewSize(), 12, "the crew size after twelve members joined");
        vm.expectRevert(TipPool.CrewFull.selector);
        pool.addCrew(address(0x200));
        assertEq(pool.crewSize(), 12, "the crew size after a thirteenth member was refused");
    }

    function test_only_the_skipper_adds_crew() public {
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(TipPool.NotSkipper.selector, stranger));
        pool.addCrew(stranger);
    }

    function test_a_tip_needs_a_crew() public {
        coin.mint(address(this), 10);
        coin.approve(address(pool), 10);
        vm.expectRevert(TipPool.NoCrew.selector);
        pool.tip(10);
    }

    function testFuzz_the_leftover_stays_below_the_crew_size(uint8 size, uint96 first, uint96 second) public {
        size = uint8(bound(size, 1, 12));
        for (uint160 i = 1; i <= size; i++) {
            pool.addCrew(address(i + 0x100));
        }
        coin.mint(address(this), uint256(first) + second);
        coin.approve(address(pool), uint256(first) + second);
        pool.tip(first);
        pool.tip(second);
        assertLt(pool.leftover(), size, "the leftover after two tips");
        uint256 shares = pool.owed(address(0x101)) * size;
        assertEq(shares + pool.leftover(), uint256(first) + second, "the shares and leftover after two tips");
    }
}
