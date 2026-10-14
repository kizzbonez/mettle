string[] till = ["APL-gala", "PEA-conference", "APL-pink-lady", "apl-jazz", "APLX-cox", "PEA", "XAPL-fuji", "APL-gala", "PEA-comice"];

// Each type finds its own barcodes, in order, through its static Prefix.
Check.SequenceEqual(
    Market.Scan<Apple>(till),
    [new Apple("gala"), new Apple("pink-lady"), new Apple("gala")],
    "the apples on the till: the prefix and a dash, exactly, at the start");
Check.SequenceEqual(
    Market.Scan<Pear>(till),
    [new Pear("conference"), new Pear("comice")],
    "the pears on the till");

// Everything after the dash is the code, dashes included.
Check.SequenceEqual(
    Market.Scan<Apple>(["APL-red-delicious"]),
    [new Apple("red-delicious")],
    "a code that contains a dash of its own");

// Nothing to find.
Check.Equal(Market.Scan<Apple>([]).Count, 0, "no apples on an empty till");
Check.Equal(Market.Scan<Pear>(["APL-gala", "PEAR-williams", "pea-comice"]).Count, 0, "no pears when no barcode starts with PEA and a dash");

// The barcodes may be any sequence, read once from start to end.
IEnumerable<string> Scanner()
{
    yield return "PEA-rocha";
    yield return "APL-braeburn";
    yield return "PEA-forelle";
}
Check.SequenceEqual(Market.Scan<Pear>(Scanner()), [new Pear("rocha"), new Pear("forelle")], "the pears from a lazy sequence of barcodes");
