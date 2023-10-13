import { Button, Typography } from "@mui/material";
import { isMicroserviceRegistered } from "../../server/microservices/Microservice";
import Header from "../buildingblocks/Header";
import { RequiresMicroservice } from "../buildingblocks/conditionals/microservice/RequiresMicroservice";
export type HomePageProps = Record<string, never>;


export default function HomePage()
{
    return (
        <>
            <Header title="Home" />
            <RequiresMicroservice service="userService">
                <Button variant="contained" color="primary">Launch Core Services</Button>
            </RequiresMicroservice>
        </>
    );
}