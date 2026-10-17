import { totalRain, wetDays } from "./solution.js";

const noReadings: readonly number[] = [];
check.equal(totalRain(noReadings), 0, "the total of no readings");
check.equal(wetDays(noReadings), 0, "the wet days among no readings");
check.equal(totalRain([0, 0, 0]), 0, "the total of a dry week");
check.equal(wetDays([0, 0, 0]), 0, "the wet days of a dry week");
check.equal(totalRain([4, 4, 4]), 12, "the total of three equal readings");
check.equal(wetDays([4, 4, 4]), 3, "the wet days when it rained every day");
check.equal(totalRain([0.5, 0, 1.25]), 1.75, "the total of readings with fractions");
check.equal(wetDays([0.5, 0, 1.25]), 2, "a fraction of a millimetre still counts as a wet day");
