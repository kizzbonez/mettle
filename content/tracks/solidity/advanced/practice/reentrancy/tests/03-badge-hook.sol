import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// Test helper: a member contract whose ERC-721 receiver hook asks for another badge.
contract GreedyBadgeMember is IERC721Receiver {
    CoopVault immutable vault;
    uint256 public hookCalls;

    constructor(CoopVault vault_) {
        vault = vault_;
    }

    function joinAndClaim() external payable {
        vault.deposit{value: msg.value}();
        vault.claimBadge();
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        hookCalls += 1;
        if (hookCalls < 5) {
            try vault.claimBadge() {} catch {}
        }
        return IERC721Receiver.onERC721Received.selector;
    }
}

/// Test helper: a well-behaved member contract that accepts its badge.
contract PoliteBadgeMember is IERC721Receiver {
    function claim(CoopVault vault) external payable {
        vault.deposit{value: msg.value}();
        vault.claimBadge();
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract BadgeHookTest is Test {
    event BadgeClaimed(address indexed member, uint256 indexed badgeId);

    CoopVault vault;
    address ada = makeAddr("ada");

    function setUp() public {
        vault = new CoopVault();
        vm.deal(ada, 1 ether);
        vm.deal(address(this), 1 ether);
    }

    function test_regression_one_badge_even_from_inside_the_hook() public {
        GreedyBadgeMember member = new GreedyBadgeMember(vault);
        try member.joinAndClaim{value: 0.1 ether}() {} catch {}

        assertEq(vault.balanceOf(address(member)), 1, "badges held by a member that claimed from its hook");
        assertEq(vault.nextBadgeId(), 2, "the next badge id after one claim");
        assertTrue(vault.hasBadge(address(member)), "the member is recorded as having its badge");
    }

    function test_a_contract_member_gets_its_badge() public {
        PoliteBadgeMember member = new PoliteBadgeMember();
        member.claim{value: 0.1 ether}(vault);
        assertEq(vault.ownerOf(1), address(member), "the owner of badge 1");
    }

    function test_claims_a_badge_with_an_event() public {
        vm.startPrank(ada);
        vault.deposit{value: 0.1 ether}();
        vm.expectEmit(address(vault));
        emit BadgeClaimed(ada, 1);
        vault.claimBadge();
        vm.stopPrank();
        assertEq(vault.ownerOf(1), ada, "the owner of badge 1");
        assertTrue(vault.hasBadge(ada), "ada is recorded as having her badge");
    }

    function test_needs_a_large_enough_deposit() public {
        vm.startPrank(ada);
        vault.deposit{value: 0.05 ether}();
        vm.expectRevert(abi.encodeWithSelector(CoopVault.DepositTooSmall.selector, 0.05 ether, 0.1 ether));
        vault.claimBadge();
        vm.stopPrank();
    }
}
