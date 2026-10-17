import { driestAndWettest, totalRain, wetDays, wettestReadings } from "./solution.js";

// The example from the instructions.
const april = [0, 12.5, 3, 0, 22, 0.5, 0];
check.equal(totalRain(april), 38, "totalRain(april)");
check.equal(wetDays(april), 4, "wetDays(april)");
check.equal(driestAndWettest(april), [0, 22], "driestAndWettest(april)");
check.equal(wettestReadings(april, 3), [22, 12.5, 3], "wettestReadings(april, 3)");
check.equal(april, [0, 12.5, 3, 0, 22, 0.5, 0], "april after all four calls");
