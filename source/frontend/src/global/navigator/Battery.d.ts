declare interface BatteryManager {
	charging: boolean;
	chargingTime: number;
	dischargingTime: number;
	level: number;
	onchargingchange: (this: this, ev: Event) => void;
	onchargingtimechange: (this: this, ev: Event) => void;
	ondischargingtimechange: (this: this, ev: Event) => void;
	onlevelchange: (this: this, ev: Event) => void;
	addEventListener(
		type: 'chargingchange',
		listener: (this: this, ev: Event) => void,
	): void;
	addEventListener(
		type: 'chargingtimechange',
		listener: (this: this, ev: Event) => void,
	): void;
	addEventListener(
		type: 'dischargingtimechange',
		listener: (this: this, ev: Event) => void,
	): void;
	addEventListener(
		type: 'levelchange',
		listener: (this: this, ev: Event) => void,
	): void;
	removeEventListener(
		type: 'chargingchange',
		listener: (this: this, ev: Event) => void,
	): void;
	removeEventListener(
		type: 'chargingtimechange',
		listener: (this: this, ev: Event) => void,
	): void;
	removeEventListener(
		type: 'dischargingtimechange',
		listener: (this: this, ev: Event) => void,
	): void;
	removeEventListener(
		type: 'levelchange',
		listener: (this: this, ev: Event) => void,
	): void;
}

declare interface Navigator {
	getBattery?: () => Promise<BatteryManager>;
}
