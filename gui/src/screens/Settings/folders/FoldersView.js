import { Button, Modal, Space, Table, Tag, Row, Col, Typography, Divider } from 'antd';
import { useEffect, useState } from 'react';
import { DeleteOutlined, ReloadOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import Api from '../../../services/api';
import EditFolder from './EditFolder';

export default function FoldersView(props) {
	const [edit, setEdit] = useState(false);
	const [folders, setFolders] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);

	const { confirm } = Modal;

	useEffect(() => {
		getFolders();
	}, []);

	const getFolders = () => {
		setFolders(null);
		Api.folder.all().then(folders => {
			setFolders(folders);
			Api.vault.inaccessible().then(result => {
				console.log(result);
				for (let item of result) {
					let data = folders.map(folder => {
						if (folder.id === item.id) {
							folder.inaccessible = item.secrets;
						}
						return folder;
					});
					setFolders(data);
				}
			}).catch(error => {
				console.error(error);
			});
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
			title: 'Groups',
			key: 'groups',
			dataIndex: 'groups',
			render: (_, { groups }) => (
				<>
					{groups?.map((group) => {
						return (
							<Tag key={group}>
								{props.organization.groups?.filter(g => g.id === group)[0]?.name.toUpperCase()}
							</Tag>
						);
					})}
				</>
			),
		},
		{
			title: 'Vulnerable secrets',
			dataIndex: 'inaccessible',
			key: 'inaccessible',
			render: (value) => {
				if (value) {
					return <>Ops</>;
				}
			}
		}
	];

	const onSelectChange = (newSelectedRowKeys) => {
		setSelectedRowKeys(newSelectedRowKeys);
	};

	const deleteFolder = () => {
		confirm({
			title: 'Are you sure you want to continue?',
			icon: <ExclamationCircleFilled />,
			content: <>
            You are about to delete {selectedRowKeys.length} folder(s).
            Once a folder gets deleted it can not be recovered.
			</>,
			okText: 'Confirm',
			okType: 'danger',
			onOk() {
				return new Promise((resolve) => {
					let deleted = [];
					for (let folderId of selectedRowKeys) {
						Api.organization.folder.delete(folderId).then(() => {
							deleted.push(folderId);
						}).catch(error => {
							console.error(error);
						});
					}
					setFolders(folders.filter(g => !deleted.includes(g.id)));
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
			<Typography.Title level={3}>Folders</Typography.Title>
			<Divider style={{ marginTop: 0, marginBottom: 15}}/>
			<div style={{ display: 'flex', marginBottom: 5 }}>
				<div style={{ flex: 1 }}>
					
				</div>
				<div style={{ flex: 1, textAlign: 'right' }}>
					<Space>
						<Button onClick={deleteFolder} danger type='dashed' icon={<DeleteOutlined />}>Delete</Button>
						<Button onClick={getFolders} icon={<ReloadOutlined />}>Refresh</Button>
					</Space>
				</div>
			</div>
			{edit ?
				<EditFolder
					folder={edit}
					groups={props.organization.groups}
					onClose={() => setEdit(false)}
					onSaved={(folder) => {
						setFolders(!folders ? []:folders?.map(f => f.id === folder.id ? folder:f));
						setEdit(false);
					}}
				/> : <></>}
			<div style={{ height: '60vh', overflow: 'auto'}}>
				<Table rowSelection={{
					selectedRowKeys,
					onChange: onSelectChange,
				}} columns={columns} rowKey={'id'} dataSource={folders ? folders:[]}/>
			</div>
		</Col>
	</Row>;
}