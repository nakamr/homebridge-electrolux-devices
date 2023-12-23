"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WellA7 = void 0;
const airPurifier_1 = require("./airPurifier");
class WellA7 extends airPurifier_1.AirPurifier {
    constructor(_platform, _accessory, _appliance) {
        super(_platform, _accessory, _appliance, 5);
        this._platform = _platform;
        this._accessory = _accessory;
        this._appliance = _appliance;
        this.carbonDioxideSensorService =
            this.accessory.getService(this.platform.Service.CarbonDioxideSensor) ||
                this.accessory.addService(this.platform.Service.CarbonDioxideSensor);
        this.carbonDioxideSensorService
            .getCharacteristic(this.platform.Characteristic.CarbonDioxideDetected)
            .onGet(() => this.getCarbonDioxideDetected());
        this.carbonDioxideSensorService
            .getCharacteristic(this.platform.Characteristic.CarbonDioxideLevel)
            .onGet(() => this.getCarbonDioxideLevel());
    }
    async update(appliance) {
        this.appliance = appliance;
        this.carbonDioxideSensorService.updateCharacteristic(this.platform.Characteristic.CarbonDioxideDetected, await this.getCarbonDioxideDetected());
        this.carbonDioxideSensorService.updateCharacteristic(this.platform.Characteristic.CarbonDioxideLevel, await this.getCarbonDioxideLevel());
    }
}
exports.WellA7 = WellA7;
//# sourceMappingURL=wellA7.js.map