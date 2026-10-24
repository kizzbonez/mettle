import (
	"bytes"
	"errors"
)

// bandFailingWriter fails every write.
type bandFailingWriter struct{}

func (bandFailingWriter) Write([]byte) (int, error) { return 0, errors.New("disk full") }

func Test(t *testing.T) {
	var page bytes.Buffer
	check.NoError(renderWelcome(&page, "Bo", "tenor horn"), "renderWelcome of a plain name")
	check.Equal(page.String(), "<h1>Welcome, Bo!</h1>\n<p><a href=\"/scores?part=tenor%20horn\">Scores for tenor horn</a></p>\n",
		"the page for a plain name and a part with a space")

	page.Reset()
	check.NoError(renderWelcome(&page, `<script>alert("x")</script>`, "cornet"), "renderWelcome of a name with a script")
	check.Equal(page.String(),
		"<h1>Welcome, &lt;script&gt;alert(&#34;x&#34;)&lt;/script&gt;!</h1>\n<p><a href=\"/scores?part=cornet\">Scores for cornet</a></p>\n",
		"the page for a name that contains a script tag")

	page.Reset()
	check.NoError(renderWelcome(&page, "Cy & Dee", `x" onclick="steal()`), "renderWelcome of a part that tries to add an attribute")
	check.Equal(page.String(),
		"<h1>Welcome, Cy &amp; Dee!</h1>\n<p><a href=\"/scores?part=x%22%20onclick%3d%22steal%28%29\">Scores for x&#34; onclick=&#34;steal()</a></p>\n",
		"the page for a part that tries to break out of the link")

	check.Error(renderWelcome(bandFailingWriter{}, "Eli", "drums"), "renderWelcome returns the writer's error")
}
