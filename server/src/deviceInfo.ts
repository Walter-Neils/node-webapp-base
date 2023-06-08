import * as os from 'os';
import hash from './shared/hash.ts';

export interface IDeviceCapabilities
{
    deviceIdentifier: IDeviceIdentifier;
    cpuCount: number;
    cpuModel: string;
    cpuSpeed: number;
    totalMemory: number;
    totalDiskSpace: number;
    operatingSystem: string;
}

export function getDeviceCapabilities(): IDeviceCapabilities
{
    const cpuCount = os.cpus().length;
    const cpuModel = os.cpus()[ 0 ].model;
    const cpuSpeed = os.cpus()[ 0 ].speed;
    const totalMemory = os.totalmem();
    const totalDiskSpace = os.totalmem();
    const operatingSystem = os.platform();

    const deviceIdentifier = getDeviceIdentifier();

    return { deviceIdentifier, cpuCount, cpuModel, cpuSpeed, totalMemory, totalDiskSpace, operatingSystem };
}

export interface IDeviceIdentifier
{
    hostname: string;
    deviceHash: string;
}



export function getDeviceIdentifier()
{
    const hostname = os.hostname();
    let deviceIdentifier = '';
    const networkInterfaces = os.networkInterfaces();
    for (const networkInterfaceName in networkInterfaces)
    {
        const networkInterface = networkInterfaces[ networkInterfaceName ];
        if (!networkInterface) continue;
        for (const networkAddress of networkInterface)
        {
            if (networkAddress.family === 'IPv4')
            {
                deviceIdentifier += networkAddress.mac;
            }
        }
    }
    deviceIdentifier += os.machine();

    const deviceHash = hash(deviceIdentifier);
    const deviceIdentifierObject: IDeviceIdentifier = { hostname, deviceHash: deviceHash.toString() };
    return deviceIdentifierObject;
}
