/**
 * Used to indicate a code path which should be impossible to reach. Handy for cases where a possible T | null | undefined is known to be a proper instance of T, but
 * the TS compiler cannot safely determine it. 
 * @param why Why the code path should be impossible to reach.
 */
export function Impossible(why: string): never
{
    throw new Error(`Impossible situtation: ${why}`);
}