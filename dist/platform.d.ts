import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { ElectroluxAccessoryContext } from './accessories/controller';
import { ElectroluxAccessory } from './accessories/accessory';
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export declare class ElectroluxDevicesPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: ElectroluxAccessory[];
    private readonly authFile;
    readonly auth: {
        user: {
            accessToken: string;
            refreshToken: string;
            tokenExpirationDate: number;
        };
    };
    private pollingInterval;
    constructor(log: Logger, config: PlatformConfig, api: API);
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory<ElectroluxAccessoryContext>): void;
    signIn(): Promise<void>;
    shouldRefreshAccessToken(): boolean;
    refreshAccessToken(): Promise<void>;
    private updateUserToken;
    private getAppliances;
    private getAppliancesInfo;
    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices(): Promise<void>;
    pollStatus(): Promise<void>;
}
//# sourceMappingURL=platform.d.ts.map