import { useEffect, useRef, useState } from 'react';

type BatteryStatus =
	| {
			available: true;
			batteryCharging: boolean;
			batteryChargingTime: number;
			batteryDischargingTime: number;
			batteryLevel: number;
	  }
	| {
			available: false;
			error: 'not-supported';
	  };

export default function useBatteryStatus(): BatteryStatus {
	const [batteryCharging, setBatteryCharging] = useState(false);
	const [batteryChargingTime, setBatteryChargingTime] = useState(-1);
	const [batteryDischargingTime, setBatteryDischargingTime] = useState(-1);
	const [batteryLevel, setBatteryLevel] = useState(-1);

	const [error, setError] = useState<'not-supported' | null>(null);

	const unwind = useRef<(() => void) | null>(null);

	useEffect(() => {
		(async () => {
			if (!navigator.getBattery) {
				setError('not-supported');
				return;
			}

			const battery = await navigator.getBattery();

			setBatteryCharging(battery.charging);
			setBatteryChargingTime(battery.chargingTime);
			setBatteryDischargingTime(battery.dischargingTime);
			setBatteryLevel(battery.level);

			const chargingChangeHandler: (
				this: BatteryManager,
				ev: Event,
			) => void = function () {
				setBatteryCharging(this.charging);
			};

			const chargingTimeChangeHandler: (
				this: BatteryManager,
				ev: Event,
			) => void = function () {
				setBatteryChargingTime(this.chargingTime);
			};

			const dischargingTimeChangeHandler: (
				this: BatteryManager,
				ev: Event,
			) => void = function () {
				setBatteryDischargingTime(this.dischargingTime);
			};

			const levelChangeHandler: (
				this: BatteryManager,
				ev: Event,
			) => void = function () {
				setBatteryLevel(this.level);
			};

			battery.addEventListener('chargingchange', chargingChangeHandler);
			battery.addEventListener(
				'chargingtimechange',
				chargingTimeChangeHandler,
			);
			battery.addEventListener(
				'dischargingtimechange',
				dischargingTimeChangeHandler,
			);
			battery.addEventListener('levelchange', levelChangeHandler);

			unwind.current = () => {
				battery.removeEventListener(
					'chargingchange',
					chargingChangeHandler,
				);
				battery.removeEventListener(
					'chargingtimechange',
					chargingTimeChangeHandler,
				);
				battery.removeEventListener(
					'dischargingtimechange',
					dischargingTimeChangeHandler,
				);
				battery.removeEventListener('levelchange', levelChangeHandler);
			};
		})();
	});

	if (error) {
		return {
			available: false,
			error,
		};
	}

	return {
		available: true,
		batteryCharging,
		batteryChargingTime,
		batteryDischargingTime,
		batteryLevel,
	};
}
