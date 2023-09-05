import { Button, Space, Typography } from "antd";

export default function VersionMismatchView(props) {

	function changeServer() {
		props.setup();
	}

	function download() {
		window.open(localStorage.getItem('serverAddress'));
	}

	return (
		<div>
			<Typography.Title level={2}>Your are using the wrong application version</Typography.Title>
			<Typography.Title level={4}>
                It looks like your have installed the application version {process.env.REACT_APP_VERSION} which is not supported by your organization.
			</Typography.Title>
			<Typography.Paragraph style={{ marginTop: 0 }}>
                Please, download and install the correct version or change the server addrress if it has been changed.
			</Typography.Paragraph>
			<Space>
				<Button onClick={download} type="primary">Go to Download page</Button>
				<Button onClick={changeServer} type="dashed">Change server address</Button>
			</Space>
		</div>
	);
}
