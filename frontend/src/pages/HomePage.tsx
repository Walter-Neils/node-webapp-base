import { Button } from "@mui/material";
import React from "react";
import delay from "../shared/delay";
import Header from "../components/Header";


export default function HomePage()
{
    const [ progress, setProgress ] = React.useState(0);

    React.useEffect(() =>
    {
        (async () =>
        {
            await delay(3000);
            for (let i = 0; i <= 100; i++)
            {
                await delay(50);
                setProgress(i);
            }
            setProgress(-1);
            await delay(2500);
            setProgress(0);
        })();
    }, []);

    return (
        <>
            <Header title="Home" progress={ progress } menuIcon={
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1280px-React-icon.svg.png" alt="React Logo" width="32" />
            }
                rightSideContent={
                    <Button variant='contained'>An action</Button>
                }
                leftSideContent={
                    <Button variant='contained'>Left Side</Button>
                }
            />
        </>
    );
}