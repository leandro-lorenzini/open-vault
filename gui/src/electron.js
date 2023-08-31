const { app, BrowserWindow, nativeTheme, ipcMain, globalShortcut } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Client log location
// eslint-disable-next-line security/detect-non-literal-fs-filename
let logStream = fs.createWriteStream(path.join(os.homedir(), 'vault.log'), { flags: 'a' });

// Ignore certificate during development
if (isDev) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
	app.commandLine.appendSwitch('ignore-certificate-errors');
}

let popup;
let win;

function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 700,
		frame: process.platform !== 'darwin',
		transparent: process.platform == 'darwin',
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: true,
			preload: path.join(__dirname, 'preload.js')
		},
		trafficLightPosition: { x: 10, y: 13 },
		titleBarStyle: process.platform !== 'darwin' ? 'default' : 'hidden',
	});

	if (process.platform !== 'darwin') {
		win.setMenuBarVisibility(false);
	}

	win.loadURL(
		isDev
			? 'http://localhost:3000'
			: `file://${path.join(__dirname, '../build/index.html#/loading')}`
	);

	if (isDev) {
		win.webContents.openDevTools({ mode: 'detach' });
	}

	win.webContents.on('did-finish-load', () => {
		win.webContents.send('theme-update', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
	});

	nativeTheme.on('updated', () => {
		win.webContents.send('theme-update', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
	});
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
		globalShortcut.unregisterAll();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.whenReady().then(() => {
	// Used for SSO login
	ipcMain.on('open-popup', (event, url) => {
		createPopup(win, url);
	});
	ipcMain.on('close-popup', () => {
		if (popup) {
			popup.close();
			popup = null;
		}
	});

	// Saving console output to logs
	ipcMain.on('log-info', (event, content) => {
		let msg = `${new Date().toISOString()} [INFO]	${content}`;
		logStream.write(msg + '\n');
		process.stdout.write(msg + '\n');
	});

	ipcMain.on('log-error', (event, content) => {
		let msg = `${new Date().toISOString()} [ERROR]	${content}`;
		logStream.write(msg + '\n');
		process.stdout.write(msg + '\n');
	});

	ipcMain.handle('theme', () => {
		return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
	});

	// Used to read/write the private key to the disk
	ipcMain.on('write-file', (event, { fileName, content }) => {
		// eslint-disable-next-line security/detect-non-literal-fs-filename
		fs.writeFileSync(path.join(os.homedir(), fileName), content);
	});
	ipcMain.handle('read-file', (event, fileName) => {
		// eslint-disable-next-line security/detect-non-literal-fs-filename
		if (fs.existsSync(path.join(os.homedir(), fileName))) {
			return fs.readFileSync(path.join(os.homedir(), fileName), 'utf-8');
		} else {
			return '{}';
		}
	});

	if (!isDev) {
		globalShortcut.register('F5', () => {
			console.log('F5 is pressed');
		});

		globalShortcut.register('CommandOrControl+R', () => {
			console.log('CommandOrControl+R is pressed');
		});
	}
});

// Used for SSO login
function createPopup(parent, url) {
	popup = new BrowserWindow({
		width: 800,
		height: 600,
		parent: parent,
		webPreferences: {
			nodeIntegration: false,
		},
	});

	if (isDev) {
		popup.webContents.openDevTools({ mode: 'detach' });
	}

	// Load url in the new BrowserWindow
	popup.loadURL(url);
}
