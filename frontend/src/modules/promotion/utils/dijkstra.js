/**
 * Minimal, dependency-free Dijkstra shortest-path implementation.
 *
 * The graph is expressed as an adjacency map:
 *   { nodeId: [{ to: otherId, weight: number }, ...], ... }
 *
 * Weights must be non-negative (road distances/durations always are).
 */

/**
 * Compute shortest paths from a single source to every reachable node.
 *
 * @param {Record<string, Array<{ to: string, weight: number }>>} adjacency
 * @param {string} sourceId
 * @returns {{ distances: Record<string, number>, previous: Record<string, string|null> }}
 */
export function dijkstra(adjacency, sourceId) {
  const distances = {}
  const previous = {}
  const visited = new Set()

  for (const nodeId of Object.keys(adjacency)) {
    distances[nodeId] = Infinity
    previous[nodeId] = null
  }
  distances[sourceId] = 0

  // Small graphs (<= ~25 nodes) don't need a binary heap; a linear scan for the
  // nearest unvisited node keeps this readable without a meaningful cost.
  while (visited.size < Object.keys(adjacency).length) {
    let current = null
    let currentDistance = Infinity

    for (const nodeId of Object.keys(adjacency)) {
      if (visited.has(nodeId)) continue
      if (distances[nodeId] < currentDistance) {
        current = nodeId
        currentDistance = distances[nodeId]
      }
    }

    // Remaining nodes are unreachable from the source.
    if (current === null) break
    visited.add(current)

    for (const edge of adjacency[current] || []) {
      if (visited.has(edge.to)) continue
      const candidate = distances[current] + edge.weight
      if (candidate < distances[edge.to]) {
        distances[edge.to] = candidate
        previous[edge.to] = current
      }
    }
  }

  return { distances, previous }
}

/**
 * Reconstruct the ordered node path from the source to a target using the
 * `previous` map returned by {@link dijkstra}. Returns an empty array when the
 * target is unreachable.
 *
 * @param {Record<string, string|null>} previous
 * @param {string} sourceId
 * @param {string} targetId
 * @returns {string[]}
 */
export function reconstructPath(previous, sourceId, targetId) {
  const path = []
  let node = targetId

  while (node && node !== sourceId) {
    path.unshift(node)
    node = previous[node]
    // Guard against cycles / disconnected targets.
    if (node === undefined) return []
  }

  if (node === sourceId) {
    path.unshift(sourceId)
    return path
  }

  return []
}

/**
 * Build a sparse adjacency map connecting every node only to its `k` nearest
 * neighbours (by the supplied weight matrix). Keeping the graph sparse lets
 * Dijkstra route through intermediate stops instead of always taking the direct
 * edge, which is what turns "nearest points" into a genuine itinerary path.
 *
 * @param {string[]} ids           Node ids, index-aligned with `matrix`.
 * @param {number[][]} matrix       matrix[i][j] = weight from ids[i] to ids[j].
 * @param {number} k                Neighbours to keep per node.
 * @returns {Record<string, Array<{ to: string, weight: number }>>}
 */
export function buildKNearestGraph(ids, matrix, k = 3) {
  const adjacency = {}

  ids.forEach((fromId, i) => {
    const neighbours = ids
      .map((toId, j) => ({ to: toId, weight: matrix[i]?.[j] }))
      .filter((edge, j) => j !== i && Number.isFinite(edge.weight))
      .sort((a, b) => a.weight - b.weight)
      .slice(0, k)

    adjacency[fromId] = neighbours
  })

  // Make edges bidirectional so a node reachable *to* another is reachable back.
  ids.forEach((fromId) => {
    for (const edge of adjacency[fromId]) {
      const reverse = adjacency[edge.to]
      if (!reverse.some((existing) => existing.to === fromId)) {
        reverse.push({ to: fromId, weight: edge.weight })
      }
    }
  })

  return adjacency
}
