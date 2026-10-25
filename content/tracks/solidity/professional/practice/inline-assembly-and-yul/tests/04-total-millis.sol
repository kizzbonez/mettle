contract TotalMillisTest is Test {
    HillClimbTimes times;

    function setUp() public {
        times = new HillClimbTimes();
    }

    function test_an_empty_list_totals_zero() public view {
        uint256[] memory none = new uint256[](0);
        assertEq(times.totalMillis(none), 0, "totalMillis of no results");
    }

    function testFuzz_total_ignores_everything_but_the_times(uint256[6] memory raw) public view {
        uint256[] memory words = new uint256[](raw.length);
        uint256 expected;
        for (uint256 i = 0; i < raw.length; i++) {
            // keep each time small enough that six of them fit in 64 bits
            words[i] = (raw[i] & ~uint256(0xffffffffffffffff)) | (raw[i] & 0xffffffffffff);
            expected += raw[i] & 0xffffffffffff;
        }
        assertEq(times.totalMillis(words), expected, "totalMillis of words with riders, gates and high bits set");
    }

    function test_the_largest_total_is_allowed() public view {
        uint256[] memory words = new uint256[](3);
        words[0] = times.pack(1, 1, type(uint64).max - 10);
        words[1] = times.pack(2, 2, 4);
        words[2] = times.pack(3, 3, 6);
        assertEq(times.totalMillis(words), type(uint64).max, "totalMillis that exactly fills 64 bits");
    }

    function test_one_more_millisecond_overflows() public {
        uint256[] memory words = new uint256[](3);
        words[0] = times.pack(1, 1, type(uint64).max - 10);
        words[1] = times.pack(2, 2, 5);
        words[2] = times.pack(3, 3, 6);
        vm.expectRevert(HillClimbTimes.TimeOverflow.selector);
        times.totalMillis(words);
    }

    function test_many_large_times_overflow() public {
        uint256[] memory words = new uint256[](4);
        for (uint256 i = 0; i < words.length; i++) {
            words[i] = times.pack(uint32(i), uint8(i), type(uint64).max);
        }
        vm.expectRevert(HillClimbTimes.TimeOverflow.selector);
        times.totalMillis(words);
    }
}
