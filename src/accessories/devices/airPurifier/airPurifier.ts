import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';

import {ElectroluxDevicesPlatform} from '../../../platform';
import {Appliance, WorkMode} from '../../../definitions/appliance';
import {ElectroluxAccessoryContext, ElectroluxAccessoryController} from '../../controller';

export class AirPurifier extends ElectroluxAccessoryController {
    private airPurifierService: Service;
    private airQualityService: Service;
    private humiditySensorService: Service;
    private temperatureSensorService: Service;

    constructor(
        readonly _platform: ElectroluxDevicesPlatform,
        readonly _accessory: PlatformAccessory<ElectroluxAccessoryContext>,
        readonly _appliance: Appliance,
        private maxFanspeed: number,
    ) {
        super(_platform, _accessory, _appliance);

        this.accessory
            .getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, this.manufacturer())
            .setCharacteristic(this.platform.Characteristic.Model, this.appliance.applianceData.modelName)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.serial())
            .setCharacteristic(
                this.platform.Characteristic.FirmwareRevision,
                this.appliance.properties.reported.FrmVer_NIU,
            );

        this.airPurifierService =
            this.accessory.getService(this.platform.Service.AirPurifier) ||
            this.accessory.addService(this.platform.Service.AirPurifier);

        this.airPurifierService.setCharacteristic(
            this.platform.Characteristic.Name,
            this.appliance.applianceData.applianceName,
        );

        this.airPurifierService
            .getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.getActive.bind(this))
            .onSet(this.setActive.bind(this));

        this.airPurifierService
            .getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
            .onGet(this.getCurrentAirPurifierState.bind(this));

        this.airPurifierService
            .getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
            .onGet(this.getTargetAirPurifierState.bind(this))
            .onSet(this.setTargetAirPurifierState.bind(this));

        this.airPurifierService
            .getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
            .onGet(this.getLockPhysicalControls.bind(this))
            .onSet(this.setLockPhysicalControls.bind(this));

        this.airPurifierService
            .getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .setProps({
                minStep: 100 / this.maxFanspeed,
            })
            .onGet(this.getRotationSpeed.bind(this))
            .onSet(this.setRotationSpeed.bind(this));

        if (!this.airPurifierService.testCharacteristic(this.platform.Characteristic.FilterChangeIndication)) {
            this.airPurifierService.addCharacteristic(this.platform.Characteristic.FilterChangeIndication);
        }
        this.airPurifierService
            .getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
            .onGet(() => this.getFilterChangeIndication());

        if (!this.airPurifierService.testCharacteristic(this.platform.Characteristic.FilterLifeLevel)) {
            this.airPurifierService.addCharacteristic(this.platform.Characteristic.FilterLifeLevel);
        }
        this.airPurifierService
            .getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
            .onGet(() => this.getFilterLifeLevel());

        this.airQualityService =
            this.accessory.getService(this.platform.Service.AirQualitySensor) ||
            this.accessory.addService(this.platform.Service.AirQualitySensor);

        this.airQualityService
            .getCharacteristic(this.platform.Characteristic.AirQuality)
            .onGet(this.getAirQuality.bind(this));

        this.airQualityService
            .getCharacteristic(this.platform.Characteristic.PM2_5Density)
            .onGet(this.getPM2_5Density.bind(this));

        this.airQualityService
            .getCharacteristic(this.platform.Characteristic.PM10Density)
            .onGet(this.getPM10Density.bind(this));

        this.airQualityService
            .getCharacteristic(this.platform.Characteristic.VOCDensity)
            .onGet(this.getVOCDensity.bind(this));

        this.humiditySensorService =
            this.accessory.getService(this.platform.Service.HumiditySensor) ||
            this.accessory.addService(this.platform.Service.HumiditySensor);

        this.humiditySensorService
            .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(this.getCurrentRelativeHumidity.bind(this));

        this.temperatureSensorService =
            this.accessory.getService(this.platform.Service.TemperatureSensor) ||
            this.accessory.addService(this.platform.Service.TemperatureSensor);

        this.temperatureSensorService
            .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this));
    }

    async getActive(): Promise<CharacteristicValue> {
        return this.appliance.properties.reported.Workmode === 'PowerOff'
            ? this.platform.Characteristic.Active.INACTIVE
            : this.platform.Characteristic.Active.ACTIVE;
    }

    async setActive(value: CharacteristicValue) {
        if (
            (this.appliance.properties.reported.Workmode === 'PowerOff' &&
                value === this.platform.Characteristic.Active.ACTIVE) ||
            (this.appliance.properties.reported.Workmode !== 'PowerOff' &&
                value === this.platform.Characteristic.Active.INACTIVE)
        ) {
            const workMode: WorkMode = value === this.platform.Characteristic.Active.ACTIVE ? 'Auto' : 'PowerOff';
            await this.sendCommand({
                Workmode: workMode,
            });

            this.appliance.properties.reported.Workmode = workMode;

            this.airPurifierService.updateCharacteristic(
                this.platform.Characteristic.TargetAirPurifierState,
                value === this.platform.Characteristic.Active.ACTIVE
                    ? await this.getTargetAirPurifierState()
                    : this.platform.Characteristic.TargetAirPurifierState.AUTO,
            );

            this.airPurifierService.updateCharacteristic(
                this.platform.Characteristic.RotationSpeed,
                value === this.platform.Characteristic.Active.ACTIVE ? this.fanspeedInPercent() : 0,
            );
        }

        this.airPurifierService.updateCharacteristic(
            this.platform.Characteristic.CurrentAirPurifierState,
            value === this.platform.Characteristic.Active.ACTIVE
                ? this.platform.Characteristic.CurrentAirPurifierState.PURIFYING_AIR
                : this.platform.Characteristic.CurrentAirPurifierState.INACTIVE,
        );
    }

    async getCurrentAirPurifierState(): Promise<CharacteristicValue> {
        switch (this.appliance.properties.reported.Workmode) {
            case 'Manual':
                return this.platform.Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
            case 'Auto':
                return this.platform.Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
            case 'PowerOff':
                return this.platform.Characteristic.CurrentAirPurifierState.INACTIVE;
        }
    }

    async getTargetAirPurifierState(): Promise<CharacteristicValue> {
        switch (this.appliance.properties.reported.Workmode) {
            case 'Manual':
                return this.platform.Characteristic.TargetAirPurifierState.MANUAL;
            case 'Auto':
                return this.platform.Characteristic.TargetAirPurifierState.AUTO;
            case 'PowerOff':
                return this.platform.Characteristic.TargetAirPurifierState.AUTO;
        }
    }

    async setTargetAirPurifierState(value: CharacteristicValue) {
        const workMode = value === this.platform.Characteristic.TargetAirPurifierState.AUTO ? 'Auto' : 'Manual';
        if (workMode === this.appliance.properties.reported.Workmode) {
            return;
        }

        await this.sendCommand({
            Workmode: workMode,
        });

        this.appliance.properties.reported.Workmode = workMode;
    }

    async getLockPhysicalControls(): Promise<CharacteristicValue> {
        return this.appliance.properties.reported.SafetyLock
            ? this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            : this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED;
    }

    async setLockPhysicalControls(value: CharacteristicValue) {
        await this.sendCommand({
            SafetyLock: value === this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED,
        });

        this.appliance.properties.reported.SafetyLock =
            value === this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED;
    }

    private fanspeedInPercent() {
        return Math.round(100 * (this.appliance.properties.reported.Fanspeed / this.maxFanspeed));
    }

    async getRotationSpeed(): Promise<CharacteristicValue> {
        return this.fanspeedInPercent();
    }

    async setRotationSpeed(value: CharacteristicValue) {
        // This will be preceded or followed by a call to setActive(0).
        if (value === 0) {
            this.appliance.properties.reported.Fanspeed = 1; // As returned by API when the device is off.
            this.airPurifierService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, 0);
            return;
        }

        if (this.appliance.properties.reported.Workmode !== 'Manual') {
            await this.sendCommand({
                Workmode: 'Manual',
            });
            this.appliance.properties.reported.Workmode = 'Manual';
            this.airPurifierService.updateCharacteristic(
                this.platform.Characteristic.CurrentAirPurifierState,
                this.platform.Characteristic.CurrentAirPurifierState.PURIFYING_AIR,
            );
            this.airPurifierService.updateCharacteristic(
                this.platform.Characteristic.TargetAirPurifierState,
                this.platform.Characteristic.TargetAirPurifierState.MANUAL,
            );
        }

        const fanspeed = Math.max(1, Math.round((value as number) * (this.maxFanspeed / 100)));
        await this.sendCommand({
            Fanspeed: fanspeed,
        });
        this.appliance.properties.reported.Fanspeed = fanspeed;
        this.airPurifierService.updateCharacteristic(
            this.platform.Characteristic.RotationSpeed,
            this.fanspeedInPercent(),
        );
    }

    async getFilterChangeIndication(): Promise<CharacteristicValue> {
        return this.appliance.properties.reported.FilterLife <= 10
            ? this.platform.Characteristic.FilterChangeIndication.CHANGE_FILTER
            : this.platform.Characteristic.FilterChangeIndication.FILTER_OK;
    }

    async getFilterLifeLevel(): Promise<CharacteristicValue> {
        return this.appliance.properties.reported.FilterLife;
    }

    async getAirQuality(): Promise<CharacteristicValue> {
        if (this.appliance.properties.reported.PM2_5 <= 25) {
            return this.platform.Characteristic.AirQuality.EXCELLENT;
        } else if (this.appliance.properties.reported.PM2_5 <= 50) {
            return this.platform.Characteristic.AirQuality.GOOD;
        } else if (this.appliance.properties.reported.PM2_5 <= 75) {
            return this.platform.Characteristic.AirQuality.FAIR;
        } else if (this.appliance.properties.reported.PM2_5 <= 100) {
            return this.platform.Characteristic.AirQuality.INFERIOR;
        } else {
            return this.platform.Characteristic.AirQuality.POOR;
        }
    }

    async getPM2_5Density(): Promise<CharacteristicValue> {
        return this.appliance.properties.reported.PM2_5;
    }

    async getPM10Density(): Promise<CharacteristicValue> {
        return this.appliance.properties.reported.PM10;
    }

    async getVOCDensity(): Promise<CharacteristicValue> {
        const vocDensity = tvocPPBToVocDensity(
            this.appliance.properties.reported.TVOC,
            this.appliance.properties.reported.Temp,
            this._platform.config.vocMolecularWeight || 30.026,
        );
        // HomeKit VOC density is capped at 1000 μg/m^3.
        return Math.min(vocDensity, 1000);
    }

    carbonDioxideSensorAlarmValue(): number {
        return this._platform.config.carbonDioxideSensorAlarmValue || 1000;
    }

    async getCarbonDioxideDetected(): Promise<CharacteristicValue> {
        return ((await this.getCarbonDioxideLevel()) as number) > this.carbonDioxideSensorAlarmValue()
            ? this.platform.Characteristic.CarbonDioxideDetected.CO2_LEVELS_ABNORMAL
            : this.platform.Characteristic.CarbonDioxideDetected.CO2_LEVELS_NORMAL;
    }

    async getCarbonDioxideLevel(): Promise<CharacteristicValue> {
        const reported = this.appliance.properties.reported;
        if (reported.ECO2 !== undefined && reported.CO2 !== undefined) {
            if (reported.$metadata.ECO2!.$lastUpdated > reported.$metadata.CO2!.$lastUpdated) {
                return reported.ECO2;
            }
            return reported.CO2;
        }
        if (reported.ECO2 !== undefined) {
            return reported.ECO2;
        }
        if (reported.CO2 !== undefined) {
            return reported.CO2;
        }
        return -1;
    }

    async getCurrentRelativeHumidity(): Promise<CharacteristicValue> {
        return this.appliance.properties.reported.Humidity;
    }

    async getCurrentTemperature(): Promise<CharacteristicValue> {
        return this.appliance.properties.reported.Temp;
    }

    async update(appliance: Appliance) {
        this.appliance = appliance;

        this.accessory
            .getService(this.platform.Service.AccessoryInformation)!
            .updateCharacteristic(
                this.platform.Characteristic.FirmwareRevision,
                this.appliance.properties.reported.FrmVer_NIU,
            );
        this.airPurifierService.updateCharacteristic(
            this.platform.Characteristic.Name,
            this.appliance.applianceData.applianceName,
        );

        switch (this.appliance.properties.reported.Workmode) {
            case 'Manual':
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.Active,
                    this.platform.Characteristic.Active.ACTIVE,
                );
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.CurrentAirPurifierState,
                    this.platform.Characteristic.CurrentAirPurifierState.PURIFYING_AIR,
                );
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.TargetAirPurifierState,
                    this.platform.Characteristic.TargetAirPurifierState.MANUAL,
                );
                break;
            case 'Auto':
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.Active,
                    this.platform.Characteristic.Active.ACTIVE,
                );
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.CurrentAirPurifierState,
                    this.platform.Characteristic.CurrentAirPurifierState.PURIFYING_AIR,
                );
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.TargetAirPurifierState,
                    this.platform.Characteristic.TargetAirPurifierState.AUTO,
                );
                break;
            case 'PowerOff':
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.Active,
                    this.platform.Characteristic.Active.INACTIVE,
                );
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.CurrentAirPurifierState,
                    this.platform.Characteristic.CurrentAirPurifierState.INACTIVE,
                );
                this.airPurifierService.updateCharacteristic(
                    this.platform.Characteristic.TargetAirPurifierState,
                    this.platform.Characteristic.TargetAirPurifierState.AUTO,
                );
                break;
        }

        this.airPurifierService.updateCharacteristic(
            this.platform.Characteristic.LockPhysicalControls,
            this.appliance.properties.reported.SafetyLock
                ? this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
                : this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED,
        );
        this.airPurifierService.updateCharacteristic(
            this.platform.Characteristic.RotationSpeed,
            this.fanspeedInPercent(),
        );

        this.airPurifierService
            .updateCharacteristic(
                this.platform.Characteristic.FilterChangeIndication,
                await this.getFilterChangeIndication(),
            )
            .updateCharacteristic(this.platform.Characteristic.FilterLifeLevel, await this.getFilterLifeLevel());

        this.airQualityService.updateCharacteristic(
            this.platform.Characteristic.AirQuality,
            await this.getAirQuality(),
        );
        this.airQualityService.updateCharacteristic(
            this.platform.Characteristic.PM2_5Density,
            this.appliance.properties.reported.PM2_5,
        );
        this.airQualityService.updateCharacteristic(
            this.platform.Characteristic.PM10Density,
            this.appliance.properties.reported.PM10,
        );
        this.airQualityService.updateCharacteristic(
            this.platform.Characteristic.VOCDensity,
            await this.getVOCDensity(),
        );

        this.humiditySensorService.updateCharacteristic(
            this.platform.Characteristic.CurrentRelativeHumidity,
            this.appliance.properties.reported.Humidity,
        );

        this.temperatureSensorService.updateCharacteristic(
            this.platform.Characteristic.CurrentTemperature,
            this.appliance.properties.reported.Temp,
        );
    }
}

// tvocPPBToVocDensity converts TVOC in parts per billion (ppb) to VOC density
// (μg/m^3). This function is based on the following formula:
//
//	VOC density (μg/m^3) = P * MW * ppb / R * (K + T°C)
//
// Where:
//   - P is the standard atmospheric pressure in kPa (1 atm = 101.325 kPa)
//   - MW is the molecular weight of the gas in g/mol
//   - ppb is the TVOC in parts per billion
//   - R is the ideal gas constant
//   - K is the standard temperature in Kelvin (0°C)
//   - T is the provided temperature (in Celsius)
function tvocPPBToVocDensity(ppb: number, temperature: number, molecularWeight: number) {
    return Math.round((101.325 * molecularWeight * ppb) / (8.31446261815324 * (273.15 + temperature)));
}
