import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"strings"
)

// bandSign returns the signature header the payment provider would send.
func bandSign(key, body []byte) string {
	mac := hmac.New(sha256.New, key)
	mac.Write(body)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

func Test(t *testing.T) {
	token := newResetToken()
	check.Equal(len(token), 26, "the length of a reset token")
	check.True(newResetToken() != token, "two reset tokens differ")

	key := []byte("subs-webhook-key-from-the-environment")
	body := []byte(`{"member":"ada","paid":4500}`)
	check.True(validSignature(key, body, bandSign(key, body)), "validSignature of a correctly signed body")
	check.True(!validSignature(key, []byte(`{"member":"ada","paid":45000}`), bandSign(key, body)),
		"validSignature of a body changed after signing")

	dir := t.TempDir()
	check.NoError(os.WriteFile(filepath.Join(dir, "march.pdf"), []byte("%PDF-1.7 march"), 0o644), "writing march.pdf")
	data, err := readScore(dir, "march.pdf")
	check.NoError(err, `readScore(dir, "march.pdf")`)
	check.Equal(string(data), "%PDF-1.7 march", `the contents readScore returns for "march.pdf"`)
	_, err = readScore(dir, "../../etc/passwd.pdf")
	check.Error(err, `readScore(dir, "../../etc/passwd.pdf"), a name that leaves the folder`)

	var page strings.Builder
	check.NoError(renderWelcome(&page, "Ada <3", "cornet"), "renderWelcome")
	check.Equal(page.String(), "<h1>Welcome, Ada &lt;3!</h1>\n<p><a href=\"/scores?part=cornet\">Scores for cornet</a></p>\n",
		`the page renderWelcome writes for "Ada <3", "cornet"`)
}
