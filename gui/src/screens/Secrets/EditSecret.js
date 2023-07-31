import { useEffect, useState } from 'react';
import Api from '../../services/api';
import encryption from '../../services/encryption';
import passwordStrength from '../../services/passwordStrength';
import { Button, Drawer, Form, Input, Space, notification } from 'antd';

export default function EditSecret(props) {
	const [plaintext, setPlaintext] = useState('');
	const [secret, setSecret] = useState(props.secret);
	const [open, setOpen] = useState(true);

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	useEffect(() => {
		setPlaintext('');
		setSecret(props.secret);

		let key = props.keys.privateKey;
		encryption
			.decrypt(props.secret?.vault?.ciphertext,key)
			.then((plainText) => {
				setPlaintext(plainText);
			})
			.catch((error) => {
				console.error(error);
			});
	}, [props.secret.id]);

	const save = async (form) => {
		console.log(`Updating secret with id ${props.secret.id}.`);
		let key = props.keys.publicKey; // Get current user's publicKey
		encryption.encrypt(form.password, key).then((ciphertext) => {
			encryption
				.encrypt(form.password, props.organization.key)
				.then(async (recovery) => {
					Api.secret
						.update(
							form.name,
							form.url,
							form.username,
							props.secret.folder,
							props.secret.id,
							props.keys.publicKeyId,
							ciphertext,
							recovery,
							secret.version + 1,
							passwordStrength(form.password),
							plaintext !== form.password
						)
						.then((secret) => {
							let data = secret;
							data.vault.id = props.secret.vault.id;
							props.onSaved(data);
						})
						.catch((error) => {
							openNotification('error', 'Server error', 'Error updating secret on the server, please try again.');
							console.error('Error while updating secret on the server.');
							console.error(error);
						});
				})
				.catch((error) => {
					openNotification('error', 'Encryption error', 'Error encrypting password.');
					console.error('An expected error happened while encrypting the secret with the organization\'s public key.');
					console.error(error);
				});
		}).catch(error => {
			openNotification('error', 'Encryption error', 'Error encrypting password.');
			console.error('An expected error happened while encrypting the secret with the user\'s public key.');
			console.error(error);
		});
	};

	if (!plaintext) {
		return <></>;
	}

	return (
		<Form
			className='no-drag'
			colon={false}
			id="form"
			labelCol={{ span: 5 }}
			wrapperCol={{ span: 19 }}
			autoComplete="off"
			onFinish={save}
		>
			{notificationHolder}
			<Drawer
				title="Edit password"
				placement={'right'}
				width={500}
				closable={false}
				onClose={() => {
					props.onClose();
					setOpen(false);
				}}
				open={open}
				extra={
					<Space>
						<Button onClick={props.onClose}>Cancel</Button>
						<Button form="form" type="primary" htmlType="submit">
              Save
						</Button>
					</Space>
				}
			>
				<Form.Item
					label="Name"
					name="name"
					rules={[{ required: true }]}
					initialValue={secret?.name}
				>
					<Input />
				</Form.Item>
				<Form.Item label="URL" name="url" initialValue={secret?.url}>
					<Input />
				</Form.Item>
				<Form.Item
					label="Username"
					name="username"
					initialValue={secret?.username}
				>
					<Input />
				</Form.Item>
				<Form.Item
					label="Password"
					name="password"
					rules={[{ required: true }]}
					initialValue={plaintext}
				>
					<Input.Password maxLength={190} value={plaintext} />
				</Form.Item>
			</Drawer>
		</Form>
	);
}
