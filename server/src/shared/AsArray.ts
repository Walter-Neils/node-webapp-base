export type PossibleArray<T> = T | T[];

/**
 * @brief Converts a possible array instance into an guarenteed array instance
 * @param input 
 * @returns 
 */
export function AsArray<T>(input: PossibleArray<T>)
{
    if (input instanceof Array)
    {
        return input;
    }
    else
    {
        return [ input ];
    }
}