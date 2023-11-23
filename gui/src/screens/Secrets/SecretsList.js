
import { SearchOutlined, SyncOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { List, Avatar, Tag, Input, Row, Col, Badge } from 'antd';
import { useState } from 'react';

export default function SecretsList(props) {

	const [search, setSearch] = useState('');

	const getAvatarColor = name => {
		const firstLetter = name[0].toUpperCase();
		const asciiCode = firstLetter.charCodeAt(0);
		const hue = ((asciiCode - 65) * (360 / 26)) % 360;
		return `hsl(${hue}, 100%, 30%)`;
	};

	return (<div style={{ height: '100%', overflow: 'auto' }} className='scrollable'>
		
		<div style={{ textAlign: 'center', position: 'sticky', top: 0, zIndex: 1, padding: 5 }}>
			<Input
				placeholder="Search for a password"
				size="medium"
				className="search-input"
				suffix={ <SearchOutlined/>}
				onChange={(e) => {
					setSearch(e.target.value);
				}}
			/>
		</div>

		<List
			itemLayout="horizontal"
			dataSource={
				props.secrets
					.filter(secret => !props.selectedFolder || props.selectedFolder === secret.folder)
					.filter(secret => !search.length || secret.name.toLowerCase().includes(search.toLowerCase()))}
			renderItem={(item) => (

				<List.Item 
					onClick={() => props.setSelectedSecret(item)}
					className={props.darkMode ? 'listItem-dark':'listItem'}
					draggable={true}
					onDragStart={() => {
						props.setDragSecret(item);
						console.log(`Started dragging ${item}`);
					}}
					onDragEnd={() => {
						console.log(`Finished dragging ${item.id}`);
					}}
				>
					<List.Item.Meta
						avatar={
							<Badge count={item.strength < 2 ? "!":null}>
								<Avatar size={'small'} shape="square" style={{ backgroundColor: getAvatarColor(item.name?.substring(0, 1)) }}>
									{item.name?.substring(0, 1)}
								</Avatar>
							</Badge>}
						title={<Row justify="space-between">
							<Col>{item.name}</Col>
							<Col>
								{!item.vault?.ciphertext ? <Tag icon={<SyncOutlined spin />} color="processing">Syncing</Tag> : <></>}
								{item.vault?.ciphertext && item.vault.version !== item.version ? <Tag icon={<ClockCircleOutlined />} color="warning">Outdated</Tag> : <></>}
							</Col>
						</Row>}
					/>
				</List.Item>
			)}
		/></div>);
}