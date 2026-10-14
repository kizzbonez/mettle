// Lights
Check.Equal(Hub.Command(["lights", "on"]), "lights on", "lights on");
Check.Equal(Hub.Command(["lights", "dim"]), "unknown command: lights", "lights followed by a word that is neither on nor off");
Check.Equal(Hub.Command(["lights", "on", "now"]), "unknown command: lights", "lights on with a third word");
Check.Equal(Hub.Command(["lights"]), "unknown command: lights", "lights with nothing after it");
Check.Equal(Hub.Command(["Lights", "on"]), "unknown command: Lights", "the words are matched exactly, case included");

// Heat
Check.Equal(Hub.Command(["heat", "5"]), "heating to 5", "the lowest heat allowed");
Check.Equal(Hub.Command(["heat", "30"]), "heating to 30", "the highest heat allowed");
Check.Equal(Hub.Command(["heat", "4"]), "unknown command: heat", "a heat just below the range");
Check.Equal(Hub.Command(["heat", "31"]), "unknown command: heat", "a heat just above the range");
Check.Equal(Hub.Command(["heat", "-20"]), "unknown command: heat", "a negative heat");
Check.Equal(Hub.Command(["heat", "21.5"]), "unknown command: heat", "a heat that is not a whole number");
Check.Equal(Hub.Command(["heat"]), "unknown command: heat", "heat with no number");
Check.Equal(Hub.Command(["heat", "21", "22"]), "unknown command: heat", "heat with two numbers");

// Play
Check.Equal(Hub.Command(["play", "rain sounds"]), "playing rain sounds", "play with one name");
Check.Equal(Hub.Command(["play", "jazz", "blues"]), "playing jazz and 1 more", "play with two names");
Check.Equal(Hub.Command(["play", "a", "b", "c", "d", "e"]), "playing a and 4 more", "play with five names");
Check.Equal(Hub.Command(["play"]), "unknown command: play", "play with no name");

// Everything else
Check.Equal(Hub.Command(["dance"]), "unknown command: dance", "a command of one unknown word");
Check.Equal(Hub.Command(["open", "the", "door"]), "unknown command: open", "an unknown command of several words");
Check.Equal(Hub.Command(new string[0]), "say something", "an empty array of words");
