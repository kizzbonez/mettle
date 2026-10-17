// The example from the instructions.
import { groupBy, pickOr, tourStops, type Bike } from "./solution.js";

const fleet: Bike[] = [
  { id: "b1", size: "M", electric: false, dailyRate: 18 },
  { id: "b2", size: "L", electric: true, dailyRate: 35 },
  { id: "b3", size: "M", electric: true, dailyRate: 32 },
];

const bySize = groupBy(fleet, "size");
const firstSize: Bike["size"] = [...bySize.keys()][0];
check.equal(firstSize, "M", "groupBy's first key is the first size in the fleet");
check.equal([...bySize.keys()], ["M", "L"], "groupBy keeps the sizes in the order they first appear");
check.equal(bySize.get("M")?.map((bike) => bike.id), ["b1", "b3"], "groupBy collects both medium bikes in order");
check.equal(bySize.get("L")?.map((bike) => bike.id), ["b2"], "groupBy collects the large bike");

check.equal(pickOr(["S", "M", "L"], "L", "M"), "L", "pickOr returns a request that is one of the choices");
check.equal(pickOr(["S", "M", "L"], "XL", "M"), "M", "pickOr falls back when the request is not a choice");

const tour = tourStops(["Harbour", "Old Mill", "Lighthouse"]);
check.equal(tour, ["Harbour", "Old Mill", "Lighthouse"], "tourStops returns the stops in order");
const repeated = check.throws(() => tourStops(["Harbour", "Pier", "Harbour"]), "tourStops throws when a stop appears twice");
check.equal(repeated.message, 'stop "Harbour" appears twice', "the error message names the repeated stop");
