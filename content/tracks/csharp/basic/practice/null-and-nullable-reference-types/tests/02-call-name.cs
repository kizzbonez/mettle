Check.True(HostelDesk.CallName("Ada", null) == "Ada", "a guest without a nickname is called by the first name");
Check.True(HostelDesk.CallName("Ada", "Countess") == "Countess", "a guest with a nickname is called by the nickname");
Check.True(HostelDesk.CallName("Bo", "B") == "B", "a nickname is used even when it is shorter than the first name");
Check.True(HostelDesk.CallName("Lin Mei", null) == "Lin Mei", "a first name of two words is used whole");

string? maybe = null;
Check.True(HostelDesk.CallName("Kofi", maybe) == "Kofi", "a nickname variable that holds null counts as no nickname");
maybe = "Kof";
Check.True(HostelDesk.CallName("Kofi", maybe) == "Kof", "the same variable holding a nickname is used");
