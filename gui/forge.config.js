module.exports = {
	packagerConfig: {
		asar: true,
		icon: './public/icons/icon'
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {},
		},
		{
			name: '@electron-forge/maker-dmg',
			config: {
				format: 'ULFO'
			}
		},
		{
			name: "@electron-forge/maker-deb",
			config: {
				bin: 'OpenVault',
			},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {
				bin: 'OpenVault',
			},
		},
	],
	plugins: [
		{
			name: "@electron-forge/plugin-auto-unpack-natives",
			config: {},
		},
	],
};
