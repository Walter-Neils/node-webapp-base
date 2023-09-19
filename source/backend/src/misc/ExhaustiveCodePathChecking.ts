/**
 * Causes a compile-time error if the given value is not of type `never`. This function is used for exhaustiveness checking.
 * @param x The value, which is expected to be of type `never`.
 */
export function ALL_POSSIBLE_PATHS_MUST_BE_EXHAUSTIVELY_CHECKED_ON(
	x: never,
): never {
	throw new Error(`All possible paths must be exhaustively checked on ${x}`);
}
