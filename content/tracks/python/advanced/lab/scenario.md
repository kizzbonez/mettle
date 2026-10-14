The Hollow Oak Makerspace has a corner of five 3D printers that run every night. During the
day, members pin print jobs to a board: a replacement gear for a washing machine, a hinge for a
garden gate, a vase for a craft fair. Each job has a short id, a priority from 1 (needed
tomorrow) to 5 (whenever there is time) and the grams of filament it needs.

At closing time a volunteer used to walk along the printers and start the most urgent jobs by
hand, then come back every hour to start the next ones. Jobs were started twice, urgent ones
waited behind a slow vase, and a printer that jammed halfway stayed marked as "busy" on the
whiteboard until somebody noticed in the morning.

You are writing the makerspace's new print controller in Python: a print job that validates
itself and sorts by urgency, a job board that behaves like a proper container, a printer that is
always released when a print ends, even when it fails, and an asynchronous overnight run that
keeps every printer working, starts the jobs strictly in order of urgency and prints each one
exactly once.
