import { createHash } from 'crypto';

type HashType = 'sha256' | 'sha512' | 'md5';
type Encoding = 'base64' | 'base64url' | 'hex' | 'binary';

/**
 * Hashes data
 * @param type The type of hash to use
 * @param data The data to hash
 * @param encoding The encoding to use for the output
 * @returns The hashed data
 */
export async function hash(
	type: HashType,
	data: string | Buffer,
	encoding: Encoding,
) {
	const hash = createHash(type);
	hash.update(data);
	return hash.digest(encoding);
}
