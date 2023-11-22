import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ConfigProvider, theme, Col, Row } from 'antd';
import LoginView from './screens/Authentication/LoginView';
import SecretsView from './screens/Secrets/SecretsView';
import api from './services/api';
import Sync from './components/Sync';
import 'antd/dist/reset.css';
import Refresh from './components/Refresh';
import SignupView from './screens/Authentication/SignupView';
import LocalPasswordView from './screens/Authentication/LocalPasswordView';
import SetupView from './screens/Authentication/SetupView';
import SideMenu from './components/SideMenu';
import ForgotPasswordView from './screens/Authentication/ForgotPasswordView';
import AuthenticationView from './screens/Settings/AuthenticationView';
import UsersView from './screens/Settings/user/UsersView';
import FoldersView from './screens/Settings/folders/FoldersView';
import GroupsView from './screens/Settings/groups/GroupsViews';
import DashboardView from './screens/Settings/DashboardView';
import RecoveryView from './screens/Settings/RecoveryView';
import ChangePasswordView from './screens/Profile/ChangePasswordView';
import PreferencesView from './screens/Profile/PreferencesView';
import SmtpView from './screens/Settings/SmtpView';
import ConnectionErrorView from './components/ConnectionErrorView';
import VersionMismatchView from './components/VersionMismatchView';
import LoadingView from './components/LoadingView';

function App() {
	const [user, setUser] = useState(null);
	const [users, setUsers] = useState([]);
	const [secrets, setSecrets] = useState([]);
	const [selectedSecret, setSelectedSecret] = useState([]);
	const [selectedFolder, setSelectedFolder] = useState();
	const [folders, setFolders] = useState([]);
	const [organization, setOrganization] = useState({});
	const [localPassword, setLocalPassword] = useState();
	const [outOfSync, setOutOfSync] = useState({missing: [], outdated: []});
	const [keys, setKeys] = useState(null);
	const [darkMode, setDarkMode] = useState(true);
	const [darkModePrefence, setDarkModePreference] = useState(localStorage.getItem('darkMode'));
	const [authenticated, setAuthenticated] = useState(false);
	const [recovery, setRecovery] = useState(false);
	const [dragSecret, setDragSecret] = useState(null);
	const [connectionError, setConnectionError] = useState(false);

	const navigate = useNavigate();

	/* Theme settings */
	const backgroundColor = (dark) => {
		return dark ? 'rgb(66, 66, 66)' : 'white';
	};
	const backgroundColorContent = (dark) => {
		return dark ? 'rgb(45, 45, 45)' : '#f1f1f1';
	};
	const getTheme = () => {
		return { 
			token: { colorPrimary: '#959698' },
			algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm
		};
	};

	useEffect(() => {
		window.electron.ipcRenderer.on('lock-screen', () => {
			console.log("Clearing master password from application memory");
			setLocalPassword(null);
			navigate('/local');
		});
	}, []);

	useEffect(() => {
		try {
			window.electron.ipcRenderer.invoke('theme').then(value => {
				if (!darkModePrefence || darkModePrefence === 'auto') {
					setDarkMode(value === 'dark');
					console.log('Requested theme information from electron: ' + value);
				}
			});
			window.electron.ipcRenderer.on('theme-update', (event, data) => {
				if (!darkModePrefence || darkModePrefence === 'auto') {
					console.log('Theme changed from electron: ' + data);
					setDarkMode(data === 'dark');
				}
			});
			if (darkModePrefence === 'enabled') {
				setDarkMode(true);
			}
			if (darkModePrefence === 'disabled') {
				setDarkMode(false);
			}
		} catch (error) {
			console.error(error);
		}
	}, [darkModePrefence]);

	/* App initialization checks */
	useEffect(() => {
		let address = localStorage.getItem('serverAddress') ?
			localStorage.getItem('serverAddress') : process.env.REACT_APP_SERVER_URL;

		if (!address) {
			console.log('No server address in memory, lauching setup screen.');
			navigate('/setup');
		} else {
			console.log(`Trying to contact ${address} for setup information.`);
			api.setup(address).then(data => {
				if (!data.active) {
					console.log('Vault server side not configured, launching signup view.');
					setTimeout(() => {
						navigate('/signup');
					}, 500);
				} else {
					if (data.version !== process.env.REACT_APP_VERSION) {
						console.log(`Server ${data.version} and GUI ${process.env.REACT_APP_VERSION} version mismatch.`);
						navigate('/version-mismatch');
					} else {
						setOrganization(data);
						console.log('Vault server is active, checking if user is already authenticated.');
						api.auth.isAuthenticated().then((user) => {
							console.log('User is already authenticated, complete app initialization.');
							setAuthenticated(true);
							setUser(user);
							navigate('/local');
						}).catch(error => {
							console.log('User is not authenticated, launching login view.');
							navigate('/signin');
							console.error(error);
						});
					}
				}
			}).catch(error => {
				console.error('Server saved in memory is not responding correctly, launching setup view');
				console.error(error);
				navigate('/setup');
			});
		}
    
	}, []);

	/*
	 * Pre-authentication routes 
	 */
	if (!authenticated || !localPassword) {
		return <ConfigProvider theme={getTheme()}>
			<div className='init-container' style={{ backgroundColor: backgroundColorContent(darkMode)}}>
				<Routes>
					<Route path="/setup" element={<LoadingView darkMode={darkMode}/>}/>
					<Route path="/version-mismatch" element={<VersionMismatchView
						setup={() => {
							navigate('/setup');
						}}
					/>}/>
					<Route path="/setup" element={<SetupView
						setOrganization={setOrganization} 
						setSignup={() => navigate('/signup')}
						setLogin={() => navigate('/signin')}
						setVersionMismatch={() => navigate('/version-mismatch')}
					/>}/>
					<Route path="/signup" element={<SignupView 
						setUser={() => {
							navigate('/signin');
						}}
						setup={() => {
							navigate('/setup');
						}}
					/>}/>
					<Route path="/signin" element={<LoginView 
						setup={() => {
							navigate('/setup');
						}}
						setForgotPassword={() => {
							navigate('/forgot-password');
						}}
						organization={organization}
						setLocalPassword={setLocalPassword} 
						setKeys={setKeys}
						setUser={(user) => {
							setUser(user);
							setAuthenticated(true);
							navigate('/local');
						}}
					/>}/>
					<Route path="/forgot-password" element={<ForgotPasswordView 
						setLogin={() => {
							navigate('/signin');
						}} 
					/>}/>
					<Route path="/local" element={<LocalPasswordView 
						setKeys={setKeys} 
						setLocalPassword={(password) => {
							setLocalPassword(password);
						}} 
						user={user} 
					/>}/>
					<Route path="*" element={<Navigate to='/signin'/>}/>
				</Routes>
			</div>
		</ConfigProvider>;
	}

	
	/* 
	 * Logged in screens
	 * User is authenticated and has provided a local password
	 * Using routes from now on.
	 */
	return (
		<ConfigProvider theme={getTheme()}>
			<Sync 
				recovery={recovery}
				keys={keys} 
				users={users} 
				secrets={secrets} 
				outOfSync={outOfSync} 
				user={user} 
				localPassword={localPassword}/>

			{ connectionError ? 
				<div className='init-container' style={{ backgroundColor: backgroundColorContent(darkMode)}}>
					<ConnectionErrorView 
						setConnectionError={setConnectionError}
						setUser={setUser}
						setAuthenticated={setAuthenticated}
					/>
				</div>
				:
				<Row style={{ height: '100%' }}>
					<Col 
						className='drag'
						span={6} 
						style={{ 
							height: '100%',
							opacity: 0.98,
							alignItems: 'stretch',
							padding: 10,
							paddingTop: 40,
							borderRight: '1px solid rgba(5, 5, 5, 0.06)', 
							backgroundColor: backgroundColor(darkMode),
						}}>
						<SideMenu 
							setDragSecret={setDragSecret}
							dragSecret={dragSecret}
							setFolders={setFolders}
							recovery={recovery}
							folders={folders} 
							users={users} 
							setSelectedFolder={setSelectedFolder} 
							selectedFolder={selectedFolder}
							organization={organization}
							user={user}
						/>
					</Col>
					<Col 
						span={18} 
						style={{ 
							height: '100%',
							backgroundColor: backgroundColorContent(darkMode),
							paddingBottom: 0
						}}>
						<Routes>
							<Route path="/settings">
								<Route path='dashboard' element={<DashboardView />} />
								<Route path='authentication' element={<AuthenticationView />} />
								<Route path='smtp' element={<SmtpView organization={organization} />} />
								<Route path='users' element={<UsersView organization={organization} />} />
								<Route path='groups' element={<GroupsView organization={organization} />} />
								<Route path='folders' element={<FoldersView organization={organization} />} />
								<Route path='recovery' element={<RecoveryView setRecovery={setRecovery} recovery={recovery} />} />
							</Route>
							<Route path='/change-password' element={<ChangePasswordView user={user} setLocalPassword={setLocalPassword}/>}/>
							<Route path='/preferences' element={<PreferencesView setDarkModePreference={setDarkModePreference} />}/>
							<Route path="/secrets" element={<SecretsView
								setDragSecret={setDragSecret}
								recovery={recovery}
								user={user} 
								secrets={secrets} 
								selectedSecret={selectedSecret} 
								selectedFolder={selectedFolder} 
								setSelectedFolder={setSelectedFolder}
								setSecrets={setSecrets}
								setSelectedSecret={setSelectedSecret}
								localPassword={localPassword}
								keys={keys}
								folders={folders}
								setFolders={setFolders}
								organization={organization}
								darkMode={darkMode}
							/>} />
							<Route path="*" element={<Navigate to='/secrets'/>}/>
							
						</Routes>
					</Col>
				</Row>
			}
			{ user && keys && !recovery && !dragSecret ? // we don't want to refresh data right after moving a folder.
				<Refresh 
					setAuthenticated={setAuthenticated}
					setConnectionError={setConnectionError}
					recovery={recovery}
					user={user} 
					keys={keys}
					setSecrets={setSecrets} 
					setFolders={setFolders} 
					setUser={setUser} 
					setUsers={setUsers} 
					setOrganization={setOrganization} 
					setOutOfSync={setOutOfSync} 
					setLocalPassword={setLocalPassword} />:<></>}

			{ recovery && !dragSecret ?
				<Refresh
					setAuthenticated={setAuthenticated}
					setConnectionError={setConnectionError}
					recovery={recovery}
					user={user} 
					keys={keys}
					setSecrets={setSecrets} 
					setFolders={setFolders} 
					setUser={setUser} 
					setUsers={setUsers} 
					setOrganization={setOrganization} 
					setOutOfSync={setOutOfSync} 
					setLocalPassword={setLocalPassword} />:<></>}
		</ConfigProvider>
	);
}

export default App;
