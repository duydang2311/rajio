import { generateKeyPair } from 'node:crypto';

generateKeyPair(
	'ed25519',
	{
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem'
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem'
		}
	},
	(err, publicKey, privateKey) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log('public key');
		console.log(publicKey.replace(/\n/g, '\\n'));
		console.log('private key');
		console.log(privateKey.replace(/\n/g, '\\n'));
	}
);
