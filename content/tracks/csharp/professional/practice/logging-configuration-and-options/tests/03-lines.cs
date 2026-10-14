// The shape of a line, values, positions and secrets.
var sink = new ListSink();
var log = new LineLogger("Snowmaking.Weather", Level.Trace, sink);

string Last() => sink.Lines[^1];

log.Log(Level.Information, "Night shift started");
Check.Equal(Last(), "level=Information category=Snowmaking.Weather template=\"Night shift started\"",
    "a template without placeholders gives three fields");

log.Log(Level.Debug, "Wet bulb {WetBulb} at {Station} after {Minutes} min", -2.75, "Summit", 15);
Check.Equal(Last(), "level=Debug category=Snowmaking.Weather template=\"Wet bulb {WetBulb} at {Station} after {Minutes} min\" WetBulb=-2.75 Station=Summit Minutes=15",
    "fields in the order the placeholders appear, with a negative number written with the invariant culture");

log.Log(Level.Information, "{Second} before {First}", "b", "a");
Check.Equal(Last(), "level=Information category=Snowmaking.Weather template=\"{Second} before {First}\" Second=b First=a",
    "placeholders bind to the values by position, not by name");

log.Log(Level.Information, "Depth {Depth_cm} reached {Reached} on {Day}", 45.5m, true, new DateOnly(2026, 12, 24));
Check.Equal(Last(), "level=Information category=Snowmaking.Weather template=\"Depth {Depth_cm} reached {Reached} on {Day}\" Depth_cm=45.5 Reached=True Day=12/24/2026",
    "a decimal, a bool and a date, and a placeholder name with an underscore");

log.Log(Level.Warning, "Operator {Operator} note {Note}", null, "frost");
Check.Equal(Last(), "level=Warning category=Snowmaking.Weather template=\"Operator {Operator} note {Note}\" Operator=null Note=frost",
    "a null value is written as null");

log.Log(Level.Information, "Gun {Gun} and gun {Gun}", 1, 2);
Check.Equal(Last(), "level=Information category=Snowmaking.Weather template=\"Gun {Gun} and gun {Gun}\" Gun=1 Gun=2",
    "a placeholder that appears twice takes two values, one field each");

// Secrets.
log.Log(Level.Error, "Login {User} {password} {APIKEY} {connectionString}", "ops", "hunter2", "k-77", "Server=db;Password=x");
Check.Equal(Last(), "level=Error category=Snowmaking.Weather template=\"Login {User} {password} {APIKEY} {connectionString}\" User=ops password=*** APIKEY=*** connectionString=***",
    "the values of secret fields are hidden, whatever the case of their names");
log.Log(Level.Information, "Used {TokenCount} tokens of {Password_Hint}", 3, "pet");
Check.Equal(Last(), "level=Information category=Snowmaking.Weather template=\"Used {TokenCount} tokens of {Password_Hint}\" TokenCount=3 Password_Hint=pet",
    "a field whose name only contains a secret name is written as usual");

// One line per call.
Check.Equal(sink.Lines.Count, 8, "lines written for eight enabled calls");

// Placeholders and values that do not match.
Check.Throws<ArgumentException>(() => log.Log(Level.Information, "Gun {Gun} at {Bar} bar", 4), "a template with more placeholders than values");
Check.Throws<ArgumentException>(() => log.Log(Level.Information, "Gun {Gun}", 4, 9.5), "a template with fewer placeholders than values");
Check.Throws<ArgumentException>(() => log.Log(Level.Information, "Night shift ended", "extra"), "a template without placeholders and one value");
Check.Equal(sink.Lines.Count, 8, "lines written by calls whose values do not match their template");
