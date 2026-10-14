A two-person web agency hosts each client's static site behind nginx. Every new client means
copying an old server block by hand and fixing the names, and last month a copied `$host` was
replaced by the agency's own server name, so they want a script that writes the block itself.
