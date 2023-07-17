import { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Select, Typography, notification } from 'antd';
import Api from '../../services/api';

export default function SmtpView() {
	const [processing, setProcessing] = useState(false);	
	const [organization, setOrganization] = useState();

	useEffect(() => {
		Api.organization.get().then(org => {
			setOrganization(org);
		}).catch(error => {
			console.log(error);
		});
	}, []);

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	function submit(form) {
		setProcessing(true);
		Api.organization.smtp.set(form.server, form.port, form.secure, form.username, form.password).then((() => {
			openNotification('success', 'Operation Successful', 'The authentication settings have been saved successfully.');
		})).catch(error => {
			openNotification('error', 'Operation Error', error?.message ? error.message:'A techinical error has happened');
			console.log(error);
		}).finally(() => {
			setProcessing(false);
		});
	}
    
	if(!organization) {
		return <></>;
	}
	
	return <div  style={{ height: '100%', overflow: 'auto' }}>
		{notificationHolder}
		<div className='center' style={{paddingTop: 20}} >
			<div className='scrollable'>
				<Typography.Title level={3}>SMTP server</Typography.Title>
				<Divider style={{ marginTop: 0, marginBottom: 15}}/>
				<Form layout='vertical' onFinish={submit}>

					<Form.Item
						name='server'
						required
						initialValue={organization.smtp?.server}
						label='Server'>
						<Input placeholder='smtp.organization.com'></Input>
					</Form.Item>

					<Form.Item
						name='port'
						required
						initialValue={organization.smtp?.port}
						label='Port'>
						<Input type='number' placeholder='465'></Input>
					</Form.Item>

					<Form.Item
						name='secure'
						required
						initialValue={organization.smtp?.secure ? true : false}
						label='Secure'>
						<Select options={[
							{ value: true, label: 'Enabled' },
							{ value: false, label: 'Disabled' },
						]} ></Select>
					</Form.Item>

					<Form.Item
						name='username'
						required
						initialValue={organization.smtp?.username}
						label='Username'>
						<Input placeholder='user@organization.com'></Input>
					</Form.Item>

					<Form.Item
						name='password'
						required
						initialValue={organization.smtp?.password}
						label='Password'>
						<Input type='password'></Input>
					</Form.Item>
					
					<Form.Item>
						<Button loading={processing} htmlType='submit' type='default'>Save</Button>
					</Form.Item>
				</Form>
			</div>
		</div>
	</div>;
}