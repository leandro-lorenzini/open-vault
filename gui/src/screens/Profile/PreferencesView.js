import { Form, Typography, Select, Divider } from 'antd';
import { useState } from 'react';

export default function PreferencesView(props) {
	const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode'));


	function onChange(value) {
		setDarkMode(value);	
		props.setDarkModePreference(value);
		localStorage.setItem('darkMode', value);
	}

	return <div style={{ height: '100%', overflow: 'auto' }}>
		<div className='center' style={{ paddingTop: 20 }} >
			<div className='scrollable'>
				<Typography.Title level={3}>User preferences</Typography.Title>
				<Divider style={{ marginTop: 0, marginBottom: 15}}/>
				<Typography.Title level={5}>User interface</Typography.Title>
				<Form layout='vertical'>
					<Form.Item label='Dark mode' required>
						<Select 
							name="darkmode" 
							onChange={onChange} 
							defaultValue={darkMode}
							options={[
								{ value: 'auto', label: 'Automatic' },
								{ value: 'enabled', label: 'Enabled' },
								{ value: 'disabled', label: 'Disabled' }
							]}
						/>
					</Form.Item>
				</Form>
			</div>
		</div>
	</div>;
}