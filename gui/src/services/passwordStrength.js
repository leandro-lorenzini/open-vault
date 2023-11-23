function passwordStrength(password) {
	let points = 0;

	// Check for password length
	if (password.length > 12) {
		points+=1.5;
	} else if (password.length > 10) {
		points+=1;
	}
	

	// Check for special characters
	if (/[^a-zA-Z0-9]/.test(password)) {
		points+=0.5;
	}

	// Check for numbers
	if (/[0-9]/.test(password)) {
		points+=0.5;
	}

	// Check for uppercase and lowercase
	if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
		points+=0.5;
	}

	// Check for some know numeric patterns
	let patterns = /(1234|4321|1111|2222|3333|4444|5555|6666|7777|8888|9999|0000)/;
	if (patterns.test(password)) {
		points-=1.5;
	}

	// Check for some know text patterns
	patterns = /(Password|passwd|passw0rd|admin|qazwsx|abcd|qwer|asdf|zxcv)/i;
	if (patterns.test(password)) {
		points-=1.5;
	}

	return Math.floor(points) >= 0 ? 
		Math.floor(points) : 0;
}

export default passwordStrength;