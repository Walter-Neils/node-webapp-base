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

	constructor(attributeExtractor: (value: CachedValueType) => KeyAttributes) {
		this._attributeExtractor = attributeExtractor;
	}

	public push(value: CachedValueType) {
		this._cache.push({
			attributes: this._attributeExtractor(value),
			value: new WeakRef(value),
		});
	}

	public filter(predicate: (value: KeyAttributes) => boolean) {
		// Find all matching values
		return this._cache
			.filter(item => predicate(item.attributes))
			.map(item => item.value.deref())
			.filter(item => item !== undefined) as CachedValueType[];
	}

	public find(predicate: (value: KeyAttributes) => boolean) {
		return this._cache
			.find(item => predicate(item.attributes))
			?.value.deref();
	}

	public getAll() {
		return this._cache
			.map(item => item.value.deref())
			.filter(item => item !== undefined) as CachedValueType[];
	}

	private clean() {
		this._cache = this._cache.filter(
			item => item.value.deref() !== undefined,
		);
	}

	public get length() {
		this.clean();
		return this._cache.length;
	}
}
