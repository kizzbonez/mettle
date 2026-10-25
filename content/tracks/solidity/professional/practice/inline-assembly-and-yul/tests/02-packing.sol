contract PackingTest is Test {
    HillClimbTimes times;

    function setUp() public {
        times = new HillClimbTimes();
    }

    function testFuzz_pack_matches_the_layout(uint32 rider, uint8 gate, uint64 millis) public view {
        uint256 expected = (uint256(rider) << 72) | (uint256(gate) << 64) | uint256(millis);
        assertEq(times.pack(rider, gate, millis), expected, "pack against a Solidity reference");
    }

    function testFuzz_unpacking_round_trips(uint32 rider, uint8 gate, uint64 millis) public view {
        uint256 word = times.pack(rider, gate, millis);
        assertEq(times.riderOf(word), rider, "riderOf a packed word");
        assertEq(times.gateOf(word), gate, "gateOf a packed word");
        assertEq(times.millisOf(word), millis, "millisOf a packed word");
    }

    function testFuzz_unpacking_ignores_the_high_bits(uint256 word) public view {
        assertEq(times.riderOf(word), (word >> 72) & 0xffffffff, "riderOf a word with bits set above 103");
        assertEq(times.gateOf(word), (word >> 64) & 0xff, "gateOf a word with bits set above 103");
        assertEq(times.millisOf(word), word & 0xffffffffffffffff, "millisOf a word with bits set above 103");
    }

    function test_the_largest_values_stay_in_their_fields() public view {
        uint256 word = times.pack(type(uint32).max, type(uint8).max, type(uint64).max);
        assertEq(word, (uint256(1) << 104) - 1, "pack of the largest rider, gate and time");
        assertEq(times.gateOf(word), 255, "gateOf the largest values");
        uint256 noisy = word | (uint256(0xabc) << 200);
        assertEq(times.riderOf(noisy), type(uint32).max, "riderOf the largest rider with noise above it");
    }
}
