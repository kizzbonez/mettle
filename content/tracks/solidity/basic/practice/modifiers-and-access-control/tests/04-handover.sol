contract HandoverTest is Test {
    event DirectorChanged(address indexed previousDirector, address indexed newDirector);

    TelescopeRota rota;
    address bea = address(0xBEA);
    address cy = address(0xC1);

    function setUp() public {
        rota = new TelescopeRota();
    }

    function test_offer_alone_changes_nothing() public {
        rota.offerDirectorship(bea);
        assertEq(rota.director(), address(this), "the director after only an offer");
        assertEq(rota.candidate(), bea, "the candidate after the offer");
        rota.pause();
        assertTrue(rota.paused(), "the director can still act while an offer is open");
    }

    function testFuzz_only_the_candidate_accepts(address someone) public {
        vm.assume(someone != bea && someone != address(0));
        rota.offerDirectorship(bea);
        vm.prank(someone);
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotCandidate.selector, someone));
        rota.acceptDirectorship();
        assertEq(rota.director(), address(this), "the director after a refused acceptance");
    }

    function test_candidate_takes_over() public {
        rota.offerDirectorship(bea);
        vm.expectEmit(address(rota));
        emit DirectorChanged(address(this), bea);
        vm.prank(bea);
        rota.acceptDirectorship();

        assertEq(rota.director(), bea, "the director after accepting");
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotDirector.selector, address(this)));
        rota.setObserver(address(this), true);

        vm.prank(bea);
        rota.pause();
        assertTrue(rota.paused(), "the new director can pause");
    }

    function test_an_offer_works_only_once() public {
        rota.offerDirectorship(bea);
        vm.prank(bea);
        rota.acceptDirectorship();
        assertEq(rota.candidate(), address(0), "the candidate after the offer was used");

        vm.prank(bea);
        rota.offerDirectorship(cy);
        vm.prank(cy);
        rota.acceptDirectorship();

        vm.prank(bea);
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotCandidate.selector, bea));
        rota.acceptDirectorship();
        assertEq(rota.director(), cy, "the director after the second handover");
    }

    function test_a_new_offer_replaces_the_old_one() public {
        rota.offerDirectorship(bea);
        rota.offerDirectorship(cy);
        vm.prank(bea);
        vm.expectRevert(abi.encodeWithSelector(TelescopeRota.NotCandidate.selector, bea));
        rota.acceptDirectorship();
        vm.prank(cy);
        rota.acceptDirectorship();
        assertEq(rota.director(), cy, "the director after the replaced offer");
    }
}
