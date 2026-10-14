List<string> songs = ["One", "Two", "Three"];

List<string> fresh = Setlist.WithOpener(songs, "Zero");
Check.True(string.Join("|", fresh) == "Zero|One|Two|Three", "a new opener goes in front of every song, which keep their order");
Check.True(string.Join("|", songs) == "One|Two|Three", "the given list is unchanged after a new opener");

List<string> moved = Setlist.WithOpener(songs, "Three");
Check.True(string.Join("|", moved) == "Three|One|Two", "an opener that is already in the list is moved to the front, not played twice");
Check.True(string.Join("|", songs) == "One|Two|Three", "the given list is unchanged after moving a song to the front");

List<string> same = Setlist.WithOpener(songs, "One");
Check.True(string.Join("|", same) == "One|Two|Three", "an opener that is already first leaves the order as it was");

same.Add("Encore");
Check.True(songs.Count == 3, "the returned list is a separate list, so adding to it does not change the given one");

Check.True(string.Join("|", Setlist.WithOpener([], "Solo")) == "Solo", "an empty set with an opener holds only the opener");
