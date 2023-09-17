import Header from "../buildingblocks/Header";
import { useURLMappedStateValue } from "../hooks/URLMappedStateValue";
import Typography from "@mui/material/Typography";
import useIsSecureContext from "../hooks/SecureContext";
import { useNetworkConnection } from "../hooks/NetworkConnectionInfo";
import useBatteryStatus from "../hooks/Battery";
import useGPSPosition from "../hooks/GPSPosition";
import useSessionStorage from "../hooks/SessionStorage";
export type HomePageProps = {};

// @ts-ignore
export default function HomePage(props: HomePageProps)
{
    const [ name ] = useURLMappedStateValue<string>({
        key: "name",
        valueMode: 'base64',
        defaultValue: "World",
        initializationBehaviour: 'default',
        nullBehaviour: 'default',
        navigationBehaviour: 'replace'
    });

    const isSecureContext = useIsSecureContext();

    const networkInfo = useNetworkConnection();

    const battery = useBatteryStatus();

    const geolocation = useGPSPosition();

    const [ sessionStorageTestValue, setSessionStorageTestValue ] = useSessionStorage<string>({ key: 'test', defaultValue: 'test' });

    console.log(networkInfo);

    return (
        <>
            <Header title="Home" />
            <Typography variant="h1" component="h1" gutterBottom>
                Hello, { name }!
            </Typography>
            <Typography variant="body1" component="p" gutterBottom>
                You are in a { isSecureContext ? 'secure' : 'non-secure' } context.
            </Typography>

            <Typography variant="body1" component="p" gutterBottom>
                You are { networkInfo.isOnline ? 'online' : 'offline' }.
            </Typography>

            {
                geolocation.success &&
                <>
                    <Typography variant="body1" component="p" gutterBottom>
                        Your GPS position is { geolocation.coords.latitude }, { geolocation.coords.longitude }.
                    </Typography>
                    <Typography variant="body1" component="p" gutterBottom>
                        Your GPS accuracy is { geolocation.accuracy } meters.
                    </Typography>
                </>
            }

            {
                <>
                    <Typography variant="body1" component="p" gutterBottom>
                        Your session storage value is { sessionStorageTestValue }.
                    </Typography>
                    <button onClick={ () => setSessionStorageTestValue('test2') }>Change session storage value</button>
                </>
            }

            {
                battery.available &&
                <>
                    <Typography variant="body1" component="p" gutterBottom>
                        Your battery is { battery.batteryLevel * 100 }%.
                    </Typography>
                    <Typography variant="body1" component="p" gutterBottom>
                        Your battery is { battery.batteryCharging ? 'charging' : 'not charging' }.
                    </Typography>
                </>
            }

            {
                networkInfo.linkInfo.state === 'available' ? (
                    <>
                        <Typography variant="body1" component="p" gutterBottom>
                            You are connected to { networkInfo.linkInfo.effectiveType }.
                        </Typography>
                        <Typography variant="body1" component="p" gutterBottom>
                            Your connection is { networkInfo.linkInfo.downlink } Mbps.
                        </Typography>
                        <Typography variant="body1" component="p" gutterBottom>
                            Your connection is { networkInfo.linkInfo.rtt } ms.
                        </Typography>
                    </>
                ) : (
                    <>
                        <Typography variant="body1" component="p" gutterBottom>
                            You are { networkInfo.linkInfo.state }.
                        </Typography>
                    </>
                )
            }
        </>
    );
}