"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comfort600 = void 0;
const lodash_1 = __importDefault(require("lodash"));
const controller_1 = require("../controller");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class Comfort600 extends controller_1.ElectroluxAccessoryController {
    constructor(_platform, _accessory, _appliance) {
        super(_platform, _accessory, _appliance);
        this._platform = _platform;
        this._accessory = _accessory;
        this._appliance = _appliance;
        this.setTemperature = lodash_1.default.debounce(async (value) => {
            this.sendCommand({
                targetTemperatureC: value,
            });
        }, 1000);
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, this.manufacturer())
            .setCharacteristic(this.platform.Characteristic.Model, this.appliance.applianceData.modelName)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.serial());
        this.service =
            this.accessory.getService(this.platform.Service.HeaterCooler) ||
                this.accessory.addService(this.platform.Service.HeaterCooler);
        this.service.setCharacteristic(this.platform.Characteristic.Name, this.appliance.applianceData.applianceName);
        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed).props.minStep = 33.33;
        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature).props.minValue = 16;
        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature).props.maxValue = 32;
        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature).props.minStep = 1;
        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature).props.minValue = 16;
        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature).props.maxValue = 32;
        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature).props.minStep = 1;
        this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState).props.validValues = [
            this.platform.Characteristic.CurrentHeaterCoolerState.INACTIVE,
            this.platform.Characteristic.CurrentHeaterCoolerState.IDLE,
            this.platform.Characteristic.CurrentHeaterCoolerState.COOLING,
            this.platform.Characteristic.CurrentHeaterCoolerState.HEATING,
        ];
        this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState).props.validValues = [
            this.platform.Characteristic.TargetHeaterCoolerState.AUTO,
            this.platform.Characteristic.TargetHeaterCoolerState.COOL,
            this.platform.Characteristic.TargetHeaterCoolerState.HEAT,
        ];
        this.service
            .getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.getActive.bind(this))
            .onSet(this.setActive.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
            .onGet(this.getCurrentHeaterCoolerState.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
            .onGet(this.getTargetHeaterCoolerState.bind(this))
            .onSet(this.setTargetHeaterCoolerState.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
            .onGet(this.getLockPhysicalControls.bind(this))
            .onSet(this.setLockPhysicalControls.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.Name).onGet(this.getName.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .onGet(this.getRotationSpeed.bind(this))
            .onSet(this.setRotationSpeed.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.SwingMode)
            .onGet(this.getSwingMode.bind(this))
            .onSet(this.setSwingMode.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
            .onGet(this.getCoolingThresholdTemperature.bind(this))
            .onSet(this.setCoolingThresholdTemperature.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
            .onGet(this.getHeatingThresholdTemperature.bind(this))
            .onSet(this.setHeatingThresholdTemperature.bind(this));
    }
    async getActive() {
        return this.appliance.properties.reported.applianceState === 'running'
            ? this.platform.Characteristic.Active.ACTIVE
            : this.platform.Characteristic.Active.INACTIVE;
    }
    async setActive(value) {
        this.sendCommand({
            executeCommand: value === this.platform.Characteristic.Active.ACTIVE ? 'ON' : 'OFF',
        });
        this.appliance.properties.reported.applianceState =
            value === this.platform.Characteristic.Active.ACTIVE ? 'running' : 'off';
    }
    async getCurrentHeaterCoolerState() {
        switch (this.appliance.properties.reported.mode) {
            case 'cool':
                return this.platform.Characteristic.CurrentHeaterCoolerState.COOLING;
            case 'heat':
                return this.platform.Characteristic.CurrentHeaterCoolerState.HEATING;
            case 'auto':
                return this.appliance.properties.reported.ambientTemperatureC >
                    this.appliance.properties.reported.targetTemperatureC
                    ? this.platform.Characteristic.CurrentHeaterCoolerState.COOLING
                    : this.platform.Characteristic.CurrentHeaterCoolerState.HEATING;
        }
    }
    async getTargetHeaterCoolerState() {
        switch (this.appliance.properties.reported.mode) {
            case 'cool':
                return this.platform.Characteristic.TargetHeaterCoolerState.COOL;
            case 'heat':
                return this.platform.Characteristic.TargetHeaterCoolerState.HEAT;
            case 'auto':
                return this.platform.Characteristic.TargetHeaterCoolerState.AUTO;
        }
    }
    async setTargetHeaterCoolerState(value) {
        let mode = null;
        let currentState = null;
        switch (value) {
            case this.platform.Characteristic.TargetHeaterCoolerState.AUTO:
                mode = 'AUTO';
                currentState =
                    this.appliance.properties.reported.ambientTemperatureC >
                        this.appliance.properties.reported.targetTemperatureC
                        ? this.platform.Characteristic.CurrentHeaterCoolerState.COOLING
                        : this.platform.Characteristic.CurrentHeaterCoolerState.HEATING;
                break;
            case this.platform.Characteristic.TargetHeaterCoolerState.COOL:
                mode = 'COOL';
                currentState = this.platform.Characteristic.CurrentHeaterCoolerState.COOLING;
                break;
            case this.platform.Characteristic.TargetHeaterCoolerState.HEAT:
                mode = 'HEAT';
                currentState = this.platform.Characteristic.CurrentHeaterCoolerState.HEATING;
                break;
        }
        if (!mode) {
            return;
        }
        await this.sendCommand({
            mode,
        });
        if (currentState) {
            this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, currentState);
            switch (value) {
                case this.platform.Characteristic.TargetHeaterCoolerState.AUTO:
                    this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.appliance.properties.reported.targetTemperatureC);
                    this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, this.appliance.properties.reported.targetTemperatureC);
                    break;
                case this.platform.Characteristic.TargetHeaterCoolerState.COOL:
                    this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.appliance.properties.reported.targetTemperatureC);
                    break;
                case this.platform.Characteristic.TargetHeaterCoolerState.HEAT:
                    this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, this.appliance.properties.reported.targetTemperatureC);
                    break;
            }
            this.appliance.properties.reported.mode = mode.toLowerCase();
        }
    }
    async getCurrentTemperature() {
        return this.appliance.properties.reported.ambientTemperatureC;
    }
    async getLockPhysicalControls() {
        return this.appliance.properties.reported.uiLockMode
            ? this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            : this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED;
    }
    async setLockPhysicalControls(value) {
        await this.sendCommand({
            uiLockMode: value === this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED,
        });
        this.appliance.properties.reported.uiLockMode =
            value === this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED;
    }
    async getName() {
        return this.accessory.displayName;
    }
    async getRotationSpeed() {
        switch (this.appliance.properties.reported.fanSpeedSetting) {
            case 'auto':
                return 0;
            case 'low':
                return 33;
            case 'middle':
                return 66;
            case 'high':
                return 100;
        }
    }
    async setRotationSpeed(value) {
        await this.sendCommand({
            fanSpeed: value,
        });
        const numberValue = value;
        this.appliance.properties.reported.fanSpeedSetting =
            value === 0 ? 'auto' : numberValue <= 33 ? 'low' : numberValue <= 66 ? 'middle' : 'high';
    }
    async getSwingMode() {
        return this.appliance.properties.reported.verticalSwing === 'on'
            ? this.platform.Characteristic.SwingMode.SWING_ENABLED
            : this.platform.Characteristic.SwingMode.SWING_DISABLED;
    }
    async setSwingMode(value) {
        await this.sendCommand({
            verticalSwing: value === this.platform.Characteristic.SwingMode.SWING_ENABLED ? 'ON' : 'OFF',
        });
        this.appliance.properties.reported.verticalSwing =
            value === this.platform.Characteristic.SwingMode.SWING_ENABLED ? 'on' : 'off';
    }
    async getCoolingThresholdTemperature() {
        return this.appliance.properties.reported.targetTemperatureC;
    }
    async setCoolingThresholdTemperature(value) {
        try {
            await this.setTemperature(value);
            this.appliance.properties.reported.targetTemperatureC = value;
        }
        catch (err) {
            throw new this.platform.api.hap.HapStatusError(-70402 /* this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    async getHeatingThresholdTemperature() {
        return this.appliance.properties.reported.targetTemperatureC;
    }
    async setHeatingThresholdTemperature(value) {
        try {
            await this.setTemperature(value);
            this.appliance.properties.reported.targetTemperatureC = value;
        }
        catch (err) {
            throw new this.platform.api.hap.HapStatusError(-70402 /* this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    update(appliance) {
        this.appliance = appliance;
        let currentState, targetState;
        switch (this.appliance.properties.reported.mode) {
            case 'cool':
                currentState = this.platform.Characteristic.CurrentHeaterCoolerState.COOLING;
                targetState = this.platform.Characteristic.TargetHeaterCoolerState.COOL;
                break;
            case 'heat':
                currentState = this.platform.Characteristic.CurrentHeaterCoolerState.HEATING;
                targetState = this.platform.Characteristic.TargetHeaterCoolerState.HEAT;
                break;
            default:
                currentState =
                    this.appliance.properties.reported.ambientTemperatureC >
                        this.appliance.properties.reported.targetTemperatureC
                        ? this.platform.Characteristic.CurrentHeaterCoolerState.COOLING
                        : this.platform.Characteristic.CurrentHeaterCoolerState.HEATING;
                targetState = this.platform.Characteristic.TargetHeaterCoolerState.AUTO;
                break;
        }
        let rotationSpeed;
        switch (this.appliance.properties.reported.fanSpeedSetting) {
            case 'auto':
                rotationSpeed = 0;
                break;
            case 'low':
                rotationSpeed = 33;
                break;
            case 'middle':
                rotationSpeed = 66;
                break;
            case 'high':
                rotationSpeed = 100;
                break;
        }
        this.service.updateCharacteristic(this.platform.Characteristic.Active, this.appliance.properties.reported.applianceState === 'running'
            ? this.platform.Characteristic.Active.ACTIVE
            : this.platform.Characteristic.Active.INACTIVE);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, currentState);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, targetState);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.appliance.properties.reported.ambientTemperatureC);
        this.service.updateCharacteristic(this.platform.Characteristic.LockPhysicalControls, this.appliance.properties.reported.uiLockMode
            ? this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            : this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
        this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, rotationSpeed);
        this.service.updateCharacteristic(this.platform.Characteristic.SwingMode, this.appliance.properties.reported.verticalSwing === 'on'
            ? this.platform.Characteristic.SwingMode.SWING_ENABLED
            : this.platform.Characteristic.SwingMode.SWING_DISABLED);
        this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.appliance.properties.reported.targetTemperatureC);
        this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, this.appliance.properties.reported.targetTemperatureC);
    }
}
exports.Comfort600 = Comfort600;
//# sourceMappingURL=comfort600.js.map