import { useState } from 'react';
import api from '../../services/api';
import { LockOutlined, UserOutlined, ApiOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Tooltip, Typography, notification } from 'antd';
import Api from '../../services/api';

export default function LoginView(props) {
	const [loading, setLoading] = useState(false);
	const [showSso, setShowSso] = useState(props.organization.sso);

	const serverAddress = localStorage.getItem('serverAddress') ?
		localStorage.getItem('serverAddress') : process.env.REACT_APP_SERVER_URL;

	function login(form) {
		setLoading(true);
		console.log(`User ${form.email} attemping to authenticate.`);
		api.auth.authenticate(form.email, form.password).then(async user => {
			console.log(`User ${form.email} successfuly authenticated.`);
			props.setUser(user);
		}).catch(error => {
			if (error.response?.status === 401) {
				openNotification('error', 'Operation error', 'Incorrect user and/or password.');
			} else {
				openNotification('error', 'Operation error', 'An unexpected error has happened.');
			}
			console.log(`User ${form.email} failed to authenticate.`);
			console.log(error.response);
		}).finally(() => {
			setLoading(false);
		});
	}

	function sso() {
		// Generate token
		Api.organization.sso.token.add(props.organization.id).then(async data => {
			if (data.token) {
				console.log(`${serverAddress}/auth/sso/login/${props.organization.id}/${data.token}`);
				window.electron.ipcRenderer.send(
					'open-popup', 
					`${serverAddress}/auth/sso/login/${props.organization.id}/${data.token}`);
				
				let interval = setInterval(async () => {
					let result = await Api.organization.sso.token.get(props.organization.id, data.token);
					if (result.id) {
						clearInterval(interval);
						window.electron.ipcRenderer.send('close-popup');
						console.log(`User Id ${result.id} successfuly authenticated via SSO.`);
						props.setUser(result);
					} else {
						console.log(result.status);
					}
				}, 5000);
			}
		}).catch(error => {
			console.log(error);
			openNotification('error', 'Operation error', 'An unexpected error has happened.');
		});
	}

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	if (showSso) {
		return (
			<>
				{notificationHolder}
				<Form
					style={{maxWidth: 300}}
					name="normal_login"
					className='no-drag'
					initialValues={{
						remember: true,
					}}
					onFinish={login}
				>
					<Typography.Title level={3}>Single Sign-on Login</Typography.Title>
	
					<Form.Item
						name="url"
						initialValue={serverAddress}
					>
						<Input readOnly={true} 
							prefix={<ApiOutlined className="site-form-item-icon" />}
							suffix={<Tooltip title='Change server address'>
								<EditOutlined style={{ cursor: 'pointer' }} onClick={() => {
									props.setup();
								}} />
							</Tooltip>}
						/>
					</Form.Item>
	
					<Button type='primary' style={{ width: '100%', marginBottom: 10 }} onClick={sso}>SSO Login</Button>
					<Button type='dashed' style={{ width: '100%'}} onClick={() => setShowSso(false)}>
						Use local login instead
					</Button>
				</Form>
			</>);
	}

	return (
		<>
			{notificationHolder}
			<Form
				style={{maxWidth: 300}}
				name="normal_login"
				className='no-drag'
				initialValues={{
					remember: true,
				}}
				onFinish={login}
			>
				<Typography.Title level={3}>Login</Typography.Title>

				<Form.Item
					name="url"
					initialValue={serverAddress}
				>
					<Input readOnly={true} 
						prefix={<ApiOutlined className="site-form-item-icon" />}
						suffix={<Tooltip title='Change server address'>
							<EditOutlined style={{ cursor: 'pointer' }} onClick={() => {
								props.setup();
							}} />
						</Tooltip>}
					/>
				</Form.Item>
				<Form.Item
					name="email"
					rules={[
						{
							required: true,
							message: 'Please input your Username!',
						},
						{
							type: 'email',
							message: 'Please enter a valid email address!'
						},
					]}
				>
					<Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username" autoFocus />
				</Form.Item>
				<Form.Item
					style={{ marginBottom: 10 }}
					name="password"
					rules={[
						{
							required: true,
							message: 'Please input your Password!',
						},
					]}
				>
					<Input
						prefix={<LockOutlined className="site-form-item-icon" />}
						type="password"
						placeholder="Password"
					/>
				</Form.Item>
				
				<Button type='link' style={{ paddingLeft: 2 }} onClick={props.setForgotPassword}>
					Forgot your password?
				</Button>
				
				<Form.Item>
					<Button type="primary" loading={loading} htmlType="submit" style={{ width: '100%', marginBottom: 10 }}>Log in</Button>
					{ props.organization.sso ?
						<Button type='dashed' style={{ width: '100%'}} onClick={() => setShowSso(true)}>Sign in with SSO</Button>:<></> }
				</Form.Item>

			</Form>
		</>);
}