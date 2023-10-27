import { Box, Button, Input } from "@mui/material";
import Header from "../buildingblocks/Header";
import { LoremIpsum } from "lorem-ipsum";
import { useTextElements } from "../buildingblocks/text/TextScaleContext";
import { notificationEvents } from "../../events/NotificationEvents";
import { useGlobalValue } from "../hooks/GlobalValue";
export type HomePageProps = Record<string, never>;

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
    return (
        <>
            <Header title="Home" />
            <Box sx={ {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%'
            } }>

            </Box>
        </>
    );
}