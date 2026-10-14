// A new playlist is empty.
var breakfast = new Playlist("Breakfast");
Check.Equal(breakfast.Count, 0, "the number of tracks of a new playlist");
Check.Equal(breakfast.Length.Seconds, 0, "the length of a new playlist");

// += changes the object that every reference points to.
Playlist presenter = breakfast;
Playlist producer = breakfast;
breakfast += (Duration)200;
Check.True(ReferenceEquals(breakfast, presenter), "after +=, the variable still holds the same playlist");
Check.Equal(producer.Count, 1, "another reference to the playlist sees the new track");
Check.Equal(producer.Length.Seconds, 200, "another reference to the playlist sees the new length");

// Several tracks, added one by one.
int[] tracks = [180, 240, 95, 300];
var evening = new Playlist("Evening");
foreach (int seconds in tracks)
    evening += (Duration)seconds;
Check.Equal(evening.Count, 4, "the number of tracks after four were added");
Check.Equal(evening.Length.Seconds, 815, "the length is the sum of every track added");
Check.Equal(evening.Show, "Evening", "+= leaves the name of the show as it was");

// A zero-length jingle still counts as a track.
evening += (Duration)0;
Check.Equal(evening.Count, 5, "a track of zero seconds still counts");
Check.Equal(evening.Length.Seconds, 815, "a track of zero seconds adds nothing to the length");

// Two playlists are independent.
var late = new Playlist("Late");
late += (Duration)60;
Check.Equal(breakfast.Count, 1, "adding to one playlist leaves another alone");
Check.Equal(late.Length.Seconds, 60, "the length of the other playlist");
