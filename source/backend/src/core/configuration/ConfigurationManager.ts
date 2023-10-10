import { WithId } from 'mongodb';
import { getMongoClient } from '../../data/MongoConnectionManager.js';

const client = getMongoClient();

const configurationDB = client.db('infrastructure');

const configurationCollection = configurationDB.collection<
	WithId<{
		key: string;
		machineIdentifier: string;
		value: unknown;
	}>
>('backend-configuration');

export interface Configuration {}
// To extend the Configuration interface, create a file called Configuration.d.ts
// and add the following:
// declare module './ConfigurationManager.js' {
// 	interface Configuration {
// 		// Add your configuration here
// 	}
// }

// Hack to allow other files to extend the Configuration interface
type __RC_GEN<T> = {
	[P in keyof T]: T[P] | undefined;
};

type ActualConfiguration = __RC_GEN<Configuration>;

function getMachineIdentifier() {
	return 'machineIdentifier';
}

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
