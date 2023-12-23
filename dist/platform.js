"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectroluxDevicesPlatform = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const settings_1 = require("./settings");
const axios_1 = require("./services/axios");
const devices_1 = require("./const/devices");
const apiKey_1 = require("./const/apiKey");
const gigya_1 = __importDefault(require("gigya"));
const accessory_1 = require("./accessories/accessory");
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
class ElectroluxDevicesPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.accessories = [];
        this.auth = {
            user: {
                accessToken: '',
                refreshToken: '',
                tokenExpirationDate: 0,
            },
        };
        this.pollingInterval = null;
        this.authFile = path_1.default.join(api.user.storagePath(), '.electroluxDevices.json');
        if (fs_1.default.existsSync(this.authFile)) {
            try {
                this.log.debug('Loading auth from cache...');
                const data = fs_1.default.readFileSync(this.authFile, 'utf8');
                const auth = JSON.parse(data);
                this.auth = auth;
            }
            catch (e) {
                this.log.warn('Could not load auth from cache!');
            }
        }
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', async () => {
            if (this.shouldRefreshAccessToken()) {
                await this.refreshAccessToken();
            }
            else if (this.auth.user.accessToken === '') {
                await this.signIn();
            }
            else {
                this.log.info('Using cached access token...');
            }
            // run the method to discover / register your devices as accessories
            await this.discoverDevices();
            this.pollingInterval = setInterval(this.pollStatus.bind(this), (this.config.pollingInterval || 10) * 1000);
        });
        this.api.on('shutdown', () => {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }
        });
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(new accessory_1.ElectroluxAccessory(accessory));
    }
    async signIn() {
        var _a, _b;
        this.log.info('Signing in to Electrolux...');
        try {
            const gigya = new gigya_1.default(apiKey_1.ACCOUNTS_API_KEY, 'eu1');
            const loginResponse = await gigya.accounts.login({
                loginID: this.config.email,
                password: this.config.password,
                targetEnv: 'mobile',
            });
            const jwtResponse = await gigya.accounts.getJWT({
                targetUID: loginResponse.UID,
                fields: 'country',
                oauth_token: (_a = loginResponse.sessionInfo) === null || _a === void 0 ? void 0 : _a.sessionToken,
                secret: (_b = loginResponse.sessionInfo) === null || _b === void 0 ? void 0 : _b.sessionSecret,
            });
            const response = await axios_1.axiosAuth.post('/token', {
                grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
                clientId: 'ElxOneApp',
                idToken: jwtResponse.id_token,
                scope: '',
            }, {
                headers: {
                    'Origin-Country-Code': 'FI',
                },
            });
            this.updateUserToken(response.data);
            this.log.info('Signed in to Electrolux!');
        }
        catch (e) {
            this.log.warn('Could not sign in to Electrolux!');
        }
    }
    shouldRefreshAccessToken() {
        return this.auth.user.refreshToken !== '' && Date.now() >= this.auth.user.tokenExpirationDate;
    }
    async refreshAccessToken() {
        this.log.info('Refreshing access token...');
        const response = await axios_1.axiosAuth.post('/token', {
            grantType: 'refresh_token',
            clientId: 'ElxOneApp',
            refreshToken: this.auth.user.refreshToken,
            scope: '',
        });
        this.updateUserToken(response.data);
        this.log.info('Access token refreshed!');
    }
    updateUserToken(token) {
        this.auth.user = {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            tokenExpirationDate: Date.now() + token.expiresIn * 1000,
        };
        fs_1.default.writeFileSync(this.authFile, JSON.stringify(this.auth, null, 2));
    }
    async getAppliances() {
        if (this.shouldRefreshAccessToken()) {
            await this.refreshAccessToken();
        }
        const response = await axios_1.axiosAppliance.get('/appliances?includeMetadata=true', {
            headers: {
                Authorization: `Bearer ${this.auth.user.accessToken}`,
            },
        });
        return response.data;
    }
    async getAppliancesInfo(applianceIds) {
        if (this.shouldRefreshAccessToken()) {
            await this.refreshAccessToken();
        }
        const response = await axios_1.axiosAppliance.post('/appliances/info', {
            applianceIds,
        }, {
            headers: {
                Authorization: `Bearer ${this.auth.user.accessToken}`,
            },
        });
        return response.data;
    }
    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    async discoverDevices() {
        this.log.info('Discovering devices...');
        const appliances = await this.getAppliances();
        const newAppliances = appliances
            .map((appliance) => {
            if (!devices_1.DEVICES[appliance.applianceData.modelName]) {
                this.log.warn('Accessory not found for model: ', appliance.applianceData.modelName);
                return;
            }
            const uuid = this.api.hap.uuid.generate(appliance.applianceId);
            const existingAccessory = this.accessories.find((accessory) => accessory.platformAccessory.UUID === uuid);
            if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.platformAccessory.displayName);
                existingAccessory.controller = new devices_1.DEVICES[appliance.applianceData.modelName](this, existingAccessory.platformAccessory, appliance);
                return;
            }
            return { uuid, appliance };
        })
            .filter((entry) => !!entry);
        if (newAppliances.length > 0) {
            const applianceIds = newAppliances.map(({ appliance }) => appliance.applianceId);
            const appliancesInfo = await this.getAppliancesInfo(applianceIds);
            for (const { uuid, appliance } of newAppliances) {
                this.log.info('Adding new accessory:', appliance.applianceData.applianceName);
                const info = appliancesInfo.find((info) => info.pnc === pnc(appliance.applianceId));
                const platformAccessory = new this.api.platformAccessory(appliance.applianceData.applianceName, uuid);
                platformAccessory.context.info = info;
                const accessory = new accessory_1.ElectroluxAccessory(platformAccessory, new devices_1.DEVICES[appliance.applianceData.modelName](this, platformAccessory, appliance));
                this.accessories.push(accessory);
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [platformAccessory]);
            }
        }
        this.log.info('Devices discovered!');
    }
    async pollStatus() {
        try {
            this.log.info('Polling appliances status...');
            const appliances = await this.getAppliances();
            appliances.map((appliance) => {
                var _a;
                const uuid = this.api.hap.uuid.generate(appliance.applianceId);
                const existingAccessory = this.accessories.find((accessory) => accessory.platformAccessory.UUID === uuid);
                if (!existingAccessory) {
                    return;
                }
                (_a = existingAccessory.controller) === null || _a === void 0 ? void 0 : _a.update(appliance);
            });
            this.log.info('Appliances status polled!');
        }
        catch (err) {
            this.log.warn('Polling error: ', err);
        }
    }
}
exports.ElectroluxDevicesPlatform = ElectroluxDevicesPlatform;
function pnc(applianceId) {
    if (applianceId.length < 9) {
        return applianceId;
    }
    // Example: 950011538111111115087076 -> 950011538
    return applianceId.slice(0, 9);
}
//# sourceMappingURL=platform.js.map