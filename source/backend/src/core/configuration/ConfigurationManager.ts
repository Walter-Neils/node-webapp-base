import { getTypedMongoCollection } from '../../data/MongoConnectionManager.js';
import os from 'os';
import { logger } from '../logging.js';

declare module '../../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'infastructure.backend-configuration': {
			key: string;
			machineIdentifier: string;
			value: unknown;
		};
	}
}

const configurationCollection = getTypedMongoCollection(
	'infastructure',
	'backend-configuration',
);

export interface Configuration {}

// Hack to allow other files to extend the Configuration interface
type __RC_GEN<T> = {
	[P in keyof T]: T[P] | undefined;
};

type ActualConfiguration = __RC_GEN<Configuration>;

/**
 * Gets the machine identifier
 * @returns The machine identifier
 */
function getMachineIdentifier() {
	return os.hostname();
}

logger.info(`Machine identifier: ${getMachineIdentifier()}`);

async function getConfigurationValue<Key extends keyof ActualConfiguration>(
	key: Key,
): Promise<ActualConfiguration[Key]> {
	const result = await configurationCollection.findOne({
		key,
		machineIdentifier: getMachineIdentifier(),
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if (result === null) return undefined as any;
	return result.value as ActualConfiguration[Key];
}

async function setConfigurationValue<Key extends keyof ActualConfiguration>(
	key: Key,
	value: ActualConfiguration[Key],
) {
	await configurationCollection.updateOne(
		{
			key,
			machineIdentifier: getMachineIdentifier(),
		},
		{
			$set: {
				key,
				machineIdentifier: getMachineIdentifier(),
				value,
			},
		},
		{
			upsert: true,
		},
	);
}
type GetOrDefault<
	Key extends keyof ActualConfiguration,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	DefaultGetter extends (...args: any) => any,
> = ReturnType<DefaultGetter> extends undefined
	? ActualConfiguration[Key]
	: ReturnType<DefaultGetter>;

type NotUndefined<T> = T extends undefined ? never : T;

async function getConfigurationValueOrSetDefault<
	Key extends keyof ActualConfiguration,
	DefaultGetter extends () => ActualConfiguration[Key] | undefined,
>(
	key: Key,
	getDefault: DefaultGetter,
): Promise<GetOrDefault<Key, DefaultGetter>> {
	const value = await getConfigurationValue(key);
	if (value === undefined) {
		const defaultValue = getDefault();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await setConfigurationValue(key, defaultValue as any);
		return defaultValue as NotUndefined<GetOrDefault<Key, DefaultGetter>>;
	}
	return value as NotUndefined<GetOrDefault<Key, DefaultGetter>>;
}

export const configurationManager = {
	getConfigurationValue,
	setConfigurationValue,
	getConfigurationValueOrSetDefault,
};
