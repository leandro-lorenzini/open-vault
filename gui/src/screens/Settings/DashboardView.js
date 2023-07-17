import { Table, Tag, Row, Col, Typography, Alert, Divider } from 'antd';
import { useEffect, useState } from 'react';
import Api from '../../services/api';

export default function DashboardView() {
	const [inaccessible, setInaccessible] = useState([]);
	const [weak, setWeak] = useState([]);
	const [old, setOld] = useState([]);

	useEffect(() => {
		getInaccessible();
		getWeak();
		getOld();
	}, []);

	const getInaccessible = () => {
		Api.vault.inaccessible()
			.then((secrets) => {
				setInaccessible(secrets);
			})
			.catch((error) => {
				console.error(error);
			});
	};

	const getWeak = () => {
		Api.secret.weak()
			.then((secrets) => {
				setWeak(secrets);
			})
			.catch((error) => {
				console.error(error);
			});
	};

	const getOld = () => {
		Api.secret.old()
			.then((secrets) => {
				setOld(secrets);
			})
			.catch((error) => {
				console.error(error);
			});
	};

	function calculateAgeInDays(date) {
		let today = new Date();
		let birthDate = new Date(date);
		let differenceInTime = today.getTime() - birthDate.getTime();
	
		// Convert difference in milliseconds to days
		let differenceInDays = differenceInTime / (1000 * 3600 * 24);
	
		return Math.floor(differenceInDays);
	}
	
	console.log(calculateAgeInDays("1990-01-01")); // replace with the date you want to calculate age for
	

	const columnsInacessible = [
		{
			// eslint-disable-next-line sonarjs/no-duplicate-string
			title: 'Password Name',
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: 'Folder',
			dataIndex: 'folder',
			key: 'folder',
		},
		{
			title: 'Users',
			dataIndex: 'users',
			key: 'users',
			render: (_, { users }) => (
				<>
					{users.map((user) => {
						return (
							<Tag key={user}>
								{user}
							</Tag>
						);
					})}
				</>
			),
		}
	];

	const columnsWeak = [
		{
			title: 'Password Name',
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: 'Folder',
			dataIndex: 'folderName',
			key: 'folder',
			render: (_, { folderName, userName }) => (
				<>
					{ userName ? `${userName}'s Personal folder` : folderName }
				</>
			),
		},
		{
			title: 'Owner',
			dataIndex: 'userEmail',
			key: 'Owner',
			render: (_, { userEmail }) => (
				<>
					{ userEmail ? userEmail : 'Organization' }
				</>
			),
		},
		{
			title: 'Strength',
			dataIndex: 'strength',
			key: 'strength',
			render: (_, { strength }) => (

				<Tag color={strength ? 'orange':'red'} key={strength}>
					{ strength ? 'Weak' : 'Very weak' }
				</Tag>
			),
		}
	];

	const columnsOld = [
		{
			title: 'Password Name',
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: 'Folder',
			dataIndex: 'folderName',
			key: 'folder',
			render: (_, { folderName, userEmail }) => (
				<>
					{ userEmail ? 'Personal folder' : folderName }
				</>
			),
		},
		{
			title: 'Owner',
			dataIndex: 'userEmail',
			key: 'Owner',
			render: (_, { userEmail }) => (
				<>
					{ userEmail ? userEmail : 'Organization' }
				</>
			),
		},
		{
			title: 'Password age',
			dataIndex: 'lastUpdated',
			key: 'lastUpdated',
			render: (_, { lastUpdated }) => (
				<>
					{ calculateAgeInDays(lastUpdated) } days
				</>
			),
		}
	];

	return <div  style={{ height: '100%', overflow: 'auto' }}> 
		<Row className='scrollable'>
			<Col span={24} style={{
				padding: 20,
				height: '100%',
				overflow: 'auto'
			}}>
				<Typography.Title level={3}>Security dashboard</Typography.Title>
				<Divider style={{ marginTop: 0, marginBottom: 15}}/>
				<Row>
					<Col span={8} style={{ padding: 10, paddingBottom: 20 }}>
						<Alert
							message={<div style={{marginTop: -4}}>Exposed passwords: {inaccessible.length}</div>}
							description='Access to password has been revoked from one or more user but password remains unchanged.'
							type={inaccessible.length ? 'error':'success'}
							showIcon
						/>
					</Col>
					<Col span={8} style={{ padding: 10 }}>
						<Alert
							message={<div style={{marginTop: -4}}>Weak passwords: {weak.length}</div>}
							description='Passwords with 8 characters or less and possibly without digits and special characters.'
							type={weak.length ? 'warning':'info'}
							showIcon
						/>
					</Col>
					<Col span={8} style={{ padding: 10 }}>
						<Alert
							message={<div className='alert-dashboard'>Old passwords: {old.length}</div>}
							description='Passwords with more than 8 characters but without digits or special characters.'
							type={old.length ? 'warning':'info'}
							showIcon
						/>
					</Col>
				</Row>

				{<Typography.Title level={3}>Need to Know rule violation</Typography.Title>}
				<Table 
					columns={columnsInacessible} 
					dataSource={inaccessible ? inaccessible : []} 
					rowKey={'id'}
				/>
				
				{<Typography.Title level={3}>Weak passwords</Typography.Title>}
				<Table 
					columns={columnsWeak} 
					dataSource={weak ? weak : []} 
					rowKey={'id'}
				/>

				{<Typography.Title level={3}>Old passwords</Typography.Title>}
				<Table 
					columns={columnsOld} 
					dataSource={old ? old : []} 
					rowKey={'id'}
				/>
			</Col>
		</Row>
	</div>;
}