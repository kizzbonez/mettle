var camera = new Plate("KD71 XMR");

// Equals ignores case and spaces, and nothing else.
Check.True(camera.Equals(new Plate("KD71 XMR")), "two plates typed the same way");
Check.True(camera.Equals(new Plate("kd71 xmr")), "a plate typed in lower case");
Check.True(camera.Equals(new Plate("Kd71XmR")), "a plate typed in mixed case without its space");
Check.True(camera.Equals(new Plate(" KD 71 X M R ")), "a plate typed with spaces in other places and around it");
Check.True(camera.Equals(camera), "a plate compared with itself");
Check.True(!camera.Equals(new Plate("KD71 XMS")), "plates that differ in one letter");
Check.True(!camera.Equals(new Plate("KD71 XM")), "a plate with a letter missing");
Check.True(!camera.Equals(new Plate("KD71-XMR")), "a hyphen is not a space");
Check.True(!camera.Equals(null), "a plate compared with null");
Check.True(!camera.Equals("KD71 XMR"), "a plate compared with a string of the same text");
Check.True(new Plate("ab1").Equals(new Plate("AB 1")), "equality works the same way in both directions");
Check.True(new Plate("AB 1").Equals(new Plate("ab1")), "equality works the same way in both directions, reversed");

// The code keeps what was typed.
Check.Equal(new Plate(" kd71xmr").Code, " kd71xmr", "the code of a plate keeps the text exactly as it was typed");

// Hash codes agree with Equals.
Check.True(camera.GetHashCode() == new Plate("kd71xmr").GetHashCode(), "the hash codes of two equal plates");
Check.True(camera.GetHashCode() == new Plate(" K D 7 1 X M R").GetHashCode(), "the hash codes of equal plates with spaces in other places");

// Hash-based collections find the same car however it was typed.
var seen = new HashSet<Plate> { camera };
Check.True(seen.Contains(new Plate("kd71xmr")), "a HashSet finds a plate typed another way");
Check.True(!seen.Contains(new Plate("KD71 XMS")), "a HashSet does not find a different car");
Check.True(!seen.Add(new Plate("KD 71 XMR")), "a HashSet refuses a second copy of the same car");

var owners = new Dictionary<Plate, string> { [new Plate("YA19 PLN")] = "Ada" };
Check.True(owners.ContainsKey(new Plate("ya19pln")), "a dictionary finds a plate key typed another way");
Check.Equal(owners[new Plate("YA19PLN")], "Ada", "the value stored under a plate key, looked up with another spelling");

// Equals does not change ==.
var twin = new Plate("KD71 XMR");
Check.True(!(camera == twin), "== on two plate objects with the same code");
Check.True(!ReferenceEquals(camera, twin), "ReferenceEquals on two plate objects with the same code");
Plate same = camera;
Check.True(camera == same, "== on two variables that refer to one plate object");
