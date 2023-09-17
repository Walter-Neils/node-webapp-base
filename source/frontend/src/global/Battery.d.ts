declare interface BatteryManager
{
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    onchargingchange: (this: this, ev: Event) => any;
    onchargingtimechange: (this: this, ev: Event) => any;
    ondischargingtimechange: (this: this, ev: Event) => any;
    onlevelchange: (this: this, ev: Event) => any;
    addEventListener(type: 'chargingchange', listener: (this: this, ev: Event) => any): void;
    addEventListener(type: 'chargingtimechange', listener: (this: this, ev: Event) => any): void;
    addEventListener(type: 'dischargingtimechange', listener: (this: this, ev: Event) => any): void;
    addEventListener(type: 'levelchange', listener: (this: this, ev: Event) => any): void;
    removeEventListener(type: 'chargingchange', listener: (this: this, ev: Event) => any): void;
    removeEventListener(type: 'chargingtimechange', listener: (this: this, ev: Event) => any): void;
    removeEventListener(type: 'dischargingtimechange', listener: (this: this, ev: Event) => any): void;
    removeEventListener(type: 'levelchange', listener: (this: this, ev: Event) => any): void;
}

declare interface Navigator
{
    getBattery?: () => Promise<BatteryManager>;
}