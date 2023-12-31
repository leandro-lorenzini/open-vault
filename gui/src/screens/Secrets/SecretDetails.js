import { useEffect, useState } from 'react';
import { EyeInvisibleOutlined, CopyOutlined, ExclamationCircleFilled, EyeOutlined } from '@ant-design/icons';
import { TOTP } from 'otpauth';
import encryption from '../../services/encryption';
import { Avatar, Tabs, Typography, Modal, Space, Dropdown, Form, Input, Tooltip, Alert } from 'antd';
import copy from 'copy-to-clipboard';
import Api from '../../services/api';
import EditSecret from './EditSecret';

export default function SecretDetails(props) {
	const [edit, setEdit] = useState(false);
	const [plaintext, setPlaintext] = useState('');
	const [totp, setTotp] = useState('');
	const [totpSecret, setTotpSecret] = useState('');
	const [secret, setSecret] = useState();
	const [visible, setVisible] = useState(false);

	const { confirm } = Modal;

	const getAvatarColor = name => {
		const firstLetter = name[0].toUpperCase();
		const asciiCode = firstLetter.charCodeAt(0);
		const hue = ((asciiCode - 65) * (360 / 26)) % 360; // 65 is ASCII code for 'A'
		return `hsl(${hue}, 100%, 30%)`; // Generate darker color using HSL
	};

	useEffect(() => {
		setPlaintext('');
		setSecret(props.secret);
		setEdit(false);
		let key = props.recovery ? props.recovery : props.keys.privateKey;
		encryption.decrypt([props.secret?.vault?.ciphertext, props.secret?.vault?.totp], key)
			.then((plainText) => {
				setPlaintext(plainText[0]);
				if (props.secret?.vault?.totp && plainText[1]) {
					setTotpSecret(plainText[1]);
					let otpObj = new TOTP({
						algorithm: 'SHA1',
						digits: 6,
						period: 30,
						secret: plainText[1] 
					});
					setTotp(otpObj.generate());

					setTimeout(() => {
						setTotp(otpObj.generate());
						
						setInterval(() => {
							setTotp(otpObj.generate());
						}, 2000);

					}, 10000);
				}
			})
			.catch((error) => {
				console.error(error);
			});
	}, [props.secret]);

	const deleteSecret = () => {
		confirm({
			title: 'Are you sure you want to continue?',
			icon: <ExclamationCircleFilled />,
			content: 'Once a password gets deleted it can not be recovered.',
			okText: 'Yes',
			okType: 'danger',
			onOk() {
				return new Promise((resolve, reject) => {
					Api.secret.delete(props.secret.folder, props.secret.id).then(result => {
						props.onDeleted(props.secret.id);
						resolve(result);
					}).catch(error => {
						reject(error);
					});
				}).catch((error) => console.error(error));
			},
			onCancel() { },
		});
	};

	if (!plaintext) {
		return <></>;
	}

	return (<>
		{edit ?
			<EditSecret
				openNotification={props.openNotification}
				secret={props.secret}
				user={props.user}
				localPassword={props.localPassword}
				organization={props.organization}
				keys={props.keys}
				onClose={() => setEdit(false)}
				onSaved={(returned) => {
					props.setSelectedSecret(returned);
					props.setSecrets(props.secrets.map((s) => {
						if (s.id === returned.id) {
							return returned;
						} else {
							return s;
						}
					}));
					props.openNotification('success', 'Operation successful', 'Password has been updated.');
					setEdit(false);
				}} /> : <></>}

		<div style={{ display: 'flex' }}>
			<div style={{ flex: 0, paddingTop: 2 }}><Avatar shape="square" size={28} style={{ backgroundColor: getAvatarColor(props.secret.name) }}>{props.secret.name?.substring(0, 1)}</Avatar> </div>
			<div style={{ flex: 2, paddingLeft: 8 }}><Typography.Title level={3}>{props.secret.name}</Typography.Title></div>
			<div style={{ flex: 1, alignContent: 'flex-end', display: 'flex' }}>
				<Space style={{ marginLeft: 'auto' }}>

					<Dropdown.Button
						disabled={props.recovery}
						onClick={() => setEdit(true)}
						menu={{
							items: [
								{ key: 'delete', label: 'Delete' }
							],
							disabled: props.recovery,
							onClick: (e) => {
								if (e.key === 'delete') {
									deleteSecret();
								}
							},
						}}
					>
						Edit
					</Dropdown.Button>
				</Space>
			</div>
		</div>
		<Tabs
			className='drag'
			defaultActiveKey="1"
			items={[{
				key: '1',
				label: 'Details',
				children: <>

					<Form
						className='drag'
						colon={false}
						id="form"
						labelCol={{ span: 5 }}
						wrapperCol={{ span: 19 }}
						autoComplete="off">

						<Form.Item label="URL" name="url" initialValue={secret.url}>
							<Input readOnly={!edit} disabled={!secret.url} suffix={!secret.url ? <></> : <Tooltip title="Copy to clipboard">
								<CopyOutlined
									onClick={() => copy(secret.url)}
								/>
							</Tooltip>} style={{ borderStyle: 'dashed' }} />
						</Form.Item>
						<Form.Item label="Username" name="username" initialValue={secret.username}>
							<Input readOnly={!edit} disabled={!secret.username} suffix={!secret.username ? <></> : <Tooltip title="Copy to clipboard">
								<CopyOutlined
									onClick={() => copy(secret.username)}
								/>
							</Tooltip>} style={{ borderStyle: 'dashed' }} />
						</Form.Item>
						<Form.Item label="Password" name="password" initialValue={plaintext}>
							<Input readOnly={!edit} maxLength={190} type={visible ? 'text' : 'password'} value={plaintext} suffix={<>
								<Tooltip title="Copy to clipboard">
									<CopyOutlined
										onClick={() => copy(plaintext)} 
									/>
								</Tooltip>
								<Tooltip title="Show/hide password">
									{visible ?
										<EyeInvisibleOutlined style={{ cursor: 'pointer' }} onClick={() => setVisible(false)} /> :
										<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => setVisible(true)} />
									}

								</Tooltip>
							</>
							} style={{ borderStyle: 'dashed' }} />

							{
								secret?.strength  >= 2 ? <></> : 
									<div style={{ marginTop: 5 }}>
										{ secret.strength === 0 ? <Alert showIcon type='error' message="Very Weak password!"/>: <></>}
										{ secret.strength === 1 ? <Alert showIcon type='warning' message="Weak password!"/>: <></>}
									</div>
							}
							
						</Form.Item>
						
						<Form.Item label="TOTP" rules={[{ required: true }]} initialValue={totp}>
							<Input readOnly={true} disabled={!totpSecret} maxLength={190} value={totp} suffix={!totpSecret ?<></> : <>
								<Tooltip title="Copy to clipboard" >
									<CopyOutlined
										onClick={() => {
											let code = new TOTP({
												secret: totpSecret,
												algorithm: 'SHA1',
												digits: 6,
												period: 30,
											}).generate();
											copy(code || '');
										}}
									/>
								</Tooltip>
							</>
							} style={{ borderStyle: 'dashed' }} />
						</Form.Item>
					</Form>
				</>
			},
			]} />
	</>
	);
}
