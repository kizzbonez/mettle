The city library has a dozen branches, and each branch runs its own little catalogue server on
whatever computer it could get. When a reader at the front desk asks whether anyone has a copy of
a book, the desk system phones every catalogue in turn, so the reader waits half a minute for
twelve answers. Worse, one branch's server, an old machine in the Old Town basement, often does
not answer at all, and the desk system then waits for it forever. The Docks branch shares its
server with the café till and sometimes says "busy, try again". Last month a librarian also
noticed that the desk system's running count of results was wrong whenever two branches answered
at once.

You are writing the replacement: a stock check that asks the branches at the same time, but never
more than a few at once so as not to swamp the city network; gives each call a time limit; tries
a busy or silent branch again after a pause that doubles each time; keeps a running tally that
the desk screen can read while the check is still going; lists the answers in the usual branch
order; and stops everything at once, leaving nothing running, when the reader walks away.
