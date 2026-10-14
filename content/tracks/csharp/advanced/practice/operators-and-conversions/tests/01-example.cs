// 1. Durations.
var opener = (Duration)185;
Check.Equal(opener.ToString(), "3:05", "a duration of 185 seconds");
TimeSpan asTime = opener;
Check.Equal(asTime, new TimeSpan(0, 3, 5), "the duration of 185 seconds as a TimeSpan");
Check.Equal((opener + (Duration)70).ToString(), "4:15", "185 seconds plus 70 seconds");
Check.Throws<ArgumentOutOfRangeException>(() => { Duration bad = (Duration)(-1); }, "a cast of -1 seconds to Duration");

// 2. Track codes.
var a = new TrackCode("ab-12");
var b = new TrackCode(" AB-12 ");
Check.True(a == b, "two codes typed differently are equal with ==");
Check.True(!(a != b), "two equal codes are not different with !=");
Check.True(a.Equals((object)b), "two equal codes are equal through Equals(object)");
Check.Equal(new HashSet<TrackCode> { a, b }.Count, 1, "the size of a set holding two equal codes");
Check.True(!(a == null), "a code compared with null");

// 3. A playlist that grows in place.
var show = new Playlist("Night Owls");
Playlist sameShow = show;
show += opener;
show += (Duration)70;
Check.Equal(show.Count, 2, "the number of tracks after two were added");
Check.Equal(show.Length.ToString(), "4:15", "the length after tracks of 3:05 and 1:10 were added");
Check.True(ReferenceEquals(show, sameShow), "+= changes the playlist itself instead of creating a new one");
