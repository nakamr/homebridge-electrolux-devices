import { PlatformAccessory } from 'homebridge';
import { ElectroluxDevicesPlatform } from '../../../platform';
import { AirPurifier } from './airPurifier';
import { ElectroluxAccessoryContext } from '../../controller';
import { Appliance } from '../../../definitions/appliance';
export declare class WellA7 extends AirPurifier {
    readonly _platform: ElectroluxDevicesPlatform;
    readonly _accessory: PlatformAccessory<ElectroluxAccessoryContext>;
    readonly _appliance: Appliance;
    private carbonDioxideSensorService;
    constructor(_platform: ElectroluxDevicesPlatform, _accessory: PlatformAccessory<ElectroluxAccessoryContext>, _appliance: Appliance);
    update(appliance: Appliance): Promise<void>;
}
//# sourceMappingURL=wellA7.d.ts.map