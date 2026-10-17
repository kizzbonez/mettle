import { passwordRating } from "./solution.js";

check.equal(passwordRating(""), "weak", "an empty password is weak");
check.equal(passwordRating("A1b2C3d"), "weak", "7 characters are too short, even with digits and capitals");
check.equal(passwordRating("Abc12345"), "fair", "exactly 8 characters are no longer weak");
check.equal(passwordRating("lighthouse"), "fair", "10 lower-case letters are fair");
