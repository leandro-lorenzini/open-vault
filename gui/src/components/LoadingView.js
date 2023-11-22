import { Typography } from "antd";
import icon from "./icon.png";
import iconWhite from "./icon-white.png";

export default function LoadingView(props) {
	return (
		<div style={{ textAlign: 'center' }}>
			<img src={props.darkMode ? iconWhite:icon} width={70}/>
			<Typography.Title>Open-Vault</Typography.Title>
			<Typography.Text level={4}>Loading...</Typography.Text>
		</div>
	);
}
