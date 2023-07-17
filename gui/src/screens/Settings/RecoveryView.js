import { Button, Divider, Form, Input, Typography, notification } from 'antd';

export default function RecoveryView(props) {
	const [notificationApi, notificationHolder] = notification.useNotification();
	const [form] = Form.useForm();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	function activate(form) {
		props.setRecovery(form.key);
		openNotification('success', 'Recovery mode activated', 'The key has been imported, you can go to the password list now.');
	}

	function deactivate() {
		props.setRecovery(null);
		form.setFieldValue('key', '');
		openNotification('success', 'Back to user mode', 'The recovery key has been cleared from the application');
	}
   
	return <div  style={{ height: '100%', overflow: 'auto' }}>
		{notificationHolder}
		<div className='center' style={{paddingTop: 20}} >
			<div className='scrollable'>
				<Typography.Title level={3}>Recovery mode</Typography.Title>
				<Divider style={{ marginTop: 0, marginBottom: 15}}/>
				<Typography.Paragraph>
					This is helpful when users lose access to their personal folder or 
					when a shared folder no longer has any active user who can replicate the passwords to newly added users.
					You can also view all passwords under the passwords submneu.
				</Typography.Paragraph>
				<Form form={form} layout='vertical' onFinish={activate}>
					<Form.Item 
						name='key'
						style={{ marginBottom: 10 }}
						initialValue={props.recovery ? props.recovery : ''}
						label='Organization Private Key'>
						<Input.TextArea rows={8} disabled={props.recovery}></Input.TextArea>
					</Form.Item>
					{ !props.recovery ?
						<Button htmlType='submit' type='default'>Activate recovery mode</Button> : <></>
					}
				</Form>
				{ props.recovery ?
					<Button htmlType='button' type='default' onClick={deactivate}>Exit recovery mode</Button>:<></>
				}
			</div>
		</div>
	</div>;
}