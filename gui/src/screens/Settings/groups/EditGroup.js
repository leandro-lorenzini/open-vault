import api from '../../../services/api';
import { Button, Drawer, Form, Input, Select, Space } from 'antd';

export default function EditGroup(props) {

	const save = (form) => {
		api.organization.group.update(props.group.id, form.name, form.admin).then(() => {
			props.onSaved({
				id: props.group.id,
				name: form.name,
				admin: form.admin
			});
		}).catch(error => {
			props.openNotification('error', 'Server error', 'Error while saving group');
			console.error(error);
		});
	};

	return (
		<Form 
			id="form"
			labelCol={{ span: 5 }}
			wrapperCol={{ span: 19 }}
			autoComplete="off" 
			onFinish={save}>
			<Drawer
				className='no-drag'
				title="Edit group"
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
				<Form.Item label="Name" name="name" rules={[{ required: true }]} initialValue={props.group.name}>
					<Input/>
				</Form.Item>
				<Form.Item label="User rights" name="admin" rules={[{ required: true }]} initialValue={props.group.admin}>
					<Select placeholder="Please select the access rights">
						<Select.Option value={false}>Standard user rights</Select.Option>
						<Select.Option value={true}>Administrator user rights</Select.Option>
					</Select>
				</Form.Item>
			</Drawer>
		</Form>
	);
}
