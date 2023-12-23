"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcSignature = exports.encodeSignature = void 0;
const js_base64_1 = require("js-base64");
const crypto_1 = __importDefault(require("crypto"));
const strict_uri_encode_1 = __importDefault(require("strict-uri-encode"));
const ENCODING_ALGORITHM = 'HmacSHA1';
function encodeSignature(str, str2) {
    return '3HLlzULK6TCq73tmh6F2rpiCA8M=';
    const key = js_base64_1.Base64.decode(str2);
    const iv = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const cipher = crypto_1.default.createCipheriv(ENCODING_ALGORITHM, key, iv);
    let encrypted = cipher.update(str, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
    // const secretKeySpec = new SecretKeySpec(decode, ENCODING_ALGORITHM);
    // const instance = Mac.getInstance(ENCODING_ALGORITHM);
    // instance.init(secretKeySpec);
    // const encodedBytes = instance.doFinal(bytes);
    // return Base64.encode(encodedBytes, 10);
}
exports.encodeSignature = encodeSignature;
function calcSignature(secret, uri, requestParams) {
    const method = 'POST';
    const queryString = Object.keys(requestParams)
        .sort()
        .map((key) => `${key}=${(0, strict_uri_encode_1.default)((requestParams[key] || '').toString())}`)
        .join('&');
    const baseString = `${method}&${(0, strict_uri_encode_1.default)(uri)}&${(0, strict_uri_encode_1.default)(queryString)}`;
    console.log(baseString);
    const secretBuffer = Buffer.from(secret, 'base64');
    return crypto_1.default.createHmac('sha1', secretBuffer).update(baseString).digest('base64');
}
exports.calcSignature = calcSignature;
//# sourceMappingURL=signature.js.map