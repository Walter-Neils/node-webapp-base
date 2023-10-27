import { Box, Collapse } from "@mui/material";
import { Microservices, getMicroservice, isMicroserviceRegistered, microserviceManagerEvents } from "../../server/microservices/Microservice";
import Header from "../buildingblocks/Header";
import BlogEntryPreview, { BlogEntryPreviewProps } from "../buildingblocks/blogging/BlogEntryPreview";
import { usePromise } from "../hooks/Promise";
import { useEffect, useState } from "react";
import { LoremIpsum } from "lorem-ipsum";
import { useInterval } from "../hooks/ClockEvents";
import { TransitionGroup } from "react-transition-group";
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

function useServiceV2<TKey extends keyof Microservices>(service: TKey)
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

    return promise.state === 'fulfilled' ? promise.value : undefined;
}

function generateLoremIpsum()
{
    const lorem = new LoremIpsum({
        sentencesPerParagraph: {
            max: 8,
            min: 4
        },
        wordsPerSentence: {
            max: 8,
            min: 4
        }
    });
    return lorem.generateParagraphs(2);
}

export default function HomePage()
{
    const [ entries, setEntries ] = useState<BlogEntryPreviewProps[]>([]);
    useInterval(() =>
    {
        setEntries((entries) =>
        {
            const newEntries = [ {
                title: 'Article Title',
                authorName: 'Author Name',
                authorImage: 'https://i.pravatar.cc/300',
                verified: true,
                date: new Date(),
                content: generateLoremIpsum()
            }, ...entries ];
            if (newEntries.length > 3)
            {
                newEntries.pop();
            }
            return newEntries;
        });
    }, 2500, [ entries ]);
    return (
        <>
            <Header title="Home" />
            <Box sx={ {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%'
            } }>
                <TransitionGroup>
                    {
                        entries.map((entry, index) =>
                        {
                            return (
                                <Collapse key={ entry.content } timeout={ 500 } in={ true }>
                                    <BlogEntryPreview { ...entry } />
                                </Collapse>
                            );
                        })
                    }
                </TransitionGroup>
            </Box>
        </>
    );
}