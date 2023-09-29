import { expressApp } from '../core/express.js';

type PathComponent =
	| {
			type: 'literal';
			value: string;
	  }
	| {
			type: 'parameter';
			paramName: string;
			valueType: TypeDefinition;
	  };

type TypeDefinition = {
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
);

type QueryParameter = {
	name: string;
	type: TypeDefinition;
};

export type APIEndpoint = {
	name: string;
	method: string;
	path: PathComponent[];
	queryParameters?: QueryParameter[];
	body?: TypeDefinition;
	response: TypeDefinition;
};

const apiEndpoints: APIEndpoint[] = [];

expressApp.get('/api-documentation', async (req, res) => {
	res.standardFormat.success.json(apiEndpoints);
});

expressApp.get('/generate-client', async (req, res) => {
	let result = '';
	result += generateAPIVerificationMethod() + '\n';
	for (const endpoint of apiEndpoints) {
		result += generateClientInvoker(endpoint) + '\n';
	}
	res.standardFormat.success.text(result);
});

function generateAPIVerificationMethod() {
	let result = '';

	result += 'export async function verifyAPIVersion(): Promise<boolean> {';

	result += "const response = await fetch('/api-documentation');";
	result += 'const data = JSON.stringify((await response.json()).content);';

	result += 'const BUILD_TIME_API_DOCUMENTATION = `';
	result += JSON.stringify(apiEndpoints);
	result += '`;';
	result += 'const RUNTIME_API_DOCUMENTATION = data;';

	result +=
		'return BUILD_TIME_API_DOCUMENTATION === RUNTIME_API_DOCUMENTATION;';

	result += '}';

	return result;
}

function generateTypeDefinition(type: TypeDefinition) {
	let result = '';
	if (type.type === 'object') {
		result += '{';
		for (const [key, value] of Object.entries(type.properties)) {
			result += `${key}: ${generateTypeDefinition(value)},`;
		}
		result += '}';
	}
	if (type.type === 'array') {
		result += `${generateTypeDefinition(type.elementType)}[]`;
	}
	if (type.type === 'string') {
		result += 'string';
	}
	if (type.type === 'number') {
		result += 'number';
	}
	if (type.type === 'boolean') {
		result += 'boolean';
	}
	if (type.optional) {
		result += ' | null';
	}
	return result;
}

function generateClientInvoker(endpoint: APIEndpoint) {
	const variables: {
		[key: string]: TypeDefinition;
	} = {};

	for (const queryParameter of endpoint.queryParameters ?? []) {
		variables[queryParameter.name] = queryParameter.type;
	}

	let result = `export async function ${endpoint.name}(`;

	for (const pathParam of endpoint.path.filter(x => x.type === 'parameter')) {
		if (pathParam.type !== 'parameter') {
			throw new Error('Impossible');
		}

		result += `${pathParam.paramName}: ${generateTypeDefinition(
			pathParam.valueType,
		)},`;
	}

	for (const [key, value] of Object.entries(variables)) {
		result += `${key}: ${generateTypeDefinition(value)},`;
	}

	if (endpoint.body) {
		result += `body: ${generateTypeDefinition(endpoint.body)},`;
	}

	result += ')';

	result += `: Promise<${generateTypeDefinition(endpoint.response)}>`;

	result += '{\n';

	result += 'const queryParameters = new URLSearchParams();\n';
	for (const [key] of Object.entries(variables)) {
		const variable = variables[key];
		if (variable.type === 'number') {
			result += `queryParameters.append('${key}', ${key}.toString());\n`;
		} else if (variable.type === 'string') {
			result += `queryParameters.append('${key}', ${key});\n`;
		} else if (variable.type === 'array') {
			result += `queryParameters.append('${key}', JSON.stringify(${key}));\n`;
		} else if (variable.type === 'object') {
			result += `queryParameters.append('${key}', JSON.stringify(${key}));\n`;
		} else {
			result += `queryParameters.append('${key}', ${key}.toString());/*FIXME: Failed to resolve variable type handler: possible incorrect behaviour*/\n`;
		}
	}
	result += `const url = \`/api/${endpoint.path
		.map(pathComponent =>
			pathComponent.type === 'literal'
				? pathComponent.value
				: `\${${pathComponent.paramName}}`,
		)
		.join(
			'/',
		)}\${queryParameters.toString() ? '?' : ''}\${queryParameters.toString()}\`;\n`;

	// result += 'console.log(url);\nreturn';

	result += `const response = await fetch(url, {\n`;
	result += `method: '${endpoint.method}',\n`;

	if (endpoint.body) {
		result += `body: JSON.stringify(body),\n`;
	}

	result += '});\n';
	result += 'const json = await response.json();\n';
	result += 'return json;\n';
	result += '}\n';

	return result;
}

/**
 * Registers an API endpoint to be documented and made available to the client.
 * @param endpoint The endpoint to register.
 */
export function registerAPIEndpoint(endpoint: APIEndpoint) {
	apiEndpoints.push(endpoint);
}
