import { Button, Modal, Space, Table, Row, Col, Typography, notification, Divider } from 'antd';
import { useEffect, useState } from 'react';
import { DeleteOutlined, ReloadOutlined, UsergroupAddOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import NewGroup from './NewGroup';
import Api from '../../../services/api';
import EditGroup from './EditGroup';

export default function GroupsView() {
	const [showNewGroup, setShowNewGroup] = useState(false);
	const [edit, setEdit] = useState(false);
	const [groups, setGroups] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	const { confirm } = Modal;

	useEffect(() => {
		getGroups();
	}, []);

	const getGroups = () => {
		setGroups(null);
		Api.organization.get().then(organization => {
			setGroups(organization.groups);
		}).catch(error => {
			console.error(error);
		});
	};

	const columns = [
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
			render: (text, row) => <span className='link' onClick={() => setEdit(row)}>{text}</span>,
		},
		{
			title: 'Administrator',
			dataIndex: 'admin',
			key: 'admin',
			render: (text) => !text || text === 'false' ? <>No</> : <>Yes</>,
		}
	];

	const onSelectChange = (newSelectedRowKeys) => {
		setSelectedRowKeys(newSelectedRowKeys);
	};

	const deleteGroup = () => {
		confirm({
			title: 'Are you sure you want to continue?',
			icon: <ExclamationCircleFilled />,
			content: <>
            You are about to delete {selectedRowKeys.length} group(s).
            Once a group gets deleted it can not be recovered.
			</>,
			okText: 'Confirm',
			okType: 'danger',
			onOk() {
				return new Promise((resolve) => {
					let deleted = [];
					for (let groupId of selectedRowKeys) {
						Api.organization.group.delete(groupId).then(() => {
							deleted.push(groupId);
						}).catch(error => {
							console.error(error);
						});
					}
					setGroups(groups.filter(g => !deleted.includes(g.id)));
					resolve();
				}).catch((error) => console.error(error));
			},
			onCancel() { },
		});
	};

	return <Row>
		<Col span={24} style={{
			padding: 20,
			height: '100%',
			overflow: 'auto'
		}}>
			{ notificationHolder }
			<Typography.Title level={3}>Groups</Typography.Title>
			<Divider style={{ marginTop: 0, marginBottom: 15}}/>
			<div style={{ display: 'flex', marginBottom: 5 }}>
				<div style={{ flex: 1 }}>
					
				</div>
				<div style={{ flex: 1, textAlign: 'right' }}>
					<Space>
						<Button onClick={deleteGroup} danger type='dashed' icon={<DeleteOutlined />}>Delete</Button>
						<Button onClick={getGroups} icon={<ReloadOutlined />}>Refresh</Button>
						<Button onClick={() => setShowNewGroup(true)} type='primary' icon={<UsergroupAddOutlined />}>New group</Button>
					</Space>
				</div>
			</div>
			{showNewGroup ?
				<NewGroup
					openNotification={openNotification}
					onClose={() => setShowNewGroup(false)}
					onSaved={(group) => {
						setGroups([...groups, group]);
						setShowNewGroup(false);
						openNotification('success', 'Operation sucessful', 'Group has been created.');
					}}
				/> : <></>}
			{edit ?
				<EditGroup
					openNotification={openNotification}
					group={edit}
					onClose={() => setEdit(false)}
					onSaved={(group) => {
						setGroups(!groups ? []:groups?.map(g => g.id === group.id ? group:g));
						setEdit(false);
						openNotification('success', 'Operation sucessful', 'Group has been saved.');
					}}
				/> : <></>}
			<div style={{ height: '60vh', overflow: 'auto'}}>
				<Table rowSelection={{
					selectedRowKeys,
					onChange: onSelectChange,
				}} columns={columns} rowKey={'id'} dataSource={groups ? groups:[]}/>
			</div>
		</Col>
	</Row>;
}