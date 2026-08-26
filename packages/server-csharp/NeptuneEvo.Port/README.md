# NeptuneEvo incremental migration project

This project compiles source files directly from the sibling NeptuneEvo tree.
It does not copy or fork gameplay code. Every successful addition proves that
the corresponding original file compiles against the FiveM compatibility API.

The first compiled source is `NeptuneEvo/Main.cs`. Subsequent changes should add
complete vertical slices (model + repository + events) rather than isolated
files with fake production dependencies.
