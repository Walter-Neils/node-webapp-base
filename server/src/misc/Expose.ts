/**
 * Exposes a value to the global scope for debugging purposes
 * @param target The value to expose
 * @param byName The name by which to expose the value
 */
export function DevExpose(target: any, byName: string)
{
    // Create the path if it doesn't exist
    const components = byName.split('.');
    let valueStack: any[] = [ globalThis ];
    for (const component of components.slice(0, -1))
    {
        // Get the current value
        let current = valueStack[ valueStack.length - 1 ];

        // Create the value if it doesn't exist
        if (!current[ component ])
        {
            current[ component ] = {};
        }

        // Push the value onto the stack
        valueStack.push(current[ component ]);
    }

    // Set the value 
    valueStack[ valueStack.length - 1 ][ components[ components.length - 1 ] ] = target;
}