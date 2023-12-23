import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { ElectroluxDevicesPlatform } from '../../../platform';
import { Appliance } from '../../../definitions/appliance';
import { ElectroluxAccessoryContext, ElectroluxAccessoryController } from '../../controller';
export declare class AirPurifier extends ElectroluxAccessoryController {
    readonly _platform: ElectroluxDevicesPlatform;
    readonly _accessory: PlatformAccessory<ElectroluxAccessoryContext>;
    readonly _appliance: Appliance;
    private maxFanspeed;
    private airPurifierService;
    private airQualityService;
    private humiditySensorService;
    private temperatureSensorService;
    constructor(_platform: ElectroluxDevicesPlatform, _accessory: PlatformAccessory<ElectroluxAccessoryContext>, _appliance: Appliance, maxFanspeed: number);
    getActive(): Promise<CharacteristicValue>;
    setActive(value: CharacteristicValue): Promise<void>;
    getCurrentAirPurifierState(): Promise<CharacteristicValue>;
    getTargetAirPurifierState(): Promise<CharacteristicValue>;
    setTargetAirPurifierState(value: CharacteristicValue): Promise<void>;
    getLockPhysicalControls(): Promise<CharacteristicValue>;
    setLockPhysicalControls(value: CharacteristicValue): Promise<void>;
    private fanspeedInPercent;
    getRotationSpeed(): Promise<CharacteristicValue>;
    setRotationSpeed(value: CharacteristicValue): Promise<void>;
    getFilterChangeIndication(): Promise<CharacteristicValue>;
    getFilterLifeLevel(): Promise<CharacteristicValue>;
    getAirQuality(): Promise<CharacteristicValue>;
    getPM2_5Density(): Promise<CharacteristicValue>;
    getPM10Density(): Promise<CharacteristicValue>;
    getVOCDensity(): Promise<CharacteristicValue>;
    carbonDioxideSensorAlarmValue(): number;
    getCarbonDioxideDetected(): Promise<CharacteristicValue>;
    getCarbonDioxideLevel(): Promise<CharacteristicValue>;
    getCurrentRelativeHumidity(): Promise<CharacteristicValue>;
    getCurrentTemperature(): Promise<CharacteristicValue>;
    update(appliance: Appliance): Promise<void>;
}
//# sourceMappingURL=airPurifier.d.ts.map