import { Button, Space, Typography } from "antd";
import { useEffect } from "react";
import Api from "../services/api";
import { DisconnectOutlined } from '@ant-design/icons';

export default function ConnectionErrorView(props) {

	function retry() {
		Api.auth.isAuthenticated().then(user => {
			if (user) {
				props.setUser(user);
				props.setConnectionError(false);
			} else {
				props.setUser(null);
				props.setAuthenticated(false);
				props.setConnectionError(false);
			}
		}).catch((error) => {
			console.log(error);
		});
	}

	useEffect(() => {
		let interval = setInterval(retry, 10000);
		return(() => {
			clearInterval(interval);
		});
	});

	return (
		<div>
			<Typography.Title level={2}>
				<DisconnectOutlined style={{ marginRight: 10}} />
				Server unreachable
			</Typography.Title>
			<Typography.Title level={4}>
                It looks like we cannot connect to the server.
			</Typography.Title>
			<Typography.Paragraph style={{ marginTop: 0 }}>
				You might have lost internet connection or the OpenVault server is having some issue.
                We will try again in a few seconds, please check your internet
                connection in the meantime.
			</Typography.Paragraph>
			<Space>
				<Button type="default" onClick={retry}>Retry now</Button>
			</Space>
		</div>
	);
}
