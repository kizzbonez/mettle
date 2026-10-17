Fireside Clay is a members' pottery studio with one electric kiln. Every Friday night the kiln is
loaded and fired, and members book shelf space in it during the week: how many pieces they bring,
how much they weigh, and the **cone**, the firing temperature their clay and glazes need (`06`
and `04` for low-fire earthenware, `6` for mid-fire stoneware, `10` for high-fire porcelain).
The kiln's shelves hold a fixed weight; once it is reached, the firing is full.

Bookings arrive from a small web form and a tablet by the kiln, both talking to a booking service
over HTTP. The current service was written in a weekend. It reads `process.env` in a dozen
places and starts happily with `KILN_PORT=eighty`, stores whatever JSON it is sent (one member's
"weight" was the string `"heavy"`), answers a typo in the body with a stack trace that once
showed the database password, and loses the booking being saved whenever the studio's host
restarts it to install updates.

You are writing its replacement in TypeScript: configuration parsed once and refused when wrong,
every booking validated field by field, one structured shape for every error, and a server that
finishes the requests it has started before it stops. The studio also wants the types to carry
the rules, so the web form's developers cannot send a cone that does not exist or read a booking
out of a failed validation.
