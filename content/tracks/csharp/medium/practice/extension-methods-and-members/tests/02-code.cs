Check.Equal("Porto".Code(), "POR", "a name of five letters");
Check.Equal("madrid".Code(), "MAD", "a name in lower case is given in capitals");
Check.Equal("sEvIlLa".Code(), "SEV", "a name in mixed case is given in capitals");
Check.Equal("New York".Code(), "NEW", "a name of two words");
Check.Equal("Ely".Code(), "ELY", "a name of exactly three letters");
Check.Equal("Ur".Code(), "UR", "a name of two letters is returned whole");
Check.Equal("y".Code(), "Y", "a name of one letter is returned whole");
Check.Equal("   Faro".Code(), "FAR", "spaces in front are trimmed first");
Check.Equal("Ur   ".Code(), "UR", "spaces behind a short name are trimmed");
Check.Equal("".Code(), "", "an empty name gives an empty code");

// An extension method is a static method that is called like an instance method.
Check.Equal(TripExtensions.Code("Oslo"), "OSL", "Code called as a static method");
string place = "Toledo";
Check.Equal(place.Code(), "TOL", "Code called on a string variable");
Check.Equal(place, "Toledo", "the string itself is not changed");
