import { passwordRating } from "./solution.js";

check.equal(passwordRating("Harbour View 77"), "invalid", "a space makes even a long password with digits and capitals invalid");
check.equal(passwordRating(" Harbourview77"), "invalid", "a space at the start makes a password invalid");
check.equal(passwordRating("Harbourview77 "), "invalid", "a space at the end makes a password invalid");
check.equal(passwordRating("ab c"), "invalid", "a short password with a space is invalid, not weak");
check.equal(passwordRating(" "), "invalid", "a password of one space is invalid");
