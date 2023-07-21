import api from '../../services/api';
import encryption from '../../services/encryption';

import { LockOutlined, UserOutlined, ApiOutlined, ShopOutlined, MailOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Tooltip, Typography } from 'antd';
import copy from 'copy-to-clipboard';
import { useState } from 'react';

export default function SignupView(props) {
	const [showModal, setShowModal] = useState(false);
	const [user, setUser] = useState(false);
	const [keys, setKeys] = useState(false);

	const onSignup = (form) => {
		console.log('Generating key pair for the new organization.');
		encryption.generateKeys().then(keys => {
			console.log('Submitting organization information to the server.');
			api.auth.signup(form.organizationName, form.fullname, form.email, form.password, keys.public).then((user) => {
				console.log('Server setup is complete.');
				setUser(user);
				setKeys(keys);
				setShowModal(true);
			}).catch(error => {
				alert('An error happened while creating the organization, please try again.');
				console.error('Error while sending organization information to the server.');
				console.error(error);
			});
		}).catch(error => {
			alert('An error happened while creating the organization, please try again.');
			console.error('Error while generating organization\'s key pair.');
			console.error(error);
		});
	};

	return (
		<>
			<Modal
				title="Setup has been completed!"
				open={showModal}
				onOk={() => props.setUser(user)}
				onCancel={() => props.setUser(user)}
				footer={[
					<Button style={{ marginTop: 20 }} key='submit' type='primary' danger onClick={() => props.setUser(user)}>
						Ok, I have saved the key
					</Button>
				]}
			>
				<>
					<Typography.Paragraph>
						We have generated a local key for your organization. 
						Save it in a safe place as it can decrypt any password created by your users.
					</Typography.Paragraph>

					<Form.Item help="Make sure to save this key as it cannot be retreived later.">
						<Input defaultValue={keys.private} readOnly suffix={<>
							<Tooltip title="Copy to clipboard">
								<CopyOutlined
									onClick={() => copy(keys.private)}
								/>
							</Tooltip>
						</>} />
					</Form.Item>
				</>
			</Modal>
			<Form
				style={{maxWidth: 300}}
				name="normal_login"
				className="login-form"
				initialValues={{
					remember: true,
				}}
				onFinish={onSignup}
			>
				<Typography.Title level={3}>Server setup</Typography.Title>
				<Form.Item
					name="url"
					initialValue={localStorage.getItem('serverAddress') ?
						localStorage.getItem('serverAddress') : process.env.REACT_APP_SERVER_URL}
				>
					<Input readOnly={true}
						prefix={<ApiOutlined className='site-form-item-icon'/>}
						suffix={<Tooltip title='Change server address'>
							<EditOutlined style={{ cursor: 'pointer' }} onClick={() => {
								props.setup();
							}} />
						</Tooltip>}
					/>
				</Form.Item>
				<Form.Item
					name="organizationName"
					rules={[
						{
							required: true,
							message: 'Please input your organization name!',
						},
					]}
				>
					<Input prefix={<ShopOutlined className="site-form-item-icon" />} placeholder="Organization name" />
				</Form.Item>
				<Form.Item
					name="fullname"
					rules={[
						{
							required: true,
							message: 'Please input your full name!',
						},
					]}
				>
					<Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Full name" />
				</Form.Item>
				<Form.Item
					name="email"
					rules={[
						{
							required: true,
							message: 'Please input your email address!',
						},
					]}
				>
					<Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="Username" />
				</Form.Item>
				<Form.Item
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

				<Form.Item>
					<Button type="primary" htmlType="submit" style={{ width: '100%'}}>
						Continue
					</Button>
				</Form.Item>
			</Form>
		</>);
}