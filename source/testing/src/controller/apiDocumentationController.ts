import { expressApp } from '../core/express.js';
import delay from '../misc/delay.js';

type PathComponent =
	| {
			type: 'literal';
	  }
	| {
			type: 'parameter';
			valueType: TypeDefinition;
	  };

export type TypeDefinition = {
	documentation?: Documentation & { type: 'descriptiononly' };
} & {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
type KnownValidInstance<T> = any & T;

function normalizeTypeDefinition(
	type: TypeDefinition,
): KnownValidInstance<TypeDefinition> {
	if (type.type === 'object') {
		// Sort by alphabetical order
		const sortedProperties: { [key: string]: TypeDefinition } = {};
		for (const key of Object.keys(type.properties).sort()) {
			sortedProperties[key] = normalizeTypeDefinition(
				type.properties[key],
			) as KnownValidInstance<TypeDefinition>;
		}
		type.properties = sortedProperties;
		return type;
	} else if (type.type === 'union') {
		// Sort by alphabetical order
		const sortedOptions: TypeDefinition[] = [];
		for (const option of type.options.sort()) {
			sortedOptions.push(
				normalizeTypeDefinition(option) as TypeDefinition,
			);
		}
		type.options = sortedOptions;
		return type;
	}

	return type;
}

export type TypeDefinitionToTypeScript<T extends TypeDefinition | undefined> =
	T extends {
		type: 'string';
	}
		? string
		: T extends { type: 'number' }
		? number
		: T extends { type: 'boolean' }
		? boolean
		: T extends {
				type: 'array';
				elementType: infer U extends TypeDefinition;
		  }
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
	type: TypeDefinition;
	documentation?: Documentation & { type: 'descriptiononly' };
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

type Documentation =
	| {
			type: 'method';
			description?: string;
			parameters?: {
				[key: string]: string;
			};
			returns?: string;
	  }
	| {
			type: 'descriptiononly';
			description: string;
	  };

export type APIEndpoint = {
	name: string;
	method: string;
	documentation?: Documentation & { type: 'method' };
	path: {
		[key: string]: PathComponent;
	};
	queryParameters?: {
		[key: string]: QueryParameter;
	};
	body?: TypeDefinition;
	response: TypeDefinition;
	cacheBehaviour?: CacheBehaviour;
};

type GetSubType<T, K extends keyof T> = T[K];
type NotUndefined<T> = T extends undefined ? never : T;
type APIEndpointInvokeObject<T extends APIEndpoint> = T extends NotUndefined<
	GetSubType<T, 'body'>
> & { body: TypeDefinition }
	? {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			body: TypeDefinitionToTypeScript<T['body']>;
	  }
	: {};

const apiTest = {
	name: 'test',
	path: {
		test: {
			type: 'literal',
		},
		test2: {
			type: 'parameter',
			valueType: {
				type: 'string',
			},
		},
	},
	body: {
		type: 'string',
	},
	method: 'GET',
	response: {
		type: 'string',
	},
};

type TestType = APIEndpointInvokeObject<typeof apiTest>;

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

	public normalizeTypes() {
		for (const endpoint of this.apiEndpoints) {
			endpoint.response = normalizeTypeDefinition(endpoint.response);
			if (endpoint.body) {
				endpoint.body = normalizeTypeDefinition(endpoint.body);
			}
			for (const queryParameter of endpoint.queryParameters ?? []) {
				queryParameter.type = normalizeTypeDefinition(
					queryParameter.type,
				);
			}
			for (const pathComponent of endpoint.path) {
				if (pathComponent.type === 'parameter') {
					pathComponent.valueType = normalizeTypeDefinition(
						pathComponent.valueType,
					);
				}
			}
			endpoint.response = normalizeTypeDefinition(endpoint.response);
		}
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
		if (
			process.env['NODE_ENV'] === undefined ||
			process.env['NODE_ENV'] === 'production'
		) {
			return '';
		}
		return `/* ${comment} */`;
	}

	private generateDocumentationComment(endpoint: APIEndpoint) {
		let result = '/**\n';

		const addKey = (key: string, value: string) => {
			result += ` * @${key} ${value}\n`;
		};

		result += ` * ${
			endpoint.documentation?.description ?? 'No description provided'
		}\n`;

		addKey(
			'description',
			endpoint.documentation?.description ?? 'No description provided',
		);

		if (endpoint.documentation?.parameters !== undefined) {
			for (const [key, value] of Object.entries(
				endpoint.documentation.parameters,
			)) {
				// Check if there's a query parameter with the same name
				if (endpoint.queryParameters?.some(x => x.name === key)) {
					continue;
				}
				// Check if there's a path parameter with the same name
				if (
					endpoint.path.some(
						x => x.type === 'parameter' && x.paramName === key,
					)
				) {
					continue;
				}

				addKey('param', `${key} ${value}`);
			}
		}

		for (const queryParameter of endpoint.queryParameters ?? []) {
			addKey(
				'param',
				`${queryParameter.name} ${
					queryParameter.documentation?.description ??
					'No description provided'
				}`,
			);
		}

		for (const pathComponent of endpoint.path) {
			if (pathComponent.type === 'parameter') {
				addKey(
					'param',
					`${pathComponent.paramName} ${
						pathComponent.documentation?.description ??
						'No description provided'
					}`,
				);
			}
		}

		if (endpoint.body) {
			addKey(
				'param',
				`body ${
					endpoint.body.documentation?.description ??
					'No description provided'
				}`,
			);
		}

		addKey(
			'returns',
			endpoint.documentation?.returns ?? 'No return value provided',
		);

		result += `*/\n`;

		return result;
	}
	private responseHandlerName = '__handleResult';

	public generateResponseHandler() {
		let result = `function ${this.responseHandlerName}(response: any) {`;

		// {success: true, content: any} | {success: false, message: string}

		result += `if (response.success) {`;
		result += `return response.content;`;
		result += `}`;
		result += `else {`;
		result += `throw new Error(response.message);`;
		result += `}`;

		result += `}`;

		return result;
	}

	public generateMethodImplementation(endpoint: APIEndpoint) {
		let result = ``;

		const cacheStorageName = `${endpoint.name}Cache`;

		if (endpoint.cacheBehaviour) {
			result += `const ${cacheStorageName}: { [key: string]: { creationDate: number; content: ${this.useType(
				endpoint.response,
			)}; key: string; }; } = {};`;
		}

		result += this.generateDocumentationComment(endpoint);

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
			if (endpoint.body) {
				result += `body,`;
			}
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

			result += `return __handleResult(await uncachedResultFetcher());`;

			result += `}`;

			result += `else {`;

			result += `uncachedResultFetcher();`;

			result += `return ${this.responseHandlerName}(cacheEntry.content);`;

			result += `}`;

			result += `}`;

			result += `}`;
		}

		result += `const result = await uncachedResultFetcher();`;

		result += `return ${this.responseHandlerName}(result);`;

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

export function getAPIBuilder() {
	return apiBuilder;
}

expressApp.get('/api/documentation', async (req, res) => {
	res.standardFormat.success.json({
		endpoints: apiBuilder.getEndpoints(),
	});
});

expressApp.get('/api/implementation/typescript', async (req, res) => {
	const builder = new APIImplementationBuilder(apiBuilder);
	builder.normalizeTypes();
	let result = '';
	for (const typeName of builder.namedTypeNames) {
		result += builder.generateNamedTypeDefinition(typeName);
	}
	result += builder.generateResponseHandler();
	for (const endpoint of apiBuilder.getEndpoints()) {
		result += builder.generateMethodImplementation(endpoint);
	}
	res.standardFormat.success.text(result);
});

expressApp.get('/api/microservice/:serviceName', async (req, res) => {
	const serviceName = req.params.serviceName;
	const microserviceInitializationResponse = {
		targetURI: `http://localhost:5000`,
		endpoints: apiBuilder.getEndpoints(),
	};
	res.standardFormat.success.json(microserviceInitializationResponse);
});

async function connectToMicroservice<T>(serviceName: string) {
	const microserviceInitializationResponse: {
		targetURI: string;
		endpoints: APIEndpoint[];
	} = (
		await (
			await fetch(`http://localhost:5000/api/microservice/${serviceName}`)
		).json()
	).content;

	const buildRequestMethod = (name: string) => {
		if (
			!microserviceInitializationResponse.endpoints.some(
				x => x.name === name,
			)
		) {
			throw new Error(`Endpoint ${name} not found`);
		}

		const endpoint = microserviceInitializationResponse.endpoints.find(
			x => x.name === name,
		)!;

		// in the form of (args: {...}) => Promise<...>
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return async (args: any) => {
			let url = `${microserviceInitializationResponse.targetURI}`;
			for (const pathComponent of endpoint.path) {
				if (pathComponent.type === 'literal') {
					url += '/' + pathComponent.value;
				}
				if (pathComponent.type === 'parameter') {
					url += `/${args[pathComponent.paramName]}`;
				}
			}
			if (endpoint.queryParameters !== undefined) {
				url += '?';
				for (const queryParameter of endpoint.queryParameters) {
					url += `${queryParameter.name}=${
						args[queryParameter.name]
					}&`;
				}
			}
			const response = await (
				await fetch(url, {
					method: endpoint.method,
					body: endpoint.body ? JSON.stringify(args.body) : undefined,
				})
			).json();

			if (!response.success) {
				throw new Error(response.message);
			}

			return response.content;
		};
	};

	const proxy = new Proxy(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		{} as any,
		{
			get: (target, prop) => {
				if (typeof prop === 'string') {
					if (prop === 'then') {
						return undefined;
					}
					if (target[prop] === undefined) {
						target[prop] = buildRequestMethod(prop);
					}
					return target[prop];
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return (target as any)[prop];
			},
			set: () => false,
		},
	);

	return proxy as T;
}

delay(2500).then(async () => {
	const authController = await connectToMicroservice<{
		getAuthStatus: () => Promise<boolean>;
	}>('test');

	console.log(await authController.getAuthStatus());
});
