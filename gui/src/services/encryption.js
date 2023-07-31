/* eslint-disable security/detect-object-injection */
import CryptoJS from 'crypto-js';
import api from './api';

const defaultError = 'Error Encryption Library';
let fileName = 'vault.json';

/**
 * Convert key spring to toUnit8Array
 * @param {String} key 
 * @param {String} type private or public
 * @returns {Uint8Array}
 */
async function toUnit8Array(key, type) {
	try {
		console.log(`Converting base64 ${type} key to Unit8Array.`);
		const fetchArrayBuffer = async (base64String) => {
			const binaryString = window.atob(base64String);
			const len = binaryString.length;
			const bytes = new Uint8Array(len);
			for (let i = 0; i < len; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			return bytes.buffer;
		};

		let keyBuffer = await fetchArrayBuffer(key);
		return await window.crypto.subtle.importKey(
			type === 'public' ? 'spki' : 'pkcs8',
			keyBuffer,
			{ name: 'RSA-OAEP', hash: 'SHA-256' },
			true,
			[type === 'public' ? 'encrypt' : 'decrypt']
		);

	} catch (error) {
		console.error(`Failed to convert base64 ${type} key to Unit8Array.`);
		console.error(error);
		throw defaultError;
	}
}
/**
 * Encrypts a string with a given key
 * @param {*} plainText String to be encrypted
 * @param {*} userId Public key owner
 * @param {*} key Public Key to be used on encryption
 * @returns {String}
 */
async function encrypt(plainText, key) {
	try {
		console.log('Encrypting string with the provided key.');
		const encoder = new TextEncoder();
		const data = encoder.encode(plainText);

		const encryptedData = await window.crypto.subtle.encrypt(
			{
				name: 'RSA-OAEP',
			},
			await toUnit8Array(key, 'public'),
			data
		);

		return window.btoa(
			String.fromCharCode.apply(null, new Uint8Array(encryptedData))
		);
	} catch (error) {
		console.error('Failed to encrypt string with the provided key.');
		console.error(error);
		throw defaultError;
	}
}
/**
 * Decrypts a value using the current user's private key
 * @param {*} ciphertext Value to be decrypted
 * @param {*} userId Current logged in user
 * @returns {String}
 */
async function decrypt(ciphertext, key) {
	try {
		console.log('Decrypting string with the provided key.');
		// Convert base64 string back to ArrayBuffer
		const binaryString = window.atob(ciphertext);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		const encryptedData = bytes.buffer;

		// Decrypt the data
		const decryptedData = await window.crypto.subtle.decrypt(
			{
				name: 'RSA-OAEP',
			},
			await toUnit8Array(key, 'private'),
			encryptedData
		);
		const decoder = new TextDecoder();
		return decoder.decode(decryptedData);
	} catch (error) {
		console.error('Failed to decrypt string with the provided key.');
		console.error(error);
		throw defaultError;
	}
}
/**
 * Generates and saves a key pair for the logged in user
 * @param {*} userId 
 * @returns {Promise}
 */
function generateKeys(userId, password) {
	return new Promise((resolve, reject) => {
		window.crypto.subtle.generateKey(
			{
				name: 'RSA-OAEP',
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: 'SHA-256',
			},
			true,
			['encrypt', 'decrypt']
		).then(keys => Promise.all([
			window.crypto.subtle.exportKey('spki', keys.publicKey),
			window.crypto.subtle.exportKey('pkcs8', keys.privateKey)
		]).then(([exportedPublicKey, exportedPrivateKey]) => {
			const publicKeyBase64 = window.btoa(String.fromCharCode.apply(null, new Uint8Array(exportedPublicKey)));
			const privateKeyBase64 = window.btoa(String.fromCharCode.apply(null, new Uint8Array(exportedPrivateKey)));

			if (!userId) {
				// Keys generated for a new organization
				resolve({ public: publicKeyBase64, private: privateKeyBase64 });
			} else {
				// Store keys created for user
				api.key.add(publicKeyBase64).then(async result => {
					let storedKeys = await window.electron.ipcRenderer.invoke('read-file', fileName);
					storedKeys = storedKeys?.length ? JSON.parse(storedKeys) : {};
					storedKeys[userId] = {};
					storedKeys[userId].publicKey = publicKeyBase64;
					storedKeys[userId].privateKey = encryptStringWithPassword(privateKeyBase64, password);
					storedKeys[userId].publicKeyId = result.id;
					storedKeys[userId].localPassword = hashString(password, userId);

					// eslint-disable-next-line sonarjs/no-duplicate-string
					window.electron.ipcRenderer.send('write-file', { fileName: fileName, content: JSON.stringify(storedKeys) });
					resolve();
				}).catch(error => {
					reject(error);
				});
			}
		}).catch(error => {
			console.error(error);
		})).catch(error => {
			console.error(error);
		});
	});
}

function deleteKey(userId) {
	return new Promise((resolve, reject) => {
		try {
			(async () => {
				let storedKeys = await window.electron.ipcRenderer.invoke('read-file', fileName);
				storedKeys = storedKeys?.length ? JSON.parse(storedKeys) : {};
				if (storedKeys[userId]) {
					delete storedKeys[userId];
				}
				window.electron.ipcRenderer.send('write-file', { fileName: fileName, content: JSON.stringify(storedKeys) });
				resolve();
			})();
		} catch (error) {
			reject(error);
		}
	});
}

function updateLocalPassword(userId, password, newPassword) {
	return new Promise((resolve, reject) => {
		try {
			(async () => {
				let storedKeys = await window.electron.ipcRenderer.invoke('read-file', fileName);
				storedKeys = storedKeys?.length ? JSON.parse(storedKeys) : {};

				if (storedKeys[userId]) {
					let privateKeyBase64 = decryptStringWithPassword(storedKeys[userId].privateKey, password);
					storedKeys[userId].privateKey = encryptStringWithPassword(privateKeyBase64, newPassword);
					storedKeys[userId].localPassword = hashString(newPassword, userId);
				}

				window.electron.ipcRenderer.send('write-file', { fileName: fileName, content: JSON.stringify(storedKeys) });
				resolve();
			})();
		} catch (error) {
			reject(error);
		}
	});
}

/**
 * Returns the key pair for the logged in user in String format
 * @param {*} userId Logged in user
 * @returns {{privateKey: String, publicKey: String, publicKeyId: String, localPassword: String }} Base64 Key Pair
 */
async function getKeys(userId, password) {
	try {
		let keys = await window.electron.ipcRenderer.invoke('read-file', fileName);
		keys = keys ? JSON.parse(keys) : {};
		if (keys && password) {
			keys[userId].privateKey = decryptStringWithPassword(keys[userId].privateKey, password);
		}
		return keys[userId];
	} catch (error) {
		console.error('Error getting local keys from disk');
		console.error(error);
		throw defaultError;
	}	
}

const encryption = {
	encrypt,
	decrypt,
	generateKeys,
	getKeys,
	hashString,
	deleteKey,
	updateLocalPassword
};

function encryptStringWithPassword(string, password) {
	try {
		return CryptoJS.AES.encrypt(string, password).toString();
	} catch (error) {
		console.error('Error while encryptinh string with the password provided');
		console.error(error);
		throw defaultError;
	}
}

function decryptStringWithPassword(encryptedString, password) {
	try {
		let bytes = CryptoJS.AES.decrypt(encryptedString, password);
		return bytes.toString(CryptoJS.enc.Utf8);
	} catch (error) {
		console.error('Error while encryptinh string with the password provided');
		console.error(error);
		throw defaultError;
	}
}

function hashString(string, salt) {
	try {
		return CryptoJS.HmacSHA256(string, salt).toString(CryptoJS.enc.Hex);
	} catch (error) {
		console.error('Error while hashing string');
		console.error(error);
		throw defaultError;
	}
}

export default encryption;
