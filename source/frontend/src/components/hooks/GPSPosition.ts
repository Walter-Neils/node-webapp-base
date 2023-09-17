import { useEffect, useRef, useState } from "react";

type GPSPosition = {
    success: true;
    coords: {
        longitude: number;
        latitude: number;
    };
    timestamp: number;
    accuracy: number | null;
} | {
    success: false;
    error: 'permission-denied' | 'position-unavailable' | 'timeout';
};

export default function useGPSPosition(): GPSPosition
{
    const [ longitude, setLongitude ] = useState(-1);
    const [ latitude, setLatitude ] = useState(-1);
    const [ timestamp, setTimestamp ] = useState(-1);
    const [ accuracy, setAccuracy ] = useState<number | null>(null);
    const [ error, setError ] = useState<'permission-denied' | 'position-unavailable' | 'timeout' | null>(null);


    const unwind = useRef(() => { });

    useEffect(() =>
    {
        (async () =>
        {
            navigator.geolocation.getCurrentPosition((position) =>
            {
                setLongitude(position.coords.longitude);
                setLatitude(position.coords.latitude);
                setTimestamp(position.timestamp);
                setAccuracy(position.coords.accuracy);
            }, (error) =>
            {
                switch (error.code)
                {
                    case error.PERMISSION_DENIED:
                        setError('permission-denied');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError('position-unavailable');
                        break;
                    case error.TIMEOUT:
                        setError('timeout');
                        break;
                }
            }, {
                enableHighAccuracy: true,
            });

            const handle = navigator.geolocation.watchPosition(position =>
            {
                setLongitude(position.coords.longitude);
                setLatitude(position.coords.latitude);
                setTimestamp(position.timestamp);
                setAccuracy(position.coords.accuracy);
            }, (error) =>
            {
                switch (error.code)
                {
                    case error.PERMISSION_DENIED:
                        setError('permission-denied');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError('position-unavailable');
                        break;
                    case error.TIMEOUT:
                        setError('timeout');
                        break;
                }
            }, {
                enableHighAccuracy: true,
            });

            unwind.current = () =>
            {
                navigator.geolocation.clearWatch(handle);
            };
        })();

        return () =>
        {
            unwind.current();
        };
    }, []);

    if (error)
    {
        return {
            success: false,
            error
        };
    }
    else
    {
        return {
            success: true,
            coords: {
                longitude,
                latitude,
            },
            timestamp,
            accuracy,
        };
    }
}