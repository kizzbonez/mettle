import (
	"crypto/rand"
	"strings"
	"testing/cryptotest"
)

func Test(t *testing.T) {
	seen := map[string]bool{}
	for range 50 {
		token := newResetToken()
		check.Equal(len(token), 26, "the length of a reset token")
		check.True(strings.Trim(token, "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567") == "",
			"a reset token uses only the base32 alphabet")
		check.True(!seen[token], "reset tokens never repeat")
		seen[token] = true
	}

	// With crypto/rand made deterministic, a token from crypto/rand.Text can be
	// predicted by the test; a token from any other source cannot.
	cryptotest.SetGlobalRandom(t, 2026)
	got := newResetToken()
	cryptotest.SetGlobalRandom(t, 2026)
	check.Equal(got, rand.Text(), "the reset token comes from crypto/rand's Text")

	key := []byte("subs-webhook-key-from-the-environment")
	body := []byte(`{"member":"bo","paid":3000,"month":"2026-09"}`)
	good := bandSign(key, body)
	hexPart := strings.TrimPrefix(good, "sha256=")

	check.True(validSignature(key, body, good), "a correct signature")
	check.True(validSignature(key, body, "sha256="+strings.ToUpper(hexPart)), "a correct signature in upper-case hex")
	check.True(!validSignature(key, body, hexPart), "a signature without the sha256= prefix")
	check.True(!validSignature(key, body, "sha1="+hexPart), "a signature with another prefix")
	check.True(!validSignature(key, body, "sha256="), "an empty signature after the prefix")
	check.True(!validSignature(key, body, ""), "an empty header")
	check.True(!validSignature(key, body, "sha256="+hexPart[:62]), "a signature one byte short")
	check.True(!validSignature(key, body, good+"00"), "a signature one byte long")
	check.True(!validSignature(key, body, "sha256=zz"+hexPart[2:]), "a signature that is not hex")
	check.True(!validSignature([]byte("guessed-key"), body, good), "a signature checked with another key")
	check.True(!validSignature(key, append(body, ' '), good), "a body with one extra space")
	check.True(validSignature([]byte("k"), nil, bandSign([]byte("k"), nil)), "a correct signature of an empty body")
}
