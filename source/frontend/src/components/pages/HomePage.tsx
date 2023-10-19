import { Alert, Button, Typography } from "@mui/material";
import { Microservices, getMicroservice, isMicroserviceRegistered, microserviceManagerEvents } from "../../server/microservices/Microservice";
import Header from "../buildingblocks/Header";
import { RequiresMicroservice } from "../buildingblocks/conditionals/microservice/RequiresMicroservice";
import { usePromise } from "../hooks/Promise";
import { useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import LoginPage from "./LoginPage";
export type HomePageProps = Record<string, never>;

function useService<TKey extends keyof Microservices>(service: TKey)
{
    const [ promise, setPromise, resetPromise ] = usePromise(() => getMicroservice(service));

    useEffect(() =>
    {
        const handler = () =>
        {
            if (isMicroserviceRegistered(service))
            {
                setPromise(getMicroservice(service));
            }
        };
        microserviceManagerEvents.addEventListener(`registered:${service}`, handler);
        return () =>
        {
            microserviceManagerEvents.removeEventListener(`registered:${service}`, handler);
        };
    }, []);

    if (promise.state === 'fulfilled' && promise.value === undefined)
    {
        return { state: 'rejected', reason: new Error(`Service ${service} is not registered`) };
    } else if (promise.state === 'fulfilled' && promise.value !== undefined)
    {
        return { state: 'fulfilled', value: promise.value };
    }
    else
    {
        return { state: 'pending' };
    }
}

export default function HomePage()
{
    const userService = useService("userService");
    return (
        <>
            <Header title="Home" />
            <LoginPage />
        </>
    );
}