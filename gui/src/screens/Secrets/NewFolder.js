import api from '../../services/api';
import { Button, Drawer, Form, Input, Select, Space } from 'antd';

export default function NewFolder(props) {

	const save = (form) => {
		
		api.folder.add(form.name, form.groups).then(result => {
			props.onSaved(result);
		}).catch(error => {
			props.openNotification('error', 'Server error', 'An error happened while creating folder');
			console.error(error);
		});
	};

	return (
		<Form 
			id="form"
			labelCol={{ span: 4 }}
			wrapperCol={{ span: 20 }}
			autoComplete="off" 
			onFinish={save}>
			<Drawer
				className='no-drag'
				title="New folder"
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
				<Form.Item label="Groups" name="groups" rules={[{ required: true }]}>
					<Select mode="multiple" placeholder="Please select a folder">
						{props.groups?.map(group => <Select.Option key={group.id} value={group.id}>{group.name}</Select.Option>)}
					</Select>
				</Form.Item>
			</Drawer>
		</Form>
	);
}
