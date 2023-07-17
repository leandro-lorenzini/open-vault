import { Button, Form, Input, Typography, notification } from 'antd';
import Api from '../../services/api';
import { useState } from 'react';

function SetupView(props) {
	const [loading, setLoading] = useState(false);

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	return (
		<>
			{notificationHolder}
			<Form
				style={{ maxWidth: 400 }}
				name="normal_login"
				className="login-form"
				initialValues={{
					remember: true,
				}}
				onFinish={(form) => {
					setLoading(true);
					Api.setup(form.address).then(data => {
						localStorage.setItem('serverAddress', form.address);
						if (data.active) {
							props.setOrganization(data);
							props.setLogin();
						} else {
							props.setSignup(true);
						}
					}).catch(error => {
						openNotification('error', 'Operation error', 'Failed to contact the server, verify the address and try again.');
						console.error(error);
					}).finally(() => {
						setLoading(false);
					});
				}}
			>
				<Typography.Title level={3}>Vault server address</Typography.Title>
				<Form.Item
					name="address"
					rules={[
						{ required: true, message: 'Please input your URL!' },
						{ type: 'url', message: 'Please enter a valid URL!' },
					]}
					initialValue={localStorage.getItem('serverAddress') ?
						localStorage.getItem('serverAddress') : process.env.REACT_APP_SERVER_URL}
				>
					<Input
						placeholder="https://"
					/>
				</Form.Item>
				<Form.Item>
					<Button htmlType="submit" style={{ width: '100%' }} loading={loading} >
						Continue
					</Button>
				</Form.Item>
			</Form>
		</>
	);
}

export default SetupView;
