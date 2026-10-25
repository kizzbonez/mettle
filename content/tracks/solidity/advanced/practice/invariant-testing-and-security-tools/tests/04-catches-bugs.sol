/// A gift to yourself reads your balance before taking from it: credits from nothing.
contract SelfGiftCredits is IMealCredits {
    uint256 public constant PRICE = 0.01 ether;
    mapping(address => uint256) public creditsOf;
    uint256 public totalCredits;
    uint256 public kitchenEarnings;

    function buy(uint256 count) external payable {
        creditsOf[msg.sender] += count;
        totalCredits += count;
    }

    function give(address to, uint256 count) external {
        uint256 toBalance = creditsOf[to];
        creditsOf[msg.sender] -= count;
        creditsOf[to] = toBalance + count;
    }

    function redeem(uint256 count) external {
        creditsOf[msg.sender] -= count;
        totalCredits -= count;
        kitchenEarnings += count * PRICE;
    }

    function refund(uint256 count) external {
        creditsOf[msg.sender] -= count;
        totalCredits -= count;
        (bool ok,) = msg.sender.call{value: count * PRICE}("");
        require(ok, "refund failed");
    }
}

/// A refund pays out but forgets to lower the total.
contract LeakyRefundCredits is IMealCredits {
    uint256 public constant PRICE = 0.01 ether;
    mapping(address => uint256) public creditsOf;
    uint256 public totalCredits;
    uint256 public kitchenEarnings;

    function buy(uint256 count) external payable {
        creditsOf[msg.sender] += count;
        totalCredits += count;
    }

    function give(address to, uint256 count) external {
        creditsOf[msg.sender] -= count;
        creditsOf[to] += count;
    }

    function redeem(uint256 count) external {
        creditsOf[msg.sender] -= count;
        totalCredits -= count;
        kitchenEarnings += count * PRICE;
    }

    function refund(uint256 count) external {
        creditsOf[msg.sender] -= count;
        (bool ok,) = msg.sender.call{value: count * PRICE}("");
        require(ok, "refund failed");
    }
}

contract CatchesBugsTest is Test {
    function ghostTotal(CreditsHandler handler) internal view returns (uint256) {
        return handler.ghostBought() - handler.ghostRedeemed() - handler.ghostRefunded();
    }

    function test_the_handler_exposes_credits_made_by_a_gift_to_oneself() public {
        CreditsHandler handler = new CreditsHandler(new SelfGiftCredits());
        handler.buy(0, 10);
        handler.give(0, 3, 4); // the same actor
        assertTrue(handler.sumOfCredits() != ghostTotal(handler), "the handler's totals expose a gift to oneself");
    }

    function test_the_handler_exposes_a_refund_that_leaves_the_total() public {
        LeakyRefundCredits leaky = new LeakyRefundCredits();
        CreditsHandler handler = new CreditsHandler(leaky);
        handler.buy(1, 10);
        handler.refund(1, 3);
        assertTrue(leaky.totalCredits() != ghostTotal(handler), "the handler's ghosts expose a leaky refund");
    }
}
