function passwordStrength(password) {
	// Check for digit, upper and lower case letters, special character and length
	const regexWeak = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/;
	const regexMedium = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{10,}$/;
	const regexStrong = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{12,}$/;

	if (regexStrong.test(password)) {
		return 3;
	} else if (regexMedium.test(password)) {
		return 2;
	} else if (regexWeak.test(password)) {
		return 1;
	} else {
		return 0;
	}
}

export default passwordStrength;