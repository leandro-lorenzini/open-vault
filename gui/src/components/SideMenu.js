import {
	FolderOutlined,
	LockOutlined,
	FolderOpenOutlined,
	ApartmentOutlined,
	UserOutlined,
	LogoutOutlined,
	UnlockOutlined,
	MedicineBoxOutlined,
	DashboardOutlined,
	SettingOutlined,
	MailOutlined
} from '@ant-design/icons';
import { Menu, notification, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Api from '../services/api';

export default function SideMenu(props) {
	const navigate = useNavigate();
	const location = useLocation();
	const [selectedKeys, setSelectedKeys] = useState([]);
	const [admin, setAdmin] = useState(false);

	useEffect(() => {
		if (location.pathname !== '/secrets') {
			setSelectedKeys([location.pathname]);
		}
	}, [location]);

	useEffect(() => {
		let adminGroups = props.organization.groups
			?.filter((group) => group.admin)
			.map((group) => group.id);

		setAdmin(false);
		if (props.user) {
			for (let group of props.user.groups) {
				if (adminGroups?.includes(group.toString())) {
					setAdmin(true);
				}
			}
		}
	}, [props.organization?.groups]);

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	function signout() {
		Api.auth.logout().then(() => {
			window.location.reload();
		});
	}

	function moveSecret(destination) {
		let secret = props.dragSecret;
		if (secret?.id && secret.folder !== destination.id) {
			console.log(`Move secret ${secret.name} to folder ${destination.name}`);
			Api.secret.move(secret.id, secret.folder, destination.id).then(() => {
				// Move folder in memory until we wair for the next syncronization
				const folders = [];
				for (let folder of props.folders) {
					if (folder.id === secret.folder) {
						folder.secrets = folder.secrets.filter(s => s.id ==! secret.id);
					}
					if (folder.id === destination.id) {
						secret.folder = destination.id;
						folder.secrets.push(secret);
					}
					folders.push(folder);
				}
				props.setFolders(folders);
				props.setDragSecret(null);
				openNotification('success', 'Operation successful', 'Secret has been moved to another folder.');
			}).catch(error => {
				console.log(error);
				props.setDragSecret(null);
				openNotification('error', 'Operation error', 'Error while moving password to another folder.');
			});
		}
	}

	return (
		<div style={{ height: '100%', overflow: 'auto' }} className='scrollable'>
			{ notificationHolder }
			<Menu
				className='no-drag'
				style={{
					opacity: 0.97,
					borderRight: 'none',
					backgroundColor: 'transparent',
				}}
				selectedKeys={selectedKeys}
				defaultOpenKeys={['passwords']}
				mode="inline"
				items={[
					{
						key: 'passwords',
						label: 'Passwords',
						icon: <LockOutlined />,
						children: [
							{
								className: 'folder-item',
								key: 'all',
								label: 'All passwords',
								icon: <UnlockOutlined />,
								onClick: () => {
									props.setSelectedFolder(null);
									setSelectedKeys('all');
									navigate('/secrets');
								}
							},
							...props.folders.map(folder => {
								return {
									onMouseEnter: () => {
										moveSecret(folder);
									},
									ondrop: () => alert('DROP'),
									className: 'folder-item',
									key: folder.id,
									label: (() => {

										if (folder.user) {
											let name = props.users?.filter(u => u.id === folder.user)[0]?.name;
											return <Tooltip title={`${name}'s personal folder`}>{name}`s personal folder</Tooltip>;
										}
										return <Tooltip title={folder.name}>{folder.name}</Tooltip>;
									})(),
									icon: <FolderOpenOutlined />,
									onClick: () => {
										props.setSelectedFolder(folder.id);
										setSelectedKeys(folder.id);
										if (location.pathname !== '/secrets') {
											navigate('/secrets');
										}
									}
								};
							})
						],
					},
					{
						key: 'profile',
						icon: <UserOutlined />,
						label: 'My profile',
						children: [
							{
								key: '/preferences',
								label: 'User preferences',
								icon: <SettingOutlined />,
								onClick: () => {
									navigate('/preferences');
								},
							},
							{
								key: '/change-password',
								label: 'Change my password',
								icon: <UnlockOutlined />,
								onClick: () => {
									navigate('/change-password');
								},
							},
							{
								key: 'signout',
								label: 'Sign out',
								icon: <LogoutOutlined />,
								onClick: signout
							},
						]
					},
					{
						key: 'settings',
						disabled: !admin,
						icon: <SettingOutlined />,
						label: 'Administration',
						children: [
							{
								key: '/settings/dashboard',
								label: 'Security dashboard',
								icon: <DashboardOutlined />,
								onClick: () => {
									navigate('/settings/dashboard');
								},
							},
							{
								key: '/settings/smtp',
								label: 'SMTP server',
								icon: <MailOutlined />,
								onClick: () => {
									navigate('/settings/smtp');
								},
							},
							{
								key: '/settings/authentication',
								label: 'Authentication',
								icon: <UnlockOutlined />,
								onClick: () => {
									navigate('/settings/authentication');
								},
							},
							{
								key: '/settings/users',
								label: 'Users',
								icon: <UserOutlined />,
								onClick: () => {
									navigate('/settings/users');
								},
							},
							{
								key: '/settings/groups',
								label: 'Groups',
								icon: <ApartmentOutlined />,
								onClick: () => {
									navigate('/settings/groups');
								},
							},
							{
								key: '/settings/folders',
								label: 'Folders',
								icon: <FolderOutlined />,
								onClick: () => {
									navigate('/settings/folders');
								},
							},
							{
								key: '/settings/recovery',
								label: 'Recovery mode',
								icon: <MedicineBoxOutlined />,
								onClick: () => {
									navigate('/settings/recovery');
								},
							},
						]
					}
				]}
			/>
		</div>);
}