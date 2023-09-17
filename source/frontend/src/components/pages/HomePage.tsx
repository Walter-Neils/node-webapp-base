import { Badge } from "@mui/material";
import Header from "../buildingblocks/Header";
import { useURLMappedStateValue } from "../hooks/URLMappedStateValue";
import Typography from "@mui/material/Typography";
import useIsSecureContext from "../hooks/SecureContext";
import useBatteryStatus from "../hooks/BatteryStatus";
export type HomePageProps = {};

export default function HomePage(props: HomePageProps)
{
    const [ name, setName ] = useURLMappedStateValue<string>({
        key: "name",
        valueMode: 'base64',
        defaultValue: "World",
        initializationBehaviour: 'default',
        nullBehaviour: 'default',
        navigationBehaviour: 'replace'
    });

    const isSecureContext = useIsSecureContext();
    const batteryStatus = useBatteryStatus();

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
                Your battery is at { batteryStatus?.level || -1 * 100 }%.
            </Typography>
        </>
    );
}