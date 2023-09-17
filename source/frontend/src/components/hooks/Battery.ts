import { useEffect, useRef, useState } from "react";


type BatteryStatus = {
    available: true;
    batteryCharging: boolean;
    batteryChargingTime: number;
    batteryDischargingTime: number;
    batteryLevel: number;
} | {
    available: false;
    error: 'not-supported';
};

export default function useBatteryStatus(): BatteryStatus
{
    const [ batteryCharging, setBatteryCharging ] = useState(false);
    const [ batteryChargingTime, setBatteryChargingTime ] = useState(-1);
    const [ batteryDischargingTime, setBatteryDischargingTime ] = useState(-1);
    const [ batteryLevel, setBatteryLevel ] = useState(-1);

    const [ error, setError ] = useState<'not-supported' | null>(null);

    const unwind = useRef<() => void>(() => { });

    useEffect(() =>
    {
        (async () =>
        {
            if (!navigator.getBattery)
            {
                setError('not-supported');
                return;
            }

            const battery = await navigator.getBattery();

            setBatteryCharging(battery.charging);
            setBatteryChargingTime(battery.chargingTime);
            setBatteryDischargingTime(battery.dischargingTime);
            setBatteryLevel(battery.level);

            let chargingChangeHandler: (this: BatteryManager, ev: Event) => any = function ()
            {
                setBatteryCharging(this.charging);
            };

            let chargingTimeChangeHandler: (this: BatteryManager, ev: Event) => any = function ()
            {
                setBatteryChargingTime(this.chargingTime);
            };

            let dischargingTimeChangeHandler: (this: BatteryManager, ev: Event) => any = function ()
            {
                setBatteryDischargingTime(this.dischargingTime);
            };

            let levelChangeHandler: (this: BatteryManager, ev: Event) => any = function ()
            {
                setBatteryLevel(this.level);
            };



            battery.addEventListener('chargingchange', chargingChangeHandler);
            battery.addEventListener('chargingtimechange', chargingTimeChangeHandler);
            battery.addEventListener('dischargingtimechange', dischargingTimeChangeHandler);
            battery.addEventListener('levelchange', levelChangeHandler);

            unwind.current = () =>
            {
                battery.removeEventListener('chargingchange', chargingChangeHandler);
                battery.removeEventListener('chargingtimechange', chargingTimeChangeHandler);
                battery.removeEventListener('dischargingtimechange', dischargingTimeChangeHandler);
                battery.removeEventListener('levelchange', levelChangeHandler);
            };
        })();
    });

    if (error)
    {
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