/* eslint-disable sonarjs/no-duplicate-string */
import { Button, Form, Input, Typography, Modal, notification } from 'antd';
import encryption from '../../services/encryption';
import { useEffect, useState } from 'react';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';


function LocalPasswordView(props) {
	const [loading, setLoading] = useState(false);
	const [processing, setProcessing] = useState(true);
	const [existing, setExisting] = useState(false);
	const [showModal, setShowModal] = useState(false);

	const navigate = useNavigate();

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};


	useEffect(() => {
		getKeys();
	}, []);

	const getKeys = async () => {
		if (!props.user?.id) {
			navigate('/signin');
		} else {
			let keys = await encryption.getKeys(props.user.id);
			if (keys) {
				setExisting(true);
			}
			setProcessing(false);
		}
	};

	function generateKeys(form) {
		setLoading(true);
		console.log(`Generating keys for user id ${props.user.id}.`);
		encryption.generateKeys(props.user.id, form.local).then(async () => {
			props.setLocalPassword(form.local);
			try {
				let keys = await encryption.getKeys(props.user.id, form.local);
				console.log(`Keys for user id ${props.user.id} have been generated.`);
				props.setKeys(keys);
			} catch (error) {
				console.error('Keys have been created but an error happened trying to read them.');
				console.error(error);
				openNotification('error', 'Operation error', 'Error generating your key pairs.');
			}
		}).catch(error => {
			openNotification('error', 'Operation error', 'Error generating your key pairs.');
			console.error(error);
		}).finally(() => {
			setLoading(false);
		});
	}

	function deleteKey() {
		setLoading(true);
		encryption.deleteKey(props.user.id).then(() => {
			window.location.reload();
		}).catch((error) => {
			console.log(error);
			setLoading(false);
			openNotification('error', 'Operation error', 'An error happened while deleting your locak key.');
		});
	}

	if (processing) {
		return <></>;
	}

	if (existing) {
		return (
			<>
				{ notificationHolder }
				<Form
					style={{ maxWidth: 300 }}
					name="normal_login"
					className="login-form"
					initialValues={{
						remember: true,
					}}
					onFinish={async (form) => {
						setLoading(true);
						try {
							let keys = await encryption.getKeys(props.user.id);
							if (encryption.hashString(form.local) === keys.localPassword) {
								props.setLocalPassword(form.local);
								keys = await encryption.getKeys(props.user.id, form.local);
								props.setKeys(keys);
								console.log(`Successfuly retreived key material for user id ${props.user.id}, login flow completed.`);
							} else {
								openNotification('error', 'Authentication error', 'The entered local password is wrong.');
								setLoading(false);
							}
						} catch (error) {
							openNotification('error', 'Operation error', 'Error retreiving key material.');
							setLoading(false);
							console.error(`Error retreiving key material for user id ${props.user.id}`);
							console.error(error);
						}
					}}
				>
					<Typography.Title level={3}>Local Password</Typography.Title>
					<Typography.Paragraph>
						The local password is different from the one you use to login.
					</Typography.Paragraph>
					<Form.Item
						name="local"
						rules={[
							{
								required: true,
								message: 'Please input your Local Password!',
							},
						]}
					>
						<Input.Password
							autoFocus
							placeholder="Local Password"
						/>
					</Form.Item>
					<Form.Item>
						<Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>Continue</Button>
					</Form.Item>

					<Button
						type='link'
						onClick={() => setShowModal(true)}
						style={{ width: '100%' }}>
						I don&apos;t remember my local password
					</Button>
				</Form>
				<Modal
					title="Reset local password"
					confirmLoading={loading}
					open={showModal}
					onOk={deleteKey}
					okType='danger'
					okText='Continue'
					onCancel={() => setShowModal(false)}
				>
					<p>
						If you don&apos;t remember your local password, we can help you to reset it,
						but keep in mind that if you have passwords saved under your personal folder or
						if you are the only member of any shared folder and this is the only device that
						you use, you&apos;ll need to ask help from your organization administrator to 
						recover those passwords.
					</p>
				</Modal>
			</>
		);
	}

	if (!existing) {
		return (
			<>
				<Form
					style={{ maxWidth: 300 }}
					className='no-drag'
					onFinish={generateKeys}
				>
					<Typography.Title level={3}>Create a Local Password</Typography.Title>
					<Typography.Paragraph>
						The local password will be used to protect passwords saved on this computer.
					</Typography.Paragraph>
					<Typography.Paragraph>
						You will need to re-enter this password every time you launch the vault application.
					</Typography.Paragraph>

					<Form.Item
						name="local"
						rules={[
							{
								required: true,
								message: 'Please input a Local Password!',
							},
						]}
					>
						<Input
							prefix={<LockOutlined className="site-form-item-icon" />}
							type="password"
							placeholder="Local Password"
						/>
					</Form.Item>

					<Form.Item>
						<Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
							Continue
						</Button>
					</Form.Item>
				</Form>
			</>);
	}
}

export default LocalPasswordView;
