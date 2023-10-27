import { Avatar, Box, BoxProps, Button, Card, CardContent, CardMedia, CardProps, Chip, Collapse, Fade, IconButton, List, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText, Typography, TypographyProps } from "@mui/material";
import { useInterval, useTimeout } from "../hooks/ClockEvents";
import React from "react";
import { TransitionGroup } from "react-transition-group";
import UserIcon from '@mui/icons-material/AccountCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useTextElements } from "../buildingblocks/text/TextScaleContext";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
// Lorem Ipsum
import { LoremIpsum } from "lorem-ipsum";
function gradientTypography(...colors: string[])
{
    return (props: TypographyProps) => (
        <Typography { ...props } sx={ {
            // background: `linear-gradient(45deg, ${color1} 1%, ${color2} 75%)`,
            background: `linear-gradient(45deg, ${colors.join(', ')})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        } } />
    );
}

function Reveal(props: { children: React.ReactNode; delay?: number; })
{
    const [ isRevealed, setIsRevealed ] = React.useState(false);
    useTimeout(() =>
    {
        setIsRevealed(true);
    }, props.delay ?? 0);

    return (
        <Collapse in={ isRevealed }>
            { props.children }
        </Collapse>
    );
}

function GridBackgroundBox(props: BoxProps)
{
    return (
        <Box { ...props } sx={ {
            width: '100%',
            height: '100%',
            background: 'linear-gradient(45deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%)',
            zIndex: -1,
            ...props.sx
        } } />
    );
}

function ShootingStars()
{
    return (
        <div className="stars">
            {/* <div class="star"></div> */ }
            {
                Array.from(Array(100)).map((_, i) => (
                    <div key={ i } className="star"></div>
                ))
            }
        </div>
    );
}

function ResponsiveOutlineCard(props: CardProps)
{
    // Card with an outline that glows based on mouse position

}

function ThingsIUsed()
{
    return (
        <>
            <a href="https://codepen.io/alphardex/pen/RwrVoeL">Pen by alphardex</a>
        </>
    );
}
function useLoremIpsum()
{
    const lorem = React.useMemo(() => new LoremIpsum({
        sentencesPerParagraph: {
            max: 8,
            min: 4
        },
        wordsPerSentence: {
            max: 16,
            min: 4
        }
    }), []);
    return lorem;
}

function ProjectPreview(props: {
    title: string;
    description: string;
    imageURL: string;
})
{
    const { Heading } = useTextElements('Major Mono Display', 'heading');
    const { Body } = useTextElements('Roboto', 'body');
    const lorem = useLoremIpsum();
    return (
        <Card sx={ {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            padding: '1rem',
            borderRadius: '1rem',
            boxShadow: '0 0 10px 5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            maxWidth: '30rem',
        } }>
            <CardMedia
                component="img"
                height="140"
                image={ props.imageURL }
                alt="green iguana"
            />
            <CardContent>
                <Heading>{ props.title }</Heading>
                <Body>
                    { props.description }
                </Body>
            </CardContent>
        </Card>
    );
}


export default function PortfolioPage(props: Record<string, never>)
{
    const { Heading } = useTextElements('Major Mono Display', 'heading');
    const { Body } = useTextElements('Roboto', 'body');
    const lorem = useLoremIpsum();
    return (
        <>
            <Box sx={ {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100%',
            } }>
                <Typography variant="h2">
                    Hi, I'm <Typography display='inline' variant="h2" color="primary">Walter</Typography>
                </Typography>
                <Typography variant="h4">
                    I'm a <Typography display='inline' variant="h4" color="secondary">full-stack</Typography> software engineer
                </Typography>
            </Box>
            <Box sx={ {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                columns: '2 200px',
                gap: '10rem',
            } }>
                <Box>
                    <Heading>About Me</Heading>
                    <Body maxWidth={
                        '30rem'
                    } sx={ {
                        color: 'GrayText'
                    } }>
                        { lorem.generateParagraphs(2) }
                    </Body>
                </Box>
                <Box>
                    <Heading>Projects</Heading>
                    {
                        Array.from(Array(3)).map((_, i) => (
                            <ProjectPreview key={ i } title={ lorem.generateWords(3) } description={ lorem.generateParagraphs(1) } imageURL="https://picsum.photos/200/300" />
                        ))
                    }
                </Box>
            </Box>
        </>
    );
}