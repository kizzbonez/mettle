import { passwordRating } from "./solution.js";

// The examples from the instructions.
check.equal(passwordRating("kiwi12"), "weak", 'passwordRating("kiwi12")');
check.equal(passwordRating("sunflower"), "fair", 'passwordRating("sunflower")');
check.equal(passwordRating("Sunflower2026!"), "strong", 'passwordRating("Sunflower2026!")');
check.equal(passwordRating("blue moon river"), "invalid", 'passwordRating("blue moon river")');
