import { AppBar, Box, Drawer, Fade, Grow, IconButton, LinearProgress, Slide, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import MenuIcon from '@mui/icons-material/Menu';

export interface IHeaderProps
{
    title: string;
    position?: "static" | "fixed" | "absolute" | "sticky" | "relative";
    menuIcon?: JSX.Element;
    drawerContent?: JSX.Element | JSX.Element[];
    leftSideContent?: JSX.Element | JSX.Element[];
    rightSideContent?: JSX.Element | JSX.Element[];
    progress?: number;
}


export default function Header(props: IHeaderProps) 
{
    const [ drawerOpen, setDrawerOpen ] = useState(false);

    const canShowDrawer = props.drawerContent !== undefined;

    const openDrawer = () =>
    {
        if (canShowDrawer)
            setDrawerOpen(true);
    };

    const shouldShowProgress = props.progress !== undefined && props.progress !== 0 && props.progress !== 100;

    return (
        <>
            <Box sx={ { flexGrow: 1 } }>
                <AppBar position={ props.position ?? "static" }>
                    <Toolbar>
                        {
                            ((props.drawerContent !== undefined) || (props.menuIcon !== undefined)) && <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                sx={ { mr: 2 } }
                                onClick={ () => openDrawer() }
                                disabled={ !canShowDrawer }
                            >
                                {
                                    props.menuIcon ?? <MenuIcon />
                                }
                            </IconButton>
                        }
                        <Typography variant="h6" component="div" sx={ { display: { xs: 'none', sm: 'block' } } } noWrap>
                            { props.title }
                        </Typography>
                        {/* Slight Padding */ }
                        <Box sx={ { flexGrow: 0.01 } } />
                        { props.leftSideContent }
                        <Box sx={ { flexGrow: 1 } } />
                        <Box sx={ { display: { xs: 'none', md: 'flex' } } }>
                            { props.rightSideContent }
                        </Box>
                    </Toolbar>
                </AppBar>
                <Fade in={ shouldShowProgress } style={ { transformOrigin: '0 0 0' } } { ...((props.progress !== undefined) ? { timeout: 1000 } : {}) }>
                    <LinearProgress variant={ props.progress === -1 ? 'indeterminate' : 'determinate' } value={ props.progress ?? 0 } />
                </Fade>
            </Box>
            <Drawer open={ drawerOpen } onClose={ () => setDrawerOpen(false) }>
                { props.drawerContent }
            </Drawer>
        </>
    );
}