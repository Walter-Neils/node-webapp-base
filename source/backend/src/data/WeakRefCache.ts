/**
 * A cache that stores values as weak references.
 */
export default class WeakRefCache<
	CachedValueType extends Record<string, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	KeyAttributes extends Partial<CachedValueType>,
> {
	private _cache: Array<{
		attributes: KeyAttributes;
		value: WeakRef<CachedValueType>;
	}> = [];

	private _attributeExtractor: (value: CachedValueType) => KeyAttributes;

	/**
	 * Creates a new WeakRefCache
	 * @param attributeExtractor A function that extracts the attributes from a value. The attributes will be used to find values in the cache.
	 */
	constructor(attributeExtractor: (value: CachedValueType) => KeyAttributes) {
		this._attributeExtractor = attributeExtractor;
	}

	/**
	 * Adds a value to the cache
	 * @param value The value to add
	 */
	public push(value: CachedValueType) {
		this._cache.push({
			attributes: this._attributeExtractor(value),
			value: new WeakRef(value),
		});
	}

	/**
	 * Find all values that match the predicate
	 * @param predicate The predicate to match
	 * @returns All values that match the predicate
	 */
	public filter(predicate: (value: KeyAttributes) => boolean) {
		// Find all matching values
		return this._cache
			.filter(item => predicate(item.attributes))
			.map(item => item.value.deref())
			.filter(item => item !== undefined) as CachedValueType[];
	}

	/**
	 * Find the first value that matches the predicate
	 * @param predicate The predicate to match
	 * @returns The first value that matches the predicate
	 */
	public find(predicate: (value: KeyAttributes) => boolean) {
		return this._cache
			.find(item => predicate(item.attributes))
			?.value.deref();
	}

	/**
	 * Finds all values that are still alive
	 */
	public getAll() {
		return this._cache
			.map(item => item.value.deref())
			.filter(item => item !== undefined) as CachedValueType[];
	}

	/**
	 * Removes all values that are no longer alive
	 */
	private clean() {
		this._cache = this._cache.filter(
			item => item.value.deref() !== undefined,
		);
	}

	/**
	 * Gets the number of surviving values in the cache
	 */
	public get length() {
		this.clean();
		return this._cache.length;
	}
}
