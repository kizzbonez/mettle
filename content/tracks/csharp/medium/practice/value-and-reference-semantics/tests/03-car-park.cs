var park = new CarPark();
Check.Equal(park.Count, 0, "the cars inside a new car park");
Check.True(!park.Leave(new Plate("AA11 AAA")), "a car leaves an empty car park");

Check.True(park.Enter(new Plate("AA11 AAA")), "a first car enters");
Check.True(park.Enter(new Plate("BB22 BBB")), "a second car enters");
Check.True(park.Enter(new Plate("CC33 CCC")), "a third car enters");
Check.Equal(park.Count, 3, "the cars inside after three different cars entered");

Check.True(!park.Enter(new Plate("bb22bbb")), "a car that is inside enters again, typed in lower case");
Check.True(!park.Enter(new Plate("B B 2 2 B B B")), "a car that is inside enters again, typed with other spaces");
Check.Equal(park.Count, 3, "a refused entry changes nothing");

Check.True(!park.Leave(new Plate("DD44 DDD")), "a car that never came in leaves");
Check.True(park.Leave(new Plate("aa11aaa")), "a car that is inside leaves, typed another way");
Check.True(!park.Leave(new Plate("AA11 AAA")), "a car that has already left leaves again");
Check.Equal(park.Count, 2, "the cars inside after one left");

Check.True(park.Enter(new Plate("AA11AAA")), "a car that left can come back");
Check.Equal(park.Count, 3, "the cars inside after it came back");

// Two car parks are independent.
var other = new CarPark();
Check.True(other.Enter(new Plate("BB22 BBB")), "a car inside one car park enters a second car park");
Check.Equal(other.Count, 1, "the cars inside the second car park");
Check.Equal(park.Count, 3, "the first car park is not changed by the second");
