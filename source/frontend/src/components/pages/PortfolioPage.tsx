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
import '../../styles/meteor.scss';

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

export default function PortfolioPage(props: Record<string, never>)
{
    const [ isOnTitle, setIsOnTitle ] = React.useState(true);

    return (
        <>
            <ShootingStars />
            <Collapse in={ isOnTitle }>
                <>
                    <Box sx={ {
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        width: '100vw',
                    } }>

                        <Typography variant="h2">
                            Hi, I'm <Typography display='inline' variant="h2" color="primary">Walter</Typography>
                        </Typography>
                        <Reveal delay={ 1000 }>
                            <Typography variant="h4">
                                I'm a <Typography display='inline' variant="h4" color="secondary">full-stack</Typography> software engineer
                            </Typography>
                        </Reveal>
                        <Reveal delay={ 2000 }>
                            <Button onClick={
                                () => setIsOnTitle(false)
                            } startIcon={ <ArrowDownwardIcon /> } variant="outlined" color="primary" size="large" sx={ { marginTop: '1rem' } }>
                                View my Work
                            </Button>
                        </Reveal>
                    </Box>
                </>
            </Collapse>
            <Fade in={ !isOnTitle }>
                <Box sx={ {
                    // Horizontally center content
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // Stack children side-by-side
                    flexDirection: 'row',
                    gap: '1em',
                    zIndex: 1
                } }>
                    <Card sx={ {
                        padding: '1em',
                        width: '20em',
                    } }>
                        <CardMedia image="https://www.picmiicrowdfunding.com/wp-content/uploads/2022/11/Screen-Shot-2022-11-17-at-3.35.39-PM.png" title="xCraft Enterprises" sx={ {
                            height: '10em'
                        } } />
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                xCraft Enterprises, Inc.
                            </Typography>
                            <Box sx={ {
                                // Add spacing between children
                            } }>
                                {
                                    [
                                        {
                                            label: 'C++',
                                            color: 'primary',
                                            icon: <AccountTreeIcon />
                                        },
                                        {
                                            label: 'React',
                                            color: 'secondary',
                                            icon: <HubIcon />
                                        },
                                        {
                                            label: 'C#',
                                            color: 'info',
                                            icon: <HubIcon />
                                        }
                                    ].map((item, i) => (
                                        <Chip key={ i } label={ item.label } color={ item.color as any } icon={ item.icon } sx={ {
                                            margin: '0.25em'
                                        } } />
                                    ))
                                }
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                I worked on the PanaDrone project, which was a drone system designed to be controlled over the internet via web browser.
                                I was responsible for writing the drone communication system (C++), and I helped build the web interface (React + TypeScript) and the backend (C#).
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={ {
                        padding: '1em',
                        width: '20em',
                    } }>
                        <CardMedia image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAn1BMVEXytAEZGRkAABdCNRYAABUUFBj5uQB+YhYbGB0HCxb1tgD8uQYZGBvRng0YGhoRERpRQBWughMAABq4iRANExsbFBdaRRTfpw+kehLprAn2sweVbRAACxrIlBD5vA2pghJ0WxQAAB4QFxkZFRwzKRZGNBjmtxVENhOKbxP8tQbWpRSMbBKqiBvInBICDhiQbByvihDGnBwWGxEdEyHbrBMyU6ANAAAClUlEQVR4nO3dDW+aQByAcbgipYj40hcnU+poO6Wrrnv5/p9tmGzmaIwDIbk/x/NLmxjCNT65VhMsd44DAAAAAAAAAAAAAAAAifz2hKZbTgrX121ZrxLTNaek3k1b1DSVmJiqoC1fbiUGFnPoukGUDZrJssB11a3IP8RD4dPzVUMvL5nrzuQWqsdhQ+nXWSy50PvU+KktPNlz2EKhkl8YNnqj70LhfDO5zOYwuhOF3vgys22edKQwLrj1v5bbvBNzmMyLBxdZfvY7MYcUUkihORRSSKF5FFJIoXkUUkiheT0qfPWUdzQLzjVFgdLOVd+GHbiKkTrJ4lHz9hydK7zb6ifvunCtzXecpHSZfpOdSYy9kX5u8QsgvzD9cHR4NTg3h2pUtJQ+SlvcCC/0k7/C4tupWJjk/8bk4cKLJBfuv480r2G1wvlodxyzW+1Fz6G79zQbv1KhP9VffA8/RXKhbjypVhhOVRSXDnekMK5TWD4stlC3rDWHgTsojX7PTdecEq40Pyb1Cn/+eteH/xY5h7pw+DCuVRg/zYsHx+GJI/LfTTSJ/3BX65Umup+Ln7ayuoUxheJQSKF8FFIoH4UUykchhfJRSKF8FFIoH4UUykchhfJRSKF8FFIoH4UUykchhfJRSKF8FFIoH4UUykchhfJRSKF8FFIoH4UUykdh5wvtv3fNzvsP7b+H1P77gPtwL/eHp2/n/fjWr6lg/7oY9q9t0ov1aXqwxpDt60TZv9ZXL9Zro5BCCo2hkEIKzaOQQgrNo5BCCs3rT6H9+671Ye886/c/tH8Py2aEF/ZgL1nr9wO2f09ny/fl7sHe6v/f+L4iNU0lJobr67asVxIDHefiN/rTb/0AAAAAAAAAAAAAAAAQ5w/XNe2zvofzSwAAAABJRU5ErkJggg==" title="University of Idaho" sx={ {
                            height: '10em'
                        } } />
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                University of Idaho
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Designed, built, and implemented a visualization dashboard for the University of Idaho's Scarecro project. The dashboard was built using React and TypeScript. The backend is based on microservices written in various languages, primarily TypeScript + NodeJS.
                                Docker is used to containerize the microservices, and AWS is used to host and deploy them.
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Fade>
        </>
    );
}