import { expressApp } from '../core/express.js';

export type PathComponent =
	| {
			type: 'literal';
			value: string;
	  }
	| {
			type: 'parameter';
			paramName: string;
			valueType: TypeDefinition & {
				type: 'string' | 'number' | 'boolean';
			};
	  };

export type TypeDefinition = {
	optional?: boolean;
} & (
	| {
			type: 'string';
	  }
	| {
			type: 'number';
	  }
	| {
			type: 'boolean';
	  }
	| {
			type: 'array';
			elementType: TypeDefinition;
	  }
	| {
			type: 'object';
			properties: {
				[key: string]: TypeDefinition;
			};
	  }
	| {
			type: 'reference';
			typeName: string;
	  }
	| {
			type: 'unknown';
	  }
	| {
			type: 'union';
			options: TypeDefinition[];
	  }
);

export type TypeDefinitionToTypeScript<T extends TypeDefinition> = T extends {
	type: 'string';
}
	? string
	: T extends { type: 'number' }
	? number
	: T extends { type: 'boolean' }
	? boolean
	: T extends { type: 'array'; elementType: infer U extends TypeDefinition }
	? TypeDefinitionToTypeScript<U>[]
	: T extends {
			type: 'object';
			properties: infer U extends { [key: string]: TypeDefinition };
	  }
	? { [K in keyof U]: TypeDefinitionToTypeScript<U[K]> }
	: never;

function compareTypeDefinitions(t1: TypeDefinition, t2: TypeDefinition) {
	return JSON.stringify(t1) === JSON.stringify(t2);
}

export type QueryParameter = {
	name: string;
	type: TypeDefinition & {
		optional: false;
	} & {
		type: 'string' | 'number' | 'boolean';
	};
};

export type CacheBehaviour =
	| {
			cache: true;
			maximumAge: number;
			refreshAge: number;
			groups: string[];
	  }
	| {
			cache: false;
	  };

export type APIEndpoint = {
	name: string;
	method: string;
	path: PathComponent[];
	queryParameters?: QueryParameter[];
	body?: TypeDefinition;
	response: TypeDefinition;
	cacheBehaviour?: CacheBehaviour;
};

export class APIImplementationBuilder {
	private apiEndpoints: APIEndpoint[];

	private namedTypes: {
		[key: string]: TypeDefinition;
	} = {};

	constructor(apiBuilder: APIBuilder) {
		this.apiEndpoints = apiBuilder.getEndpoints();
	}

	public get namedTypeNames() {
		return Object.keys(this.namedTypes);
	}

	public getTypeName(type: TypeDefinition): string | null {
		for (const [name, t] of Object.entries(this.namedTypes)) {
			if (compareTypeDefinitions(t, type)) {
				return name;
			}
		}
		return null;
	}

	public namedType(name: string, type: TypeDefinition) {
		this.namedTypes[name] = type;
	}

	public generateInlineTypeDefinition(type: TypeDefinition): string {
		let result = '';
		result += this.debugComment('Generating inline type definition');
		result += (() => {
			if (type.type === 'string') {
				return 'string';
			} else if (type.type === 'number') {
				return 'number';
			} else if (type.type === 'boolean') {
				return 'boolean';
			} else if (type.type === 'array') {
				return `${this.useType(type.elementType)}[]`;
			} else if (type.type === 'object') {
				let result = '{';
				for (const [key, value] of Object.entries(type.properties)) {
					result += `${key}: ${this.useType(value)};`;
				}
				result += '}';
				return result;
			} else if (type.type === 'reference') {
				return this.getTypeName(type) ?? type.typeName;
			} else if (type.type === 'unknown') {
				return 'unknown';
			} else if (type.type === 'union') {
				return type.options.map(x => this.useType(x)).join(' | ');
			} else {
				MustBeNever(type);
			}
		})();

		if (type.type === 'reference') {
			result += this.debugComment(
				'TODO: Handle reference type availability checking',
			);
		}

		return result;
	}

	public useType(type: TypeDefinition): string {
		let result = this.debugComment('Using Type');
		result += (() => {
			const typeName = this.getTypeName(type);
			if (typeName !== null) {
				return typeName;
			} else if (type.type === 'string') {
				return 'string';
			} else if (type.type === 'number') {
				return 'number';
			} else if (type.type === 'boolean') {
				return 'boolean';
			} else if (type.type === 'array') {
				return `${this.useType(type.elementType)}[]`;
			} else if (type.type === 'object') {
				return this.generateInlineTypeDefinition(type);
			} else if (type.type === 'reference') {
				return type.typeName;
			} else if (type.type === 'unknown') {
				return 'unknown';
			} else if (type.type === 'union') {
				return type.options.map(x => this.useType(x)).join(' | ');
			} else {
				MustBeNever(type);
			}
		})();

		if (type.optional) {
			result += ' | undefined';
		}

		return result;
	}

	public generateNamedTypeDefinition(typeName: string) {
		const type = this.namedTypes[typeName];
		if (type === undefined) {
			throw new Error('Unknown type');
		}
		return `export type ${typeName} = ${this.generateInlineTypeDefinition(
			type,
		)};`;
	}

	private debugComment(comment: string) {
		if (process.env['NODE_ENV'] === 'production') {
			return '';
		}
		return `/* ${comment} */`;
	}

	public generateMethodImplementation(endpoint: APIEndpoint) {
		let result = ``;

		const cacheStorageName = `${endpoint.name}Cache`;

		if (endpoint.cacheBehaviour) {
			result += `const ${cacheStorageName}: { [key: string]: { creationDate: number; content: ${this.useType(
				endpoint.response,
			)}; key: string; }; } = {};`;
		}

		result += `export async function ${endpoint.name}(`;

		for (const pathParam of endpoint.path
			.filter(x => x.type === 'parameter')
			.map(x => {
				if (x.type !== 'parameter') {
					throw new Error('Impossible');
				}
				return x;
			})) {
			result += `${pathParam.paramName}: ${this.useType(
				pathParam.valueType,
			)},`;
		}

		for (const queryParameter of endpoint.queryParameters ?? []) {
			result += `${queryParameter.name}: ${this.useType(
				queryParameter.type,
			)},`;
		}

		if (endpoint.body) {
			result += `body: ${this.useType(endpoint.body)},`;
		}

		result += `): Promise<${this.useType(endpoint.response)}> {`;

		if (endpoint.cacheBehaviour?.cache) {
			result += `const cacheKey = JSON.stringify({`;
			result += `path: [`;
			for (const pathComponent of endpoint.path) {
				if (pathComponent.type === 'literal') {
					result += `'${pathComponent.value}',`;
				}
				if (pathComponent.type === 'parameter') {
					result += `${pathComponent.paramName},`;
				}
			}
			result += `],`;
			result += `query: {`;
			for (const queryParameter of endpoint.queryParameters ?? []) {
				result += `${queryParameter.name},`;
			}
			result += `},`;
			result += `body,`;
			result += `});`;
		}

		result += `const uncachedResultFetcher = async () => {`;

		result += `const response = await fetch(\`${this.generateURL(
			endpoint,
		)}\`, {`;

		result += `method: '${endpoint.method}',`;

		if (endpoint.body) {
			result += `body: JSON.stringify(body),`;
		}

		result += `});`;

		result += `const baseResult = await response.json();`;

		result += `if (response.status !== 200) {`;

		result += `throw new Error(baseResult.message);`;

		result += `}`;

		result += `const result = baseResult as ${this.useType(
			endpoint.response,
		)};`;

		if (endpoint.cacheBehaviour?.cache) {
			result += `${cacheStorageName}[cacheKey] = {`;
			result += `creationDate: Date.now(),`;
			result += `content: result,`;
			result += `key: cacheKey,`;
			result += `};`;
		}

		result += `return result;`;

		result += `};`;

		if (endpoint.cacheBehaviour?.cache) {
			result += `const cacheEntry = ${cacheStorageName}[cacheKey];`;

			result += `if (cacheEntry !== undefined) {`;

			// if the result is old enough to be refreshed
			result += `if (Date.now() - cacheEntry.creationDate > ${endpoint.cacheBehaviour.refreshAge}) {`;

			// If the result is too old to be used
			result += `if (Date.now() - cacheEntry.creationDate > ${endpoint.cacheBehaviour.maximumAge}) {`;

			result += `delete ${cacheStorageName}[cacheKey];`;

			result += `return uncachedResultFetcher();`;

			result += `}`;

			result += `else {`;

			result += `uncachedResultFetcher();`;

			result += `return cacheEntry.content;`;

			result += `}`;

			result += `return cacheEntry.content;`;

			result += `}`;
		}

		result += `}`;

		result += `const result = await uncachedResultFetcher();`;

		result += `return result;`;

		result += `}`;

		return result;
	}

	private generateURL(endpoint: APIEndpoint) {
		let result = '';
		for (const pathComponent of endpoint.path) {
			if (pathComponent.type === 'literal') {
				result += '/' + pathComponent.value;
			}
			if (pathComponent.type === 'parameter') {
				result += `/\${${pathComponent.paramName}}`;
			}
		}
		return result;
	}
}

function MustBeNever(value: never): never {
	throw new Error(
		`A value was expected to be of type 'never', but was ${value}`,
	);
}

class APIBuilder {
	private apiEndpoints: APIEndpoint[] = [];

	public addEndpoint(endpoint: APIEndpoint) {
		this.apiEndpoints.push(endpoint);
	}

	public getEndpoints() {
		return this.apiEndpoints;
	}
}

const apiBuilder = new APIBuilder();

export function registerAPIEndpoint(endpoint: APIEndpoint) {
	apiBuilder.addEndpoint(endpoint);
}

expressApp.get('/api/documentation', async (req, res) => {
	res.standardFormat.success.json({
		endpoints: apiBuilder.getEndpoints(),
	});
});
