import { useState } from 'react';
import { FolderOpenOutlined, PlusOutlined, UnlockOutlined } from '@ant-design/icons';
import { Col, Row, FloatButton, notification } from 'antd';
import SecretDetails from './SecretDetails';
import NewSecret from './NewSecret';
import NewFolder from './NewFolder';
import SecretsList from './SecretsList';

export default function SecretsView(props) {
	const [NewPasswordModal, setNewPasswordModal] = useState(false);
	const [NewFolderModal, setNewFolderModal] = useState(false);

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	return (
		<Row style={{ height: '100%' }}>
			{notificationHolder}
			{NewPasswordModal ? <NewSecret 
				folders={props.folders} 
				user={props.user} 
				organization={props.organization}
				keys={props.keys}
				onClose={() => setNewPasswordModal(false)}
				onSaved={(secret) => {
					props.setSecrets(props.secrets.concat(secret));
					props.setSelectedFolder(secret.folder);
					props.setSelectedSecret(secret);
					setNewPasswordModal(false);
					openNotification('success', 'Operation successful', 'Password has been created.');
				}} /> : <></>}

			{NewFolderModal ? <NewFolder 
				openNotification={openNotification}
				folders={props.folders} 
				groups={props.organization?.groups} 
				onClose={() => setNewFolderModal(false)} 
				onSaved={(folder) => {
					props.setFolders(props.folders.concat(folder));
					setNewFolderModal(false);
					openNotification('success','Operation successful', 'Folder has been created');
				}} /> : <></>}

			{ !props.recovery ?
				<FloatButton.Group shape="circle" style={{ right: 35 }} type="primary" trigger="hover" icon={<PlusOutlined />}>
					<FloatButton icon={<UnlockOutlined />} tooltip={<div>New password</div>} onClick={() => setNewPasswordModal(true)} />
					<FloatButton icon={<FolderOpenOutlined />} tooltip={<div>New folder</div>} onClick={() => setNewFolderModal(true)} />
				</FloatButton.Group>:<></>
			}

			<Col 
				span={10} 
				className='drag'
				style={{
					borderTop: '1px solid rgba(5, 5, 5, 0.06)',
					height: '100%',
					display: 'block',
					padding: 10,
				}}>
				<SecretsList 
					darkMode={props.darkMode} setDragSecret={props.setDragSecret}
					secrets={props.secrets} setSelectedSecret={props.setSelectedSecret} selectedFolder={props.selectedFolder}/>
			</Col>

			<Col span={14} 
				style={{ 
					padding: 20, 
					backgroundColor: props.darkMode ? 'rgb(34,34,34)':'rgb(235, 235, 235)'
				}}>
				{(props.selectedSecret?.vault?.ciphertext) ?
					<SecretDetails 
						openNotification={openNotification}
						recovery={props.recovery}
						keys={props.keys} 
						secret={props.selectedSecret} 
						secrets={props.secrets} 
						key={props.selectedSecret.id}
						setSelectedSecret={props.setSelectedSecret} 
						user={props.user} organization={props.organization}  
						localPassword={props.localPassword} 
						setSecrets={props.setSecrets}
						onDeleted={(id) => {
							props.setSecrets(props.secrets.filter(s => s.id !== id));
							props.setSelectedSecret({});
						}} /> : <></>}
			</Col>

		</Row>
	);
}
