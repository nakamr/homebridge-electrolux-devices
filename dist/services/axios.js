"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.axiosAppliance = exports.axiosAuth = void 0;
const axios_1 = __importDefault(require("axios"));
const apiKey_1 = require("../const/apiKey");
const url_1 = require("../const/url");
exports.axiosAuth = axios_1.default.create({
    baseURL: url_1.AUTH_API_URL,
    headers: {
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
        Authorization: 'Bearer',
        'x-api-key': apiKey_1.API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Ktor client',
    },
});
exports.axiosAppliance = axios_1.default.create({
    baseURL: url_1.APPLIANCE_API_URL,
    headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Charset': 'utf-8',
        'x-api-key': apiKey_1.API_KEY,
        Accept: 'application/json',
        'User-Agent': 'Ktor client',
    },
});
//# sourceMappingURL=axios.js.map