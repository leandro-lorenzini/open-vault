import { Table, Tag, Space, Button, Row, Col, Typography, notification, Divider } from 'antd';
import { useEffect, useState } from 'react';
import { ReloadOutlined, UserAddOutlined } from '@ant-design/icons';

import EditUser from './EditUser';
import Api from '../../../services/api';
import NewUser from './NewUser';

export default function UsersView(props) {
	const [edit, setEdit] = useState(false);
	const [users, setUsers] = useState(null);
	const [showNewUser, setShowNewUser] = useState(false);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);

	const [notificationApi, notificationHolder] = notification.useNotification();

	const openNotification = (type, message, description) => {
		// eslint-disable-next-line security/detect-object-injection
		notificationApi[type]({
			message: message,
			description: description,
		});
	};

	useEffect(() => {
		getUsers();
	}, []);

	const getUsers = () => {
		Api.user.all()
			.then((users) => {
				setUsers(users);
			})
			.catch((error) => {
				console.error(error);
			});
	};

	const onSelectChange = (newSelectedRowKeys) => {
		console.log('selectedRowKeys changed: ', newSelectedRowKeys);
		setSelectedRowKeys(newSelectedRowKeys);
	};

	const columns = [
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
			render: (text, row) => <span className='link' onClick={() => setEdit(row)}>{text}</span>,
		},
		{
			title: 'Email',
			dataIndex: 'email',
			key: 'email',
		},
		{
			title: 'Groups',
			key: 'groups',
			dataIndex: 'groups',
			render: (_, { groups }) => (
				<>
					{groups.map((group) => {
						return (
							<Tag key={group}>
								{props.organization?.groups?.filter(g => g.id === group)[0]?.name.toUpperCase()}
							</Tag>
						);
					})}
				</>
			),
		},
		{
			title: 'Authentication',
			dataIndex: 'sso',
			key: 'sso',
			render: (sso) => sso ? 'SSO' : 'Local'
		},
		{
			title: 'State',
			dataIndex: 'active',
			key: 'active',
			render: (active) => active ? 
				<Tag color='success'>Active</Tag> : 
				<Tag color='warning'>Inactive</Tag>
		},
	];

	return <Row>
		<Col span={24} style={{
			padding: 20,
			height: '100%',
			overflow: 'auto'
		}}>
			{ notificationHolder }
			<Typography.Title level={3}>Users</Typography.Title>
			<Divider style={{ marginTop: 0, marginBottom: 15}}/>

			<div style={{ display: 'flex', marginBottom: 10 }}>
				<div style={{ flex: 1 }}>

				</div>
				<div style={{ flex: 1, textAlign: 'right' }}>
					<Space>
						<Button onClick={getUsers} icon={<ReloadOutlined />}>Refresh</Button>
						<Button onClick={() => setShowNewUser(true)} type='primary' icon={<UserAddOutlined />}>New user</Button>
					</Space>
				</div>
			</div>

			{showNewUser ?
				<NewUser
					openNotification={openNotification}
					groups={props.organization.groups}
					onClose={() => setShowNewUser(false)}
					onSaved={(user) => {
						setUsers([...users, user]);
						setShowNewUser(false);
						openNotification('success', 'Operation successful', 'New user has been created and activation email sent.');
					}}
				/> : <></>}

			{edit ?
				<EditUser
					openNotification={openNotification}
					user={edit}
					groups={props.organization.groups}
					onClose={() => setEdit(false)}
					onSaved={(user) => {
						setUsers([...users.map(u => u.id === user.id ? user : u)]);
						setEdit(false);
						openNotification('success', 'Operation successful', 'User has been updated.');
					}}
				/> : <></>}

			<Table columns={columns} dataSource={users ? users : []} rowSelection={{
				selectedRowKeys,
				onChange: onSelectChange,
			}} rowKey={'id'} />
		</Col>
	</Row>;
}