// SortLab — algorithm step generators.
// Each yields frames: { arr, i, j, kind: 'compare' | 'swap' | 'set' | 'done', stats }

function* bubbleSort(arr0) {
  const arr = [...arr0]
  let compares = 0, writes = 0
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      compares++
      yield { arr: [...arr], a: j, b: j + 1, kind: 'compare', compares, writes }
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        writes += 2
        yield { arr: [...arr], a: j, b: j + 1, kind: 'swap', compares, writes }
      }
    }
  }
  yield { arr: [...arr], kind: 'done', compares, writes }
}

function* insertionSort(arr0) {
  const arr = [...arr0]
  let compares = 0, writes = 0
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i]
    let j = i - 1
    while (j >= 0) {
      compares++
      yield { arr: [...arr], a: j, b: j + 1, kind: 'compare', compares, writes }
      if (arr[j] > key) {
        arr[j + 1] = arr[j]
        writes++
        yield { arr: [...arr], a: j, b: j + 1, kind: 'swap', compares, writes }
        j--
      } else break
    }
    arr[j + 1] = key
    writes++
  }
  yield { arr: [...arr], kind: 'done', compares, writes }
}

function* selectionSort(arr0) {
  const arr = [...arr0]
  let compares = 0, writes = 0
  for (let i = 0; i < arr.length - 1; i++) {
    let min = i
    for (let j = i + 1; j < arr.length; j++) {
      compares++
      yield { arr: [...arr], a: min, b: j, kind: 'compare', compares, writes }
      if (arr[j] < arr[min]) min = j
    }
    if (min !== i) {
      [arr[i], arr[min]] = [arr[min], arr[i]]
      writes += 2
      yield { arr: [...arr], a: i, b: min, kind: 'swap', compares, writes }
    }
  }
  yield { arr: [...arr], kind: 'done', compares, writes }
}

function* mergeSort(arr0) {
  const arr = [...arr0]
  let compares = 0, writes = 0
  // bottom-up merge so generator yields are flat
  for (let width = 1; width < arr.length; width *= 2) {
    for (let lo = 0; lo < arr.length - width; lo += 2 * width) {
      const mid = lo + width
      const hi = Math.min(lo + 2 * width, arr.length)
      // merge arr[lo..mid) and arr[mid..hi)
      const merged = []
      let i = lo, j = mid
      while (i < mid && j < hi) {
        compares++
        yield { arr: [...arr], a: i, b: j, kind: 'compare', compares, writes }
        merged.push(arr[i] <= arr[j] ? arr[i++] : arr[j++])
      }
      while (i < mid) merged.push(arr[i++])
      while (j < hi) merged.push(arr[j++])
      for (let k = 0; k < merged.length; k++) {
        arr[lo + k] = merged[k]
        writes++
        yield { arr: [...arr], a: lo + k, kind: 'set', compares, writes }
      }
    }
  }
  yield { arr: [...arr], kind: 'done', compares, writes }
}

function* quickSort(arr0) {
  const arr = [...arr0]
  let compares = 0, writes = 0
  const stack = [[0, arr.length - 1]]
  while (stack.length) {
    const [lo, hi] = stack.pop()
    if (lo >= hi) continue
    const pivot = arr[hi]
    let i = lo
    for (let j = lo; j < hi; j++) {
      compares++
      yield { arr: [...arr], a: j, b: hi, kind: 'compare', compares, writes }
      if (arr[j] < pivot) {
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]]
          writes += 2
          yield { arr: [...arr], a: i, b: j, kind: 'swap', compares, writes }
        }
        i++
      }
    }
    if (i !== hi) {
      [arr[i], arr[hi]] = [arr[hi], arr[i]]
      writes += 2
      yield { arr: [...arr], a: i, b: hi, kind: 'swap', compares, writes }
    }
    stack.push([lo, i - 1], [i + 1, hi])
  }
  yield { arr: [...arr], kind: 'done', compares, writes }
}

function* heapSort(arr0) {
  const arr = [...arr0]
  let compares = 0, writes = 0
  const n = arr.length
  function* sift(root, size) {
    while (true) {
      let child = 2 * root + 1
      if (child >= size) break
      if (child + 1 < size) {
        compares++
        yield { arr: [...arr], a: child, b: child + 1, kind: 'compare', compares, writes }
        if (arr[child + 1] > arr[child]) child++
      }
      compares++
      yield { arr: [...arr], a: root, b: child, kind: 'compare', compares, writes }
      if (arr[root] < arr[child]) {
        [arr[root], arr[child]] = [arr[child], arr[root]]
        writes += 2
        yield { arr: [...arr], a: root, b: child, kind: 'swap', compares, writes }
        root = child
      } else break
    }
  }
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) yield* sift(i, n)
  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]]
    writes += 2
    yield { arr: [...arr], a: 0, b: end, kind: 'swap', compares, writes }
    yield* sift(0, end)
  }
  yield { arr: [...arr], kind: 'done', compares, writes }
}

export const ALGOS = {
  bubble: { name: 'Bubble', gen: bubbleSort, complexity: 'O(n²)' },
  insertion: { name: 'Insertion', gen: insertionSort, complexity: 'O(n²)' },
  selection: { name: 'Selection', gen: selectionSort, complexity: 'O(n²)' },
  merge: { name: 'Merge', gen: mergeSort, complexity: 'O(n log n)' },
  quick: { name: 'Quick', gen: quickSort, complexity: 'O(n log n)' },
  heap: { name: 'Heap', gen: heapSort, complexity: 'O(n log n)' },
}

export function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) if (arr[i - 1] > arr[i]) return false
  return true
}
