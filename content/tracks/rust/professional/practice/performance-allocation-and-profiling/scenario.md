Every night a wholesaler's export job turns twelve million order lines into a text file, and
lately it is still running when the warehouse opens. The flame graph is clear: 41% of the time
is spent inside the allocator, called from three small functions in the innermost loop.
