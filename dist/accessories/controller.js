"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectroluxAccessoryController = void 0;
const axios_1 = require("../services/axios");
class ElectroluxAccessoryController {
    constructor(_platform, _accessory, _appliance) {
        this._platform = _platform;
        this._accessory = _accessory;
        this._appliance = _appliance;
        this.platform = _platform;
        this.accessory = _accessory;
        this.appliance = _appliance;
    }
    async sendCommand(body) {
        try {
            if (this.platform.shouldRefreshAccessToken()) {
                await this.platform.refreshAccessToken();
            }
            await axios_1.axiosAppliance.put(`/appliances/${this.appliance.applianceId}/command`, body, {
                headers: {
                    Authorization: `Bearer ${this.platform.auth.user.accessToken}`,
                },
            });
        }
        catch (error) {
            this.platform.log.error('An error occurred while sending command: ', error.message);
        }
    }
    manufacturer() {
        const info = this._accessory.context.info;
        if (info === null || info === void 0 ? void 0 : info.brand) {
            return info.brand;
        }
        return 'Electrolux';
    }
    // serial returns the serial number that is part of the given applianceId.
    serial() {
        if (this.appliance.applianceId.length < 17) {
            return this.appliance.applianceId;
        }
        // Example: 950011538111111115087076 -> 11111111
        return this.appliance.applianceId.slice(9, 17);
    }
}
exports.ElectroluxAccessoryController = ElectroluxAccessoryController;
//# sourceMappingURL=controller.js.map