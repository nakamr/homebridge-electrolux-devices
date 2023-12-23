export type Appliance = {
    applianceId: string;
    applianceData: {
        applianceName: string;
        created: Date;
        modelName: string;
    };
    properties: {
        reported: ApplianceProperties;
    };
};
type ApplianceProperties = {
    $metadata: ApplianceMetadata;
    applianceState: ApplianceState;
    temperatureRepresentation: TemperatureRepresentation;
    sleepMode: Toggle;
    targetTemperatureC: number;
    uiLockMode: boolean;
    mode: Mode;
    fanSpeedSetting: FanSpeedSetting;
    verticalSwing: Toggle;
    filterState: State;
    ambientTemperatureC: number;
    Workmode: WorkMode;
    Fanspeed: number;
    Ionizer: boolean;
    UILight: boolean;
    SafetyLock: boolean;
    FilterLife: number;
    FilterType: number;
    PM1: number;
    PM2_5: number;
    PM10: number;
    Temp: number;
    Humidity: number;
    TVOC: number;
    FrmVer_NIU: string;
    ECO2?: number;
    CO2?: number;
};
interface MetadataLastUpdated {
    $lastUpdated: Date;
}
type ApplianceMetadata = MetadataLastUpdated & {
    [key in keyof ApplianceProperties]: MetadataLastUpdated;
};
type ApplianceState = 'running' | 'off';
type TemperatureRepresentation = 'celcius';
type Toggle = 'on' | 'off';
export type Mode = 'auto' | 'cool' | 'heat';
type FanSpeedSetting = 'auto' | 'low' | 'middle' | 'high';
type State = 'good';
export type WorkMode = 'Manual' | 'Auto' | 'PowerOff';
export interface ApplianceInfo {
    pnc: string;
    brand: string;
    market: string;
    productArea: string;
    deviceType: string;
    project: string;
    model: string;
    variant: string;
    colour: string;
}
export {};
//# sourceMappingURL=appliance.d.ts.map