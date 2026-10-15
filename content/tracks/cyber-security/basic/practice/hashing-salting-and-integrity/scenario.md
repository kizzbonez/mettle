Spoke & Chain, an online bicycle shop, ships an order as soon as its payment provider calls the
shop's webhook to say "paid". Anyone on the internet can call that address, so the shop must check
the HMAC tag on every notification before it believes one.
