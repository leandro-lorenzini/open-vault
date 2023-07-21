import { Typography } from "antd";
import { useEffect } from "react";
import Api from "../services/api";

export default function ConnectionErrorView(props) {

	useEffect(() => {
		let interval = setInterval(() => {
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
		}, 10000);

		return(() => {
			clearInterval(interval);
		});
	});

	return (
		<div>
			<Typography.Title level={2}>You are offline</Typography.Title>
			<Typography.Title level={4}>
                It looks like we cannot connect to the server.
			</Typography.Title>
			<Typography.Title level={5} style={{ marginTop: 0 }}>
                We will try again in a few seconds, please check your internet
                connection in the meantime.
			</Typography.Title>
		</div>
	);
}
