import { Alert, AlertTitle } from "@mui/material";
import { Microservices, getMicroservice, isMicroserviceRegistered, microserviceManagerEvents } from "../../../../server/microservices/Microservice";
import React from "react";

export function RequiresMicroservice(props: { service: keyof Microservices, children: JSX.Element; loading?: JSX.Element; unavailable?: JSX.Element; notPresent?: JSX.Element; })
{
    const [ state, setState ] = React.useState<'loading' | 'not-present' | 'unavailable' | 'available'>('loading');

    React.useEffect(() =>
    {
        const check = (async () =>
        {
            setState('loading');
            if (!isMicroserviceRegistered(props.service))
            {
                setState('not-present');
            }
            else
            {
                try
                {
                    const service = await getMicroservice(props.service);
                    if (!service)
                    {
                        setState('unavailable');
                    }
                    else
                    {
                        setState('available');
                    }
                }
                catch (e)
                {
                    setState('unavailable');
                }
            }
        });

        microserviceManagerEvents.addEventListener(`registered:${props.service}`, check);

        check();

        return () =>
        {
            microserviceManagerEvents.removeEventListener(`registered:${props.service}`, check);
        };
    }, []);

    if (state === 'available')
    {
        return props.children;
    }
    else if (state === 'not-present')
    {
        return props.notPresent ?? <Alert severity="error">
            <AlertTitle>
                Microservice Module Not Initialized
            </AlertTitle>
            The microservice module <strong>{ props.service }</strong> is not initialized.
        </Alert>;
    }
    else if (state === 'unavailable')
    {
        return props.unavailable ?? <Alert severity="error">
            <AlertTitle>
                Microservice Module Unavailable
            </AlertTitle>
            The microservice module <strong>{ props.service }</strong> is unavailable.
        </Alert>;
    }
    else if (state === 'loading')
    {
        return props.loading ?? <Alert severity="info">
            <AlertTitle>
                Loading...
            </AlertTitle>
            The microservice module <strong>{ props.service }</strong> is loading.
        </Alert>;
    }
    else
    {
        return null;
    }
}