# SortLab

A sorting-algorithm race visualizer: pick up to 6 algorithms, give them the same random array, and watch them fight bar-by-bar with live compare/write counters.

## Algorithms

Bubble · Insertion · Selection · Merge (bottom-up) · Quick (iterative, Lomuto partition) · Heap

## Features

- All algorithms implemented as step-yielding generators — each yields a comparable frame, so the "race" is fair (1 array, same tick rate, op counts decide the winner)
- Color coding: blue idle, amber compare, red swap/write, green sorted/done
- Element count (15–90) and speed (1–200 steps/tick) sliders
- Winner banner with total operation count
- Algorithm selection + settings persist to localStorage

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## License

MIT
