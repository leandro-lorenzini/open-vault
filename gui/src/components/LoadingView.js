import { Typography } from "antd";

export default function LoadingView(props) {
	return (
		<div style={{ textAlign: 'center' }}>
			<img src={props.darkMode ? "/icons/icon-white.png":"/icons/icon.png"} width={70}/>
			<Typography.Title>Open-Vault</Typography.Title>
			<Typography.Text level={4}>Loading...</Typography.Text>
		</div>
	);
}
