import { Button, Drawer, Form, Input, Select, Space } from 'antd';
import Api from '../../../services/api';

export default function NewUser(props) {

	const save = (form) => {
		Api.user.add(form.name, form.email, form.groups).then(result => {
			props.onSaved({
				id: result.id,
				name: result.name,
				email: result.email,
				groups: result.groups
			});
		}).catch(error => {
			props.openNotification('error', 'Server error', 'An error happened wile creating user.');
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
				title="Add user"
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
					<Input/>
				</Form.Item>
				<Form.Item label="Email" name="email" rules={[{ required: true }]}>
					<Input/>
				</Form.Item>
				<Form.Item label="Groups" name="groups" rules={[{ required: true }]}>
					<Select mode="multiple" placeholder="Please select the access rights">
						{ props.groups?.map(group => <Select.Option key={group.id} value={group.id}>{group.name}</Select.Option>)}
					</Select>
				</Form.Item>
			</Drawer>
		</Form>
	);
}
