import { Appliance, ApplianceInfo } from '../definitions/appliance';
import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { ElectroluxDevicesPlatform } from '../platform';
export type ElectroluxAccessoryContext = {
    info?: ApplianceInfo;
};
export declare abstract class ElectroluxAccessoryController {
    readonly _platform: ElectroluxDevicesPlatform;
    readonly _accessory: PlatformAccessory<ElectroluxAccessoryContext>;
    readonly _appliance: Appliance;
    platform: ElectroluxDevicesPlatform;
    accessory: PlatformAccessory;
    appliance: Appliance;
    constructor(_platform: ElectroluxDevicesPlatform, _accessory: PlatformAccessory<ElectroluxAccessoryContext>, _appliance: Appliance);
    sendCommand(body: Record<string, CharacteristicValue>): Promise<void>;
    abstract update(appliance: Appliance): void;
    manufacturer(): string;
    serial(): string;
}
//# sourceMappingURL=controller.d.ts.map