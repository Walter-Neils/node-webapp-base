import { createHash } from 'crypto';

type HashType = 'sha256' | 'sha512' | 'md5';
type Encoding = 'base64' | 'base64url' | 'hex' | 'binary';

export async function hash(
	type: HashType,
	data: string | Buffer,
	encoding: Encoding,
) {
	const hash = createHash(type);
	hash.update(data);
	return hash.digest(encoding);
}
