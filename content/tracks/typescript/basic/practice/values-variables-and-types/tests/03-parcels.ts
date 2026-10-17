import { doorsFree, parcelsWaiting } from "./solution.js";

check.equal(typeof parcelsWaiting, "number", "the kind of value parcelsWaiting holds");
check.equal(parcelsWaiting, 13, "the parcels waiting after both deliveries and the collection");
check.equal(doorsFree, 11, "the doors free, worked out from the parcels waiting");
