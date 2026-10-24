import (
	"errors"
	"strconv"
)

func Test(t *testing.T) {
	good := map[string]int{"417": 417, " #23 ": 23, "#007": 7, "1": 1, "999": 999, "\t88\n": 88}
	for text, want := range good {
		bib, err := parseBib(text)
		check.NoError(err, "parseBib of a valid bib number returns no error")
		check.Equal(bib, want, "the number parseBib reads from a valid bib")
	}

	bib, err := parseBib("0")
	check.Equal(bib, 0, "parseBib returns 0 with an error")
	check.Error(err, "parseBib refuses bib 0")
	check.Equal(err.Error(), "bib 0 is not from 1 to 999", "the error for bib 0")
	_, err = parseBib("1000")
	check.Error(err, "parseBib refuses bib 1000")
	check.Equal(err.Error(), "bib 1000 is not from 1 to 999", "the error for bib 1000")
	_, err = parseBib("-5")
	check.Error(err, "parseBib refuses a negative bib")
	check.Equal(err.Error(), "bib -5 is not from 1 to 999", "the error for a negative bib")

	bib, err = parseBib("4l7")
	check.Equal(bib, 0, "parseBib returns 0 for text that is not a number")
	check.ErrorIs(err, strconv.ErrSyntax, "the error for text that is not a number wraps strconv's error with %w")
	_, err = parseBib(" x ")
	check.Error(err, `parseBib refuses " x "`)
	check.Equal(err.Error(), `bib " x ": strconv.Atoi: parsing "x": invalid syntax`, "the error quotes the text exactly as typed")
	_, err = parseBib("")
	check.Error(err, "parseBib refuses empty text")
	check.Equal(err.Error(), `bib "": strconv.Atoi: parsing "": invalid syntax`, "the error for empty text")
	_, err = parseBib("##417")
	check.Error(err, "parseBib removes only one leading #")
	_, err = parseBib("99999999999999999999")
	check.True(errors.Is(err, strconv.ErrRange), "the error for a number too big for an int wraps strconv's error")
}
