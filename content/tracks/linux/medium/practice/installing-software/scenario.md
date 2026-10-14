A games studio pins the package versions its build servers must run. Each server saves its
`dpkg -l` listing every night, and a script compares it with the pinned list before anyone wonders
why a build broke.
