import api from '../../services/api';
import encryption from '../../services/encryption';
import passwordStrength from '../../services/passwordStrength';
import { Button, Drawer, Form, Input, Select, Space, notification } from 'antd';

export default function New(props) {

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	const save = async (form) => {
		console.log('Creating a new secret.');
		encryption.encrypt([form.password, form.totp], props.keys.publicKey).then((encrypted) => {
			console.log('Secret has been encrypted with user\'s public Key.');
			encryption
				.encrypt([form.password, form.totp], props.organization.key)
				.then(async(recovery) => {
					console.log('Secret has been encrypted with organization\'s public Key.');
					api.secret
						.add(
							form.name,
							form.url,
							form.username,
							form.folder,
							props.keys.publicKeyId,
							encrypted[0],
							recovery[0],
							encrypted[1],
							recovery[1],
							passwordStrength(form.password)
						)
						.then((secret) => {
							console.log('Secret has been saved on vault server.');
							props.onSaved(secret);
						})
						.catch((error) => {
							openNotification('error', 'Server error', 'Error creating secret on the server, please try again.');
							console.error('Error while saving secret to the server.');
							console.error(error);
						});
				})
				.catch((error) => {
					openNotification('error', 'Encryptiomn error', 'Encryption error, please check the logs for more informaation.');
					console.error('An expected error happened while encrypting the secret with the organization\'s public key.');
					console.error(error);
				});
		}).catch(error => {
			openNotification('error', 'Encryption error', 'Encryption error, please check the logs for more informaation.');
			console.error('An expected error happened while encrypting the secret with the user\'s public key.');
			console.error(error);
		});
	};

	return (
		<Form
			id="form"
			labelCol={{ span: 5 }}
			wrapperCol={{ span: 19 }}
			autoComplete="off"
			onFinish={save}
		>
			{notificationHolder}
			<Drawer
				className='no-drag'
				title="New password"
				placement={'right'}
				width={500}
				closable={false}
				onClose={props.onClose}
				open={true}
				extra={
					<Space>
						<Button onClick={props.onClose}>Cancel</Button>
						<Button form="form" type="primary" htmlType="submit">
              Save
						</Button>
					</Space>
				}
			>
				<Form.Item label="Name" name="name" rules={[{ required: true }]}>
					<Input />
				</Form.Item>
				<Form.Item label="URL" name="url">
					<Input />
				</Form.Item>
				<Form.Item label="Username" name="username">
					<Input />
				</Form.Item>
				<Form.Item
					label="Password"
					name="password"
					rules={[{ required: true }]}
				>
					<Input.Password />
				</Form.Item>
				<Form.Item
					label="TOTP secret"
					help="The base64 TOTP secret key"
					name="totp"
				>
					<Input.Password />
				</Form.Item>
				<Form.Item label="Folder" name="folder" rules={[{ required: true }]}>
					<Select placeholder="Please select a folder">
						{props.folders
							?.filter((f) => f.user)
							.map((folder) => (
								<Select.Option key={folder.id} value={folder.id}>
									My personal folder
								</Select.Option>
							))}
						{props.folders
							?.filter((f) => !f.user)
							.map((folder) => (
								<Select.Option key={folder.id} value={folder.id}>
									{folder.name}
								</Select.Option>
							))}
					</Select>
				</Form.Item>
			</Drawer>
		</Form>
	);
}
