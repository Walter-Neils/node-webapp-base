import { Backdrop, Fade, Slide, Typography, Paper, Box, SxProps } from "@mui/material";
import BugIcon from '@mui/icons-material/BugReport';
import React, { Fragment } from "react";
import { Theme } from "@emotion/react";
export function FlashNotification(props: { open: boolean; children: JSX.Element; })
{
    const topDirection = props.open ? 'down' : 'up';
    const bottomDirection = props.open ? 'up' : 'down';
    const contentDirection = props.open ? 'left' : 'right';

    const [ borderCount, setBorderCount ] = React.useState(5);

    const borderSX: SxProps<Theme> = {
        display: 'inline-block'
    };

    return <Backdrop transitionDuration={ props.open ? 250 : 1500 } TransitionComponent={ Fade } open={ props.open }>
        <>
            {
                (() =>
                {
                    const result: JSX.Element[] = [];
                    for (let i = 0; i < borderCount; i++)
                    {
                        result.push(<Slide in={ props.open } direction={ topDirection } timeout={ i * 50 + 250 }>
                            <Typography variant='h3' sx={ {
                                padding: '5px'
                            } }>
                                { ' / ' }
                            </Typography>
                        </Slide>);
                    }
                    return result;
                })()
            }
            <Fade in={ props.open } { ...{ direction: contentDirection } }>
                <Box>
                    {
                        props.children
                    }
                </Box>
            </Fade>
            {
                (() =>
                {
                    const result: JSX.Element[] = [];
                    for (let i = 0; i < borderCount; i++)
                    {
                        result.push(<Slide in={ props.open } direction={ bottomDirection } timeout={ i * 50 + 250 }>
                            <Typography variant='h3' sx={ {
                                padding: '5px'
                            } }>
                                { ' / ' }
                            </Typography>
                        </Slide>);
                    }
                    return result;
                })()
            }
        </>
    </Backdrop>;
}