import { useEffect } from 'react';
import encryption from '../services/encryption';
import Api from '../services/api';

function Sync(props) {

	useEffect(() => {
		// Missing secrets logic
		missing();
		outdated();
	}, [props.outOfSync.missing.length, props.outOfSync.outdated.length]);

	async function missing() {
		for (let missing of props.outOfSync.missing) {
			let secret = props.secrets.filter(s => s.id === missing.secret);
			let user = props.users.filter(u => u.id === missing.user);
			/* Check if current user/key has vault for the missing password 
               Also check if we know the other user's public key. */
			if (secret?.length && user?.length) {
				let key = user[0].keys.filter(k => k.id === missing.key);
				if (secret[0]?.vault.ciphertext && key?.length) {
					// Decrypt password using current user's private Key
					let currentUserKey = props.recovery ? props.recovery : props.keys.privateKey;
					encryption.decrypt(secret[0].vault.ciphertext, currentUserKey).then(plaintext => {
						// Encrypt password with other user's public key.
						encryption.encrypt(plaintext, key[0].value).then(ciphertext => {
							// Create a vault for the other user's public key                    
							Api.vault.add(secret[0].folder, secret[0].id, missing.user, missing.key, ciphertext, secret[0].version).catch(error => {
								console.error(error);
							});
                    
						});
					}).catch(error => {
						console.error(error);
					});
				}
			}
		}
	}

	async function outdated() {
		for (let outdated of props.outOfSync.outdated) {
			let secret = props.secrets.filter(s => s.id === outdated.secret);
			let user = props.users.filter(u => u.id === outdated.user);
			/* Check if current user/key has vault for the outdated password
             And Check if user's version is higher than the outdated ine
             Also check if we know the other user's public key. */
			if (secret?.length && secret[0].vault.version > outdated.version && user?.length) {
				let key = user[0].keys.filter(k => k.id === outdated.key);
				if (secret[0]?.vault.ciphertext && key?.length) {
					// Decrypt password using current user's private Key
					let currentUserKey = props.recovery ? props.recovery : props.keys.privateKey;
					encryption.decrypt(secret[0].vault.ciphertext, currentUserKey).then(plaintext => {
						// Encrypt password with other user's public key.
						encryption.encrypt(plaintext, key[0].value).then(ciphertext => {
							// Create a vault for the other user's public key
							Api.vault.update(secret[0].folder, secret[0].id, outdated.user, outdated.key, ciphertext, secret[0].version).catch(error => {
								console.error(error);
							});
                  
						});
					}).catch(error => {
						console.error(error);
					});
				}
			}
		}
	}
}

export default Sync;
