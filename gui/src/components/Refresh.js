import { useEffect } from 'react';
import api from '../services/api';

function Refresh(props) {


	useEffect(() => {
		let interval = setInterval(() => {
			getSecrets();
			getFolders(); 
			getOrganization();
			getUsers();
			getOutOfSync();
			isAuthenticated();
		}, 15000);
        
		getSecrets();
		getFolders(); 
		getOrganization();
		getUsers();

		return(() => {
			clearInterval(interval);
		});
	}, []);
	

	const isAuthenticated = () => {
		api.auth.isAuthenticated().then(user => {
			if (!user?.id || !user?.organization) {
				console.log('User no longer authenticated, clear memory.');
				props.setUser(null);
				props.setUsers([]);
				props.setFolders([]);
				props.setSecrets([]);
				props.setOrganization({});
				props.setLocalPassword({});
				props.setAuthenticated(false);
			} else {
				props.setConnectionError(false);
			}
		}).catch(() => {
			props.setConnectionError(true);
		});
	};

	const getSecrets = () => {
		if (props.recovery) {
			console.log(props.recovery);
			console.log('Retreiving secrets for the organization.');
			api
				.secret.recovery()
				.then((secrets) => {
					if (!Array.isArray(secrets)) {
						props.setConnectionError();
						return true;
					}
					console.log(`Retreived ${secrets?.length} secrets`);
					props.setSecrets(secrets);
				})
				.catch((error) => {
					console.error(error);
				});
		} else {
			console.log('Retreiving secrets for the authenticated user.');
			api
				.secret.me(props.keys.publicKeyId)
				.then((secrets) => {
					if (!Array.isArray(secrets)) {
						props.setConnectionError();
						return true;
					}
					console.log(`Retreived ${secrets?.length} secrets`);
					props.setSecrets(secrets);
				})
				.catch((error) => {
					console.error(error);
				});
		}
		

	};
    
	const getFolders = () => {
		if (!props.recovery) {
			console.log('Retreiving folders for the authenticated user.');
			api
				.folder.me()
				.then((folders) => {
					if (!Array.isArray(folders)) {
						props.setConnectionError();
						return true;
					}
					console.log(`Retreived ${folders?.length} folders`);
					props.setFolders(folders);
				})
				.catch((error) => {
					console.error(error);
				});
		} else {
			console.log('Retreiving folders for the organization.');
			api
				.folder.recovery()
				.then((folders) => {
					if (!Array.isArray(folders)) {
						props.setConnectionError();
						return true;
					}
					console.log(`Retreived ${folders?.length} folders`);
					props.setFolders(folders);
				})
				.catch((error) => {
					console.error(error);
				});
		}
	};
    
	const getOrganization = () => {
		console.log('Retreiving organization for the authenticated user.');
		api
			.organization.get()
			.then((organization) => {
				console.log('Retreived organization details');
				props.setOrganization(organization);
			})
			.catch((error) => {
				console.error(error);
			});
	};
    
	const getUsers = () => {
		console.log('Retreiving organization users for the authenticated user.');
		api.user.all()
			.then((users) => {
				if (!Array.isArray(users)) {
					props.setConnectionError();
					return true;
				}
				console.log(`Retreived ${users?.length} users`);
				props.setUsers(users);
			})
			.catch((error) => {
				console.error(error);
			});
	};

	const getOutOfSync = () => {
		console.log('Retreiving list of secrets requiring updates form the authenticated user.');
		api.secret.sync(props.recovery)
			.then((data) => {
				console.log(`Retreived ${data?.missing?.length} missing and ${data?.outdated?.length} outdated secrets.`);
				props.setOutOfSync(data);
			})
			.catch((error) => {
				console.error(error);
			});
	};
}

export default Refresh;