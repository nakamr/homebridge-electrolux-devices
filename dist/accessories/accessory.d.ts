import { PlatformAccessory } from 'homebridge';
import { ElectroluxAccessoryContext, ElectroluxAccessoryController } from './controller';
export declare class ElectroluxAccessory {
    readonly platformAccessory: PlatformAccessory<ElectroluxAccessoryContext>;
    controller?: ElectroluxAccessoryController;
    constructor(platformAccessory: PlatformAccessory<ElectroluxAccessoryContext>, controller?: ElectroluxAccessoryController);
}
//# sourceMappingURL=accessory.d.ts.map