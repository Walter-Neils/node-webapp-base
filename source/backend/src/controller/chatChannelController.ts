import { expressApp } from '../core/express.js';
import crypto from 'crypto';
import { logger } from '../core/logging.js';

type User = {
	publicKey: string;
	displayName: string;
	activeSocket?: WebSocket;
};

interface Channel {
	name: string;
	publicKey: string;
	users: User[];
}

const channels: {
	[key: string]: Channel;
} = {};

function generateGUID() {
	return crypto.randomBytes(16).toString('hex');
}

function generateKeyPair() {
	const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
		modulusLength: 4096,
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem',
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem',
		},
	});

	return { publicKey, privateKey };
}

function verifyKeyMatch(publicKey: string, privateKey: string) {
	const data = 'Hello, world!';

	const sign = crypto.createSign('SHA256');
	sign.update(data);
	sign.end();

	const signature = sign.sign(privateKey);

	const verify = crypto.createVerify('SHA256');
	verify.update(data);
	verify.end();

	return verify.verify(publicKey, signature);
}

expressApp.ws('/api/chat/channel/:channelID', async (ws, req) => {
	logger.info('New connection');
	try {
		const channelID = req.params.channelID;

		const channel = channels[channelID];

		if (!channel) {
			ws.close();
			logger.error(`Channel ${channelID} not found`);
			return;
		}

		const channelPublicKey = channel.publicKey;

		const user = await new Promise<User>((resolve, reject) => {
			ws.onmessage = async event => {
				const data = JSON.parse(event.data.toString());
				console.log(event.data);
				if (data.type !== 'init') {
					reject(new Error('Invalid init message'));
					ws.close();
					return;
				}

				const channelPrivateKey = data.channelPrivateKey;

				if (!verifyKeyMatch(channelPublicKey, channelPrivateKey)) {
					ws.close();
					reject(new Error('Invalid private key'));
					return;
				}

				const userPrivateKey = data.userPrivateKey;
				const userHandle = data.userHandle;

				const targetUser = channel.users.find(
					user => user.displayName === userHandle,
				);

				if (!targetUser) {
					ws.close();
					reject(new Error('User not found'));
					return;
				}

				if (!verifyKeyMatch(targetUser.publicKey, userPrivateKey)) {
					ws.close();
					reject(new Error('Invalid private key'));
					return;
				}

				resolve(targetUser);
			};
		});

		user.activeSocket = ws;

		ws.onmessage = async event => {
			channel.users
				.find(x => x.activeSocket !== ws)
				?.activeSocket?.send(event.data);
		};

		ws.onclose = () => {
			user.activeSocket = undefined;
		};
	} catch (err) {
		logger.error(err);
	}
});

expressApp.post('/api/chat/joinChannel', async (req, res) => {
	// Client will send the channel ID as well as the private key corresponding to the public key of the channel, and a display name
	const { channelID, privateKey, displayName } = req.body;

	const channel = channels[channelID];

	if (!channel) {
		res.standardFormat.error.json(new Error('Channel not found'));
		return;
	}

	const publicKey = channel.publicKey;

	if (!verifyKeyMatch(publicKey, privateKey)) {
		res.standardFormat.error.json(new Error('Invalid private key'));
		return;
	}

	const userKeys = generateKeyPair();

	channel.users.push({
		publicKey: userKeys.publicKey,
		displayName: displayName,
	});

	res.standardFormat.success.json({
		privateKey: userKeys.privateKey,
	});
});

expressApp.post('/api/chat/createChannel', async (req, res) => {
	const channelID = generateGUID();

	const channelKeyPair = generateKeyPair();

	const channel: Channel = {
		name: channelID,
		publicKey: channelKeyPair.publicKey,
		users: [],
	};

	channels[channelID] = channel;

	res.standardFormat.success.json({
		channelID,
		privateKey: channelKeyPair.privateKey,
	});
});
