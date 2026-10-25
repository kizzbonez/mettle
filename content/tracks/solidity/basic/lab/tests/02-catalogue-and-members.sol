contract CatalogueAndMembersTest is Test {
    event InstrumentAdded(uint256 indexed id, string name, uint256 deposit);

    InstrumentLibrary lib;

    function setUp() public {
        lib = new InstrumentLibrary();
    }

    function test_ids_count_up_from_one() public {
        lib.addInstrument("cello", 0.5 ether);
        lib.addInstrument("bassoon", 0.8 ether);

        vm.expectEmit(address(lib));
        emit InstrumentAdded(3, "piccolo", 0.1 ether);
        uint256 id = lib.addInstrument("piccolo", 0.1 ether);

        assertEq(id, 3, "id returned for the third instrument");
        assertEq(lib.instrumentCount(), 3, "instrumentCount after three additions");
        (string memory name, uint256 deposit, address borrower) = lib.instruments(2);
        assertEq(name, "bassoon", "name stored for instrument 2");
        assertEq(deposit, 0.8 ether, "deposit stored for instrument 2");
        assertEq(borrower, address(0), "a new instrument is on the shelf");
    }

    function test_refuses_a_zero_deposit() public {
        vm.expectRevert(InstrumentLibrary.ZeroDeposit.selector);
        lib.addInstrument("kazoo", 0);
        assertEq(lib.instrumentCount(), 0, "instrumentCount after a refused addition");
    }

    function testFuzz_only_the_librarian_manages(address stranger) public {
        vm.assume(stranger != address(this));
        bytes memory refused = abi.encodeWithSelector(InstrumentLibrary.NotLibrarian.selector, stranger);

        vm.prank(stranger);
        vm.expectRevert(refused);
        lib.addInstrument("triangle", 1 ether);

        vm.prank(stranger);
        vm.expectRevert(refused);
        lib.setMember(stranger, true);

        assertEq(lib.instrumentCount(), 0, "instruments added by a stranger");
        assertFalse(lib.isMember(stranger), "a stranger made themselves a member");
    }

    function testFuzz_stores_any_deposit(uint256 deposit) public {
        deposit = bound(deposit, 1, type(uint128).max);
        uint256 id = lib.addInstrument("harp", deposit);
        (, uint256 stored,) = lib.instruments(id);
        assertEq(stored, deposit, "deposit stored for the new instrument");
    }

    function test_unknown_ids_are_refused() public {
        lib.addInstrument("cello", 0.5 ether);
        lib.setMember(address(this), true);

        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.UnknownInstrument.selector, 0));
        lib.borrow{value: 1 ether}(0);

        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.UnknownInstrument.selector, 2));
        lib.borrow{value: 1 ether}(2);

        vm.expectRevert(abi.encodeWithSelector(InstrumentLibrary.UnknownInstrument.selector, 2));
        lib.checkIn(2, 0);
    }
}
