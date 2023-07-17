import { Button, Form, Input, Typography, notification } from 'antd';
import { useState } from 'react';
import { UserOutlined } from '@ant-design/icons';
import Api from '../../services/api';


function ForgotPasswordView(props) {
	const [loading, setLoading] = useState(false);

	function onSubmit(form) {
		setLoading(true);
		Api.auth.resetPassword(form.email).then(() => {
			openNotification('success', 'Operation successful', 'Reset password request has been submitted, please check your inbox.');
		}).catch(error => {
			console.log(error);
			openNotification('error', 'Operation error', 'An error happened while requesting to reset your password.');
		}).finally(() => {
			setLoading(false);
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

	return (
		<>
			{notificationHolder}
			<Form
				style={{maxWidth: 300}}
				className='no-drag'
				onFinish={onSubmit}
			>
				<Typography.Title level={3}>Password Recovery</Typography.Title>
				<Typography.Paragraph>
					Enter your email address and we will send you a link to help you change your password.
				</Typography.Paragraph>

				<Form.Item
					name="email"
					rules={[
						{
							required: true,
							message: 'Please input your email address',
						},
						{
							type: 'email',
							message: 'Enter a valid email address'
						}
					]}
				>
					<Input
						prefix={<UserOutlined className="site-form-item-icon" />}
						type="email"
						placeholder="Email address"
					/>
				</Form.Item>

				<Form.Item>
					<Button type="primary" htmlType="submit" style={{ width: '100%'}} loading={loading}>
						Continue
					</Button>
				</Form.Item>
				<div style={{ textAlign: 'center'}}>
					<Button type='link' style={{ paddingLeft: 2 }} onClick={props.setLogin}>
						Back to the login page
					</Button>
				</div>
			</Form>
		</>);
}

export default ForgotPasswordView;
