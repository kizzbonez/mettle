Petal & Stem, a florist with two shops, keeps its order tool in TypeScript and runs it with Node's
type stripping during development. For deployment it now compiles with `tsc` into `dist`, with
declarations and source maps, and the developer wants a script that predicts the output folder
and the rewritten imports before changing the build.
