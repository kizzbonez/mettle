import { passwordRating } from "./solution.js";

check.equal(passwordRating("Harbourview7"), "strong", "exactly 12 characters with a digit and a capital are strong");
check.equal(passwordRating("LIGHTHOUSE99"), "strong", "capitals and digits only, 12 characters, are strong");
check.equal(passwordRating("harbourview7"), "fair", "12 characters without a capital are only fair");
check.equal(passwordRating("Harbourviews"), "fair", "12 characters without a digit are only fair");
check.equal(passwordRating("Harbourvie7"), "fair", "11 characters with a digit and a capital are only fair");
check.equal(passwordRating("harbour-view-seven"), "fair", "a long password with neither a digit nor a capital is fair");
