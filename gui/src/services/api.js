import axios from 'axios';

function url() {
	return localStorage.getItem('serverAddress') ?
		localStorage.getItem('serverAddress') : process.env.REACT_APP_SERVER_URL;
}

function setup(serverAddress) {
	return new Promise((resolve, reject) => {
		axios
			.get(`${serverAddress}/setup`)
			.then((response) => {
				localStorage.setItem('serverAddress', serverAddress);
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function authenticate(email, password) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/auth`, { email, password }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function change_password(password, newPassword, confirmNewPassword) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/profile/change-password`, { password, newPassword, confirmNewPassword }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}


function isAuthenticated() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/auth`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function resetPassword(email) {
	return new Promise((resolve, reject) => {
		axios
			.put(`${url()}/auth/reset-password`, { email })
			.then(() => {
				resolve();
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function signup(organizationName, fullname, email, password, key) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/auth/signup`, { organizationName, fullname, email, password, key }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function add_sso_token(organization) {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/auth/sso/request/${organization}`)
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function get_sso_token(organization, token) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/auth/sso/request/${organization}`, { token }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function set_sso(enabled, issuer, entryPoint, certificate) {
	return new Promise((resolve, reject) => {
		axios
			.put(`${url()}/organization/sso`, { enabled, issuer, entryPoint, certificate }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function set_smtp(server, port, secure, username, password) {
	return new Promise((resolve, reject) => {
		axios
			.put(`${url()}/organization/smtp`, { server, port, secure, username, password }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function organization() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/organization`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function folders_me() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder/secrets/user`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function folders() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function all_folders() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder/all`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function add_folder(name, groups) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/folder`, {name, groups}, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function update_folder(folderId, name, groups) {
	return new Promise((resolve, reject) => {
		axios
			.patch(`${url()}/folder/${folderId}`, {name, groups}, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function add_group(name, admin) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/organization/group`, {name, admin}, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function update_group(groupId, name, admin) {
	return new Promise((resolve, reject) => {
		axios
			.patch(`${url()}/organization/group/${groupId}`, {name, admin}, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function delete_group(groupId) {
	return new Promise((resolve, reject) => {
		axios
			.delete(`${url()}/organization/group/${groupId}`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function users() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/user`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function sync(recovery) {
	return new Promise((resolve, reject) => {
		let endpoint = !recovery ? `${url()}/folder/secrets/sync` :
			`${url()}/folder/secrets/sync/recovery`;

		axios
			.get(endpoint, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function inaccessible_vaults() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder/secrets/vault/inaccessible`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function my_secrets(key) {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder/secrets/key/${key}`, { withCredentials: true })
			.then((response) => {
				resolve(response.data.sort((a,b) => a.name.localeCompare(b.name)));
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function recovery() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder/secrets/recovery`, { withCredentials: true })
			.then((response) => {
				resolve(response.data.sort((a,b) => a.name.localeCompare(b.name)));
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function secrets(userId) {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder/secrets/user/${userId}`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function weak_secrets() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder/secrets/weak/`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function old_secrets() {
	return new Promise((resolve, reject) => {
		axios
			.get(`${url()}/folder/secrets/old/`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function add_secret(name, address, username, folder, key, ciphertext, recovery, totp, totpRecovery, strength) {
	return new Promise((resolve, reject) => {
		axios
			.post(
				`${url()}/folder/${folder}/secrets`,
				{
					name,
					url: address,
					username,
					key,
					ciphertext,
					recovery,
					strength,
					totp,
					totpRecovery
				},
				{ withCredentials: true }
			)
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function update_secret(name, address, username, folder, secret, key, ciphertext, recovery, version, strength, totp, totpRecovery, updatedVault) {
	return new Promise((resolve, reject) => {
		axios
			.patch(
				`${url()}/folder/${folder}/secrets/${secret}`,
				{
					name,
					url: address,
					username,
					key,
					ciphertext,
					recovery,
					version,
					strength,
					totp,
					totpRecovery,
					updatedVault
				},
				{ withCredentials: true }
			)
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function delete_secret(folder, secret) {
	return new Promise((resolve, reject) => {
		axios
			.delete(`${url()}/folder/${folder}/secrets/${secret}`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function add_vault(folder, secret, user, key, ciphertext, totp, version) {
	return new Promise((resolve, reject) => {
		axios
			.post(
				`${url()}/folder/${folder}/secrets/${secret}/vault`,
				{
					user,
					key,
					ciphertext,
					totp,
					version
				},
				{ withCredentials: true }
			)
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function update_vault(folder, secret, user, key, ciphertext, totp, version) {
	return new Promise((resolve, reject) => {
		axios
			.patch(
				`${url()}/folder/${folder}/secrets/${secret}/vault`,
				{
					user,
					key,
					ciphertext,
					totp,
					version
				},
				{ withCredentials: true }
			)
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function add_key(value) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/profile/key`, { value }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function logout() {
	return new Promise((resolve, reject) => {
		axios
			.delete(`${url()}/auth`, { withCredentials: true })
			.then(() => {
				resolve();
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function update_user(userId, name, email, groups, active) {
	return new Promise((resolve, reject) => {
		axios
			.patch(`${url()}/user/${userId}`, {name, email, groups, active}, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function add_user(name, email, groups) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/user`, { name, email, groups }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function move_secret(secret, source, destination) {
	return new Promise((resolve, reject) => {
		axios
			.patch(`${url()}/folder/secrets/move`, { secret, source, destination }, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function resend_activation_email(userId) {
	return new Promise((resolve, reject) => {
		axios
			.post(`${url()}/user/${userId}/resend-activation-email`, {}, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function delete_user(userId) {
	return new Promise((resolve, reject) => {
		axios
			.delete(`${url()}/user/${userId}`, { withCredentials: true })
			.then((response) => {
				resolve(response.data);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

const Api = {
	setup,
	auth: {
		authenticate,
		isAuthenticated,
		logout,
		signup,
		resetPassword
	},
	folder: {
		me: folders_me,
		all: folders,
		add: add_folder,
		update: update_folder,
		recovery: all_folders
	},
	secret: {
		me: my_secrets,
		recovery,
		all: secrets,
		add: add_secret,
		update: update_secret,
		delete: delete_secret,
		sync: sync,
		weak: weak_secrets,
		old: old_secrets,
		move: move_secret
	},
	vault: {
		add: add_vault,
		update: update_vault,
		inaccessible: inaccessible_vaults
	},
	user: {
		add: add_user,
		all: users,
		update: update_user,
		resend_activation_email,
		delete: delete_user,
		change_password
	},
	key: {
		add: add_key
	},
	organization: {
		get: organization,
		group: {
			add: add_group,
			update: update_group,
			delete: delete_group
		},
		sso: {
			token: {
				add: add_sso_token,
				get: get_sso_token
			},
			set_sso,
		},
		smtp: {
			set: set_smtp
		},
	}
};

export default Api;
