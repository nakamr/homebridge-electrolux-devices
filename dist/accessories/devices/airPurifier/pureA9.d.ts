import { PlatformAccessory } from 'homebridge';
import { AirPurifier } from './airPurifier';
import { ElectroluxDevicesPlatform } from '../../../platform';
import { ElectroluxAccessoryContext } from '../../controller';
import { Appliance } from '../../../definitions/appliance';
export declare class PureA9 extends AirPurifier {
    readonly _platform: ElectroluxDevicesPlatform;
    readonly _accessory: PlatformAccessory<ElectroluxAccessoryContext>;
    readonly _appliance: Appliance;
    private carbonDioxideSensorService;
    constructor(_platform: ElectroluxDevicesPlatform, _accessory: PlatformAccessory<ElectroluxAccessoryContext>, _appliance: Appliance);
    update(appliance: Appliance): Promise<void>;
}
//# sourceMappingURL=pureA9.d.ts.map