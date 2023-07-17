import { useState } from 'react';
import { Button, Form, Input, Typography, notification, Collapse, Divider } from 'antd';
import Api from '../../services/api';
import encryption from '../../services/encryption';

export default function ChangePasswordView(props) {
	const [processing, setProcessing] = useState(false);

	function onChangePassword(form) {
		setProcessing(true);
		Api.user.change_password(
			form.password,
			form.newPassword,
			form.confirmNewPassword)
			.then(() => {
				openNotification('success', 'Operation successful', 'Password has been changed');
			})
			.catch((error) => {
				if (error.response?.status === 401) {
					// eslint-disable-next-line sonarjs/no-duplicate-string
					openNotification('error', 'Operation error', 'Current password is wrong.');
				} else {
					openNotification('error', 'Operation error', 'Unexpected error.');
				}
			})
			.finally(() => {
				setProcessing(false);
			});
	}

	async function onChangeLocalPassword(form) {
		setProcessing(true);
		try {
			let keys = await encryption.getKeys(props.user.id);
			if (encryption.hashString(form.password) === keys.localPassword) {
				encryption.updateLocalPassword(props.user.id, form.password, form.newPassword).then(() => {
					openNotification('success', 'Operation successful', 'Local password has been changed');
					props.setLocalPassword(form.newPassword);
					console.log('Local password has been reset');
					setProcessing(false);
				}).catch((error) => {
					openNotification('error', 'Operation error', 'Local password could not be changed');
					console.log(error);
				});
			} else {
				openNotification('error', 'Operation error', 'Current password is wrong.');
				setProcessing(false);
			}
		} catch (error) {
			openNotification('error', 'Operation error', 'Error retreiving key material');
			setProcessing(false);
			console.error(error);
		}
	}

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	const items = [
		{
			key: '1',
			label: 'Sign-in Password',
			collapsible: props.user.sso ? 'disabled':true,
			children: <Form layout='vertical' onFinish={onChangePassword}>
				<Typography.Paragraph>
					This is the password you use to sign in to the application, the one that you enter together with your email address.
				</Typography.Paragraph>
				<Form.Item 
					name='password' 
					label='Current password'
					rules={[
						{
							required: true,
							message: 'Please input your current Password!',
						},
					]}
				>
					<Input.Password placeholder='Current password'/>
				</Form.Item>
				<Form.Item 
					name='newPassword' 
					label='New password'
					rules={[
						{
							required: true,
							message: 'This fiels if required',
						},
						{
							min: 8,
							message: 'Password must have at least 8 characters.'
						},
						{
							pattern: /[A-Z]/,
							message: 'Password must have uppercase characters.'
						},
						{
							pattern: /[0-9]/,
							message: 'Password must have numbers.'
						},
						{
							pattern: /[!-/\\/]/,
							message: 'Password must special characters.'
						}
					]}
				>
					<Input.Password placeholder='New password'/>
				</Form.Item>
				<Form.Item 
					name='confirmNewPassword' 
					label='Confirm new password'
					rules={[
						{
							required: true,
							message: 'Please confirm your password!',
						},
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue('newPassword') === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error('The new password that you entered do not match!'));
							},
						}),
					]}
				>
					<Input.Password placeholder='Confirm new password'/>
				</Form.Item>
				<Form.Item>
					<Button loading={processing} htmlType='submit' type='default'>Update</Button>
				</Form.Item>
			</Form>
		},
		{
			key: '2',
			label: 'Local Password',
			children: <Form layout='vertical' onFinish={onChangeLocalPassword}>
				<Typography.Paragraph>
					This is the password that you enter after signing in with your user and password.
					This password is set at the device, so note that if you use multiple devices,
					the password will still remain the same on those other deivces.
				</Typography.Paragraph>
				<Form.Item 
					name='password' 
					label='Current password'
					rules={[
						{
							required: true,
							message: 'Please input your current Password!',
						},
					]}
				>
					<Input.Password placeholder='Current password'/>
				</Form.Item>
				<Form.Item 
					name='newPassword' 
					label='New password'
					rules={[
						{
							required: true,
							message: 'This fiels if required',
						},
						{
							min: 8,
							message: 'Password must have at least 8 characters.'
						},
						{
							pattern: /[A-Z]/,
							message: 'Password must have uppercase characters.'
						},
						{
							pattern: /[0-9]/,
							message: 'Password must have numbers.'
						},
						{
							pattern: /[!-/\\/]/,
							message: 'Password must special characters.'
						}
					]}
				>
					<Input.Password placeholder='New password'/>
				</Form.Item>
				<Form.Item 
					name='confirmNewPassword' 
					label='Confirm new password'
					rules={[
						{
							required: true,
							message: 'Please confirm your password!',
						},
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue('newPassword') === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error('The new password that you entered do not match!'));
							},
						}),
					]}
				>
					<Input.Password placeholder='Confirm new password'/>
				</Form.Item>
				<Form.Item>
					<Button loading={processing} htmlType='submit' type='default'>Update</Button>
				</Form.Item>
			</Form>
		},
	];
	
	return <div  style={{ height: '100%', overflow: 'auto' }}>
		{notificationHolder}
		<div className='center' style={{paddingTop: 20}} >
			<div className='scrollable'>
				<Typography.Title level={3}>Change password</Typography.Title>
				<Divider style={{ marginTop: 0, marginBottom: 15}}/>
				<Collapse 
					accordion 
					defaultActiveKey={props.user.sso ? ['2'] : ['1']} 
					items={items} 
					ghost
				/>
			</div>
		</div>
	</div>;
}