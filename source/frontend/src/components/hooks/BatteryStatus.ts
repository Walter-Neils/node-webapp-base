import { useEffect, useState } from "react";

type BatteryStatus = {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
};

export default function useBatteryStatus()
{
    const [ batteryStatus, setBatteryStatus ] = useState<BatteryStatus | null>(null);

    useEffect(() =>
    {
        (async () =>
        {
            const navigator = window.navigator as any;
            if (navigator.getBattery)
            {
                const battery = await navigator.getBattery();
            }
        })();
    }, []);

    return batteryStatus;
}