import { Button, Drawer, Form, Input, Select, Space, Table, Typography } from 'antd';
import Api from '../../../services/api';
import { useEffect, useState } from 'react';

export default function EditUser(props) {
	const [secrets, setSecrets] = useState([]);
	const [edit, setEdit] = useState(false);

	const save = (form) => {
		Api.user.update(props.user.id, form.name, form.email, form.groups, form.active).then(() => {
			props.onSaved({
				id: props.user.id,
				name: form.name,
				email: form.email,
				groups: form.groups,
				active: form.active
			});
		}).catch(error => {
			props.openNotification('error', 'Server error', 'An error happened wile updating user.');
			console.error(error);
		});
	};

	useEffect(() => {
		Api.secret.all(props.user.id).then(folders => {
			let secrets = [];
			for (let folder of folders) {
				for (let secret of folder.secrets) {
					secrets.push({
						name: secret.name,
						folder: folder.user ? 'Personal folder' : folder.name
					});
				}
			}
			setSecrets(secrets);
		});
	}, [props.user.id]);

	const columns = [
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name'
		},
		{
			title: 'Folder',
			dataIndex: 'folder',
			key: 'folder',
		}
	];

	return (

		<Drawer
			className='no-drag'
			title="User details"
			placement={'right'}
			width={500}
			closable={false}
			onClose={props.onClose}
			open={true}
			extra={
				<Space>
					<Button onClick={props.onClose}>Close</Button>
					<Button onClick={() => setEdit(true)}>
            Edit User
					</Button>
				</Space>
			}
		>

			<Typography.Title level={3}>Password visibility</Typography.Title>
			<Table columns={columns} dataSource={secrets} pagination={false} />


			{edit ?
				<Form
					id="form"
					labelCol={{ span: 5 }}
					wrapperCol={{ span: 19 }}
					autoComplete="off"
					onFinish={save}>
					<Drawer
						className='no-drag'
						title="Edit user"
						placement={'right'}
						width={500}
						closable={false}
						onClose={props.onClose}
						open={true}
						extra={
							<Space>
								<Button onClick={() => { setEdit(false); }}>Cancel</Button>
								<Button form="form" type="primary" htmlType="submit">
                  Save
								</Button>
							</Space>
						}
					>
						<Form.Item label="Name" name="name" rules={[{ required: true }]} initialValue={props.user.name}>
							<Input />
						</Form.Item>
						<Form.Item label="Email" name="email" rules={[{ required: true }]} initialValue={props.user.email}>
							<Input />
						</Form.Item>
						<Form.Item label="Groups" name="groups" rules={[{ required: true }]} initialValue={props.user.groups}>
							<Select mode="multiple" placeholder="Please select the access rights">
								{props.groups?.map(group => <Select.Option key={group.id} value={group.id}>{group.name}</Select.Option>)}
							</Select>
						</Form.Item>
						<Form.Item label="User state" name="active" rules={[{ required: true }]} initialValue={props.user.active ? true : false}>
							<Select placeholder="Please select the access rights">
								<Select.Option key={true} value={true}>Active</Select.Option>
								<Select.Option key={false} value={false}>Inactive</Select.Option>
							</Select>
						</Form.Item>
						<br />
					</Drawer>
				</Form> : <></>}

		</Drawer>
	);
}
