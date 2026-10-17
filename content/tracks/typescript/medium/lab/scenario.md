On the first Saturday of every month, the Riverside Repair Café fills a church hall with
volunteers who mend what people bring in: toasters, bicycles, jackets, wobbly chairs. Visitors
book their item through a web form, and the volunteers record what happened to it. At the end of
the day the form's database is exported as a JSON file of **tickets**:

```json
{
  "id": "T-002",
  "owner": "  Tom Becker ",
  "item": "Denim jacket",
  "category": "textile",
  "outcome": { "status": "needs-part", "part": "brass zip" }
}
```

A ticket's outcome is one of four things: still **waiting** for a volunteer, **fixed** (and how
many minutes it took), **needs a part** (and which), or **unrepairable** (and why). Each kind
carries different details, which is exactly what a discriminated union is for.

The export is not clean. The form lets people type spaces around their name, an old version of
it allowed a category called `garden`, a volunteer once typed the minutes as text, and a ticket
sometimes appears twice. The organizers' current script trusts the file, so one bad entry
crashes the monthly report, or worse, quietly adds `"20"` to a number.

You are writing the TypeScript module behind the new report. It validates every entry and says
exactly which ones it rejected and why, describes outcomes, counts them, applies corrections, and
asks the café's partner hardware shop, through its slow and occasionally failing price service,
what the missing parts will cost.
