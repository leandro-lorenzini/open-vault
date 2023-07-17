import { useState } from 'react';
import api from '../../../services/api';
import { Button, Drawer, Form, Input, Select, Space, Table } from 'antd';

export default function EditFolder(props) {

	const [edit, setEdit] = useState(false);

	const save = (form) => {
		api.folder.update(props.folder.id, form.name, form.groups).then(() => {
			props.onSaved({
				id: props.folder.id,
				name: form.name,
				groups: form.groups
			});
		}).catch(error => {
			console.error(error);
		});
	};

	return (
		<Drawer
			className='no-drag'
			title={props.folder.name}
			placement={'right'}
			width={800}
			closable={false}
			onClose={props.onClose}
			open={true}
			extra={
				<Space>
					<Button onClick={props.onClose}>Close</Button>
					<Button type="primary" onClick={() => setEdit(true)}>
						Edit
					</Button>
				</Space>
			}>
			<h3>Vulnerabilities</h3>
			<Table 
				className="noWrapHeader"
				pagination={false}
				columns={[
					{
						title: 'Password name',
						key: 'name',
						dataIndex: 'name'
					},
					{
						title: 'Vulnerability',
						key: 'vulnerability',
						dataIndex: 'vulnerability'
					}
				]}
				dataSource={props.folder?.inaccessible?.map(secret => {
					return {
						name: secret.name,
						vulnerability: `The user(s) ${secret.vaults.map(vault => vault.user.name).join(', ')} no longer have access to this password but password was never changed since access has been revoked.`
					};
				})}
			/>

			{ edit ?
				<Form 
					id="form"
					labelCol={{ span: 5 }}
					wrapperCol={{ span: 19 }}
					autoComplete="off" 
					onFinish={save}>
					<Drawer
						className='no-drag'
						title="Edit folder"
						placement={'right'}
						width={500}
						closable={false}
						onClose={() => setEdit(false)}
						open={true}
						extra={
							<Space>
								<Button onClick={() => setEdit(false)}>Cancel</Button>
								<Button form="form" type="primary" htmlType="submit">
						Save
								</Button>
							</Space>
						}
					>
						<Form.Item label="Name" name="name" rules={[{ required: true }]} initialValue={props.folder.name}>
							<Input/>
						</Form.Item>
						<Form.Item label="Groups" name="groups" rules={[{ required: true }]} initialValue={props.folder.groups}>
							<Select mode="multiple" placeholder="Please select the access rights">
								{ props.groups.map(group => <Select.Option key={group.id} value={group.id}>{group.name}</Select.Option>)}
							</Select>
						</Form.Item>
					</Drawer>
				</Form>
				:<></>}
		</Drawer>

	);
}
