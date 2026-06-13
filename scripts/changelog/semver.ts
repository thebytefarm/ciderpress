/**
 * A semver string split into comparable parts. Pre-release identifiers are
 * kept as a raw string and compared lexically.
 */
export interface ParsedSemver {
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly pre: string | null
}

/**
 * Parse a semver string into its numeric components. Falls back to
 * `0.0.0-{input}` when the input doesn't match a `MAJOR.MINOR.PATCH` core,
 * so unparseable versions still sort somewhere deterministic.
 * @param v - the version string (e.g. `1.2.3` or `1.2.3-beta.1`)
 * @returns the parsed parts
 */
export function parseSemver(v: string): ParsedSemver {
  const { core, pre } = splitCoreAndPre(v)
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(core)
  if (!match) {
    return { major: 0, minor: 0, patch: 0, pre: v }
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    pre,
  }
}

/**
 * Compare two semver strings in descending order, so newer versions sort
 * first. A stable release ranks above any pre-release of the same core.
 * @param a - left-hand semver
 * @param b - right-hand semver
 * @returns negative when `a` is newer, positive when `b` is newer, zero when equal
 */
export function compareSemverDesc(a: string, b: string): number {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  if (pa.major !== pb.major) {
    return pb.major - pa.major
  }
  if (pa.minor !== pb.minor) {
    return pb.minor - pa.minor
  }
  if (pa.patch !== pb.patch) {
    return pb.patch - pa.patch
  }
  if (pa.pre === null && pb.pre !== null) {
    return -1
  }
  if (pa.pre !== null && pb.pre === null) {
    return 1
  }
  if (pa.pre === null && pb.pre === null) {
    return 0
  }
  return (pb.pre ?? '').localeCompare(pa.pre ?? '')
}

/**
 * Split a semver string into its core (`X.Y.Z`) and pre-release tail.
 * @param v - the version string
 * @returns the core string and a pre-release suffix when present
 * @private
 */
function splitCoreAndPre(v: string): { readonly core: string; readonly pre: string | null } {
  const dashIdx = v.indexOf('-')
  if (dashIdx === -1) {
    return { core: v, pre: null }
  }
  return { core: v.slice(0, dashIdx), pre: v.slice(dashIdx + 1) }
}
