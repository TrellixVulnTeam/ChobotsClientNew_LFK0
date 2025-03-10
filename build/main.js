"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Electron = __importStar(require("electron"));
const app = Electron.app;
const shell = Electron.shell;
const dialog = Electron.dialog;
const globalShortcut = Electron.globalShortcut;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const DiscordRPC = __importStar(require("discord-rpc"));
const electron_store_1 = __importDefault(require("electron-store"));
const electron_updater_1 = require("electron-updater");
const windowState_1 = require("./lib/windowState");
const clubWindow_1 = require("./lib/clubWindow");
const rootDir = __dirname.replace(new RegExp('build$'), '');
//autoUpdater.autoDownload = false;
const logger = require("electron-log");
electron_updater_1.autoUpdater.logger = logger;
logger.transports.file.level = "debug";
// TODO: load this from a json file or something
let branding = {
    name: 'Chobots',
    iconPath: rootDir + '/build/icon.png',
    nutsUrl: 'https://get.chobots.world',
    rpcClientId: '930243959463239730',
    rpcDetails: '🔗 chotopia.us',
    rpcLargeImage: 'chotopia',
    rpcLargeImageText: 'Chotopia ' + app.getVersion(),
    rpcSmallImage: 'small3',
    rpcSmallImageText: undefined
};
// keep global reference of main window so gc doesn't throw it out
let mainWindow;
let modPanelWindow;
// check we are the only instance of club
const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock)
    app.quit();
else {
    app.on('second-instance', () => {
        // focus our main window if another instance tries to open
        if (mainWindow) {
            if (mainWindow.browser.isMinimized())
                mainWindow.browser.restore();
            mainWindow.browser.focus();
        }
    });
}
// set up ElectronStore *after* checking we're the only instance
const store = new electron_store_1.default({ defaults: { agreedToTerms: false, modPanelEnabled: false } });
store.set('modPanelEnabled', false);
// figure out which pepper flash to use
let flashPluginPath;
switch (process.platform) {
    case 'win32':
        flashPluginPath = 'flashPlugin/pepperFlash64.dll'; // original filename pepflashplayer64_32_0_0_303.dll
        break;
    case 'darwin':
        flashPluginPath = 'flashPlugin/pepperFlash.plugin'; // original filename PepperFlashPlayer.plugin
        break;
    case 'linux':
        app.commandLine.appendSwitch('no-sandbox'); // we have to do this for flash to work for some reason
        flashPluginPath = 'flashPlugin/pepperFlash.so';
        break;
    default:
        app.on('ready', () => {
            dialog.showMessageBoxSync({
                icon: Electron.nativeImage.createFromPath(branding.iconPath),
                message: 'Sorry, we couldn\'t find a Flash Player plugin for your operating system.',
                type: 'error',
                title: branding.name + ' crashed'
            });
            app.quit();
        });
        flashPluginPath = 'flashPlugin/yoMama.gaming'; // FIXME: this sucks. can i make it nothing? or could that break shit (load self as a plugin??? because use __dirname later)
        break;
}
app.commandLine.appendSwitch('ppapi-flash-path', path.join(rootDir, flashPluginPath));
function openModPanel() {
    modPanelWindow = new clubWindow_1.ClubWindow(branding.name + ' Mod Panel', branding.iconPath, 'none', new windowState_1.PageState('https://chobots.world/play'), 950, 575);
}
function startup() {
    mainWindow = new clubWindow_1.ClubWindow(branding.name, branding.iconPath, 'none', new windowState_1.PageState('about:blank'), 950, 575);
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    const ret3 = globalShortcut.register('num1', () => {
        mainWindow.browser.webContents.openDevTools({ mode: 'undocked' });
    });
    function setRpc(rpc, state) {
        rpc.setActivity({
            details: branding.rpcDetails,
            //state: state,
            startTimestamp: rpcStartTimestamp,
            largeImageKey: branding.rpcLargeImage,
            largeImageText: branding.rpcLargeImageText,
            smallImageKey: branding.rpcSmallImage,
            smallImageText: branding.rpcSmallImageText
        }).catch(console.error);
    }
    // Discord game presence
    function updateRpc(rpc) {
        /*let stateText = branding.rpcState;

        let appPath = app.getPath("userData");
        let sharedObjectsPath = path.join(appPath + '/Pepper Data/Shockwave Flash/WritableRoot/#SharedObjects/');
        console.log('0' + sharedObjectsPath);
        if (fs.existsSync(sharedObjectsPath)) {
            let sharedObjectsLs = fs.readdirSync(sharedObjectsPath);
            console.log('1' + sharedObjectsLs.toString())
            if (sharedObjectsLs.length != 0) {
                let choPath = path.join(sharedObjectsPath + sharedObjectsLs[0] + '/chotopia.us/game12/SecuredMainShadow.swf/settings.sol');
                console.log('2' + choPath)
                if (fs.existsSync(choPath)) {
                    console.log('4')
                    let amfData = fs.readFileSync(choPath);
                    mainWindow.webContents.send('parseAmf', amfData);
                } else {
                    setRpc(rpc, 'Unknown player');
                }
            } else {
                setRpc(rpc, 'Unknown player');
            }
        } else {
            setRpc(rpc, 'Unknown player');
        }*/
        setRpc(rpc, 'Chotopia ' + app.getVersion());
    }
    DiscordRPC.register(branding.rpcClientId);
    let rpc = new DiscordRPC.Client({ transport: 'ipc' });
    let rpcStartTimestamp = new Date();
    rpc.on('ready', () => {
        updateRpc(rpc);
        setInterval(() => { updateRpc(rpc); }, 15000);
    });
    rpc.login({ clientId: branding.rpcClientId }).catch(console.error);
    mainWindow.browser.on('closed', () => {
        app.quit();
    });
    electron_updater_1.autoUpdater.on('update-downloaded', () => {
        mainWindow.webviewContents?.send('Download finished.');
        const dialogOpts = {
            type: 'info',
            buttons: ['Restart', 'Not Now. On next Restart'],
            title: 'Update',
            message: process.platform === 'win32' ? "Update" : "",
            detail: 'A new version has been downloaded. Restart now to complete the update.'
        };
        Electron.dialog.showMessageBox(mainWindow.browser, dialogOpts).then((returnValue) => {
            if (returnValue.response === 0)
                electron_updater_1.autoUpdater.quitAndInstall();
        });
    });
    electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
        function getMbs(bytes) {
            var i = -1;
            var byteUnits = [' kb', ' Mb', ' Gb', ' Tbps', 'Pbps', 'Ebps', 'Zbps', 'Ybps'];
            do {
                bytes = bytes / 1024;
                i++;
            } while (bytes > 1024);
            return Math.max(bytes, 0.1).toFixed(1) + byteUnits[i];
        }
        /*let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';*/
        let log_message = `Download speed: ${getMbs(progressObj.bytesPerSecond)}ps - Downloaded ${Math.round(progressObj.percent)}% (${getMbs(progressObj.transferred)}/${getMbs(progressObj.total)}) `;
        mainWindow.webviewContents?.send('updater', log_message);
    });
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        mainWindow.navigate(path.join(rootDir, 'pages/updater.html'));
        mainWindow.buttons = 'none';
        mainWindow.webviewContents?.send('Update available');
    });
    electron_updater_1.autoUpdater.on('error', (error) => {
        console.log("error: " + error);
    });
    var UpdateNotAvailable = false;
    electron_updater_1.autoUpdater.on('update-not-available', (info) => {
        UpdateFinished();
    });
    function UpdateFinished() {
        if (store.get('agreedToTerms')) {
            mainWindow.navigate('https://chobots.world/fullscreen');
            mainWindow.buttons = 'ingame';
        }
        else
            mainWindow.navigate(path.join(rootDir + 'pages/agree.html'));
        if (store.get('modPanelEnabled'))
            openModPanel();
    }
    mainWindow.browser.webContents.on('ipc-message', (event, channel, ...args) => {
        switch (channel) {
            case "containerIsReady":
                mainWindow.navigate(path.join(rootDir, 'pages/updater.html'));
                mainWindow.buttons = 'none';
                setTimeout(() => {
                    if (!Electron.app.isPackaged) {
                        UpdateFinished();
                    }
                    mainWindow.webviewContents?.send('updater', "Checking for updates");
                    mainWindow.webviewContents?.on('ipc-message', (event, channel, ...args) => {
                        switch (channel) {
                            case "agreePage":
                                switch (args[0]) {
                                    case "agree":
                                        store.set('agreedToTerms', true);
                                        mainWindow.navigate('https://chobots.world/fullscreen');
                                        mainWindow.buttons = 'ingame';
                                        break;
                                    case "disagree":
                                        store.set('agreedToTerms', false);
                                        app.quit();
                                        break;
                                }
                                break;
                            default:
                                console.log(channel);
                                break;
                        }
                    });
                }, 200); // FIXME: dumb way to avoid race condition. fix by moving this out and having ClubWindow have an event for when window.webviewContents isnt undefined
                break;
            default:
                break;
        }
    });
}
app.commandLine.appendSwitch('enable-transparent-visuals');
if (os.platform() == 'linux') {
    console.log('we are on linux');
    app.disableHardwareAcceleration(); // We need to do this for transparency to work
    app.on('ready', () => {
        setTimeout(startup, 500); // This is also needed for transparency
    });
}
else {
    app.on('ready', startup);
}
