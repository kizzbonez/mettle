/// Tries to adopt again from inside the receiver hook, and keeps the revert data it gets.
contract Hoarder {
    OrchardTrees orchard;
    uint256 public attempts;
    bytes public refusal;

    constructor(OrchardTrees o) {
        orchard = o;
    }

    function go() external {
        orchard.adopt();
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        if (attempts < 3) {
            attempts++;
            try orchard.adopt() {}
            catch (bytes memory reason) {
                refusal = reason;
            }
        }
        return this.onERC721Received.selector;
    }
}

/// Records what the orchard's state looks like while the hook runs.
contract Inspector {
    OrchardTrees orchard;
    bool public sawFlag;
    uint256 public sawCount;
    uint256 public sawId;

    constructor(OrchardTrees o) {
        orchard = o;
    }

    function go() external {
        orchard.adopt();
    }

    function onERC721Received(address, address from, uint256 id, bytes calldata) external returns (bytes4) {
        require(from == address(0), "only mints expected");
        sawFlag = orchard.hasAdopted(address(this));
        sawCount = orchard.adopted();
        sawId = id;
        return this.onERC721Received.selector;
    }
}

contract ReceiverHookTest is Test {
    OrchardTrees orchard;

    function setUp() public {
        orchard = new OrchardTrees();
    }

    function test_a_contract_with_the_hook_can_adopt() public {
        Inspector barn = new Inspector(orchard);
        barn.go();
        assertEq(orchard.ownerOf(1), address(barn), "the owner of tree 1 adopted by a receiving contract");
        assertEq(barn.sawId(), 1, "the id passed to onERC721Received");
    }

    function test_state_is_recorded_before_the_hook_runs() public {
        Inspector barn = new Inspector(orchard);
        barn.go();
        assertTrue(barn.sawFlag(), "hasAdopted as seen from inside the receiver hook");
        assertEq(barn.sawCount(), 1, "the adopted counter as seen from inside the receiver hook");
    }

    function test_adopting_again_from_the_hook_fails() public {
        Hoarder hoarder = new Hoarder(orchard);
        hoarder.go();
        assertEq(orchard.balanceOf(address(hoarder)), 1, "certificates held by a contract that re-enters adopt");
        assertEq(orchard.adopted(), 1, "the adopted counter after a re-entry attempt");
        assertEq(
            hoarder.refusal(),
            abi.encodeWithSelector(OrchardTrees.AlreadyAdopted.selector, address(hoarder)),
            "the error a re-entrant adopt reverts with"
        );
    }
}
