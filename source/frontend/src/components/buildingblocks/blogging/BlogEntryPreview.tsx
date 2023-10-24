import { Avatar, Box, Card, Fade, Typography } from "@mui/material";
import { LoremIpsum } from "lorem-ipsum";
import { ReactNode, useState } from "react";
import CheckIcon from '@mui/icons-material/Check';
import GppGoodIcon from '@mui/icons-material/GppGood';
export type BlogEntryPreviewProps = {
    title: string;
    authorName: string;
    authorImage: string;
    verified: boolean;
    date: Date;
    content: string;
};

function SingleLine(props: { children: ReactNode | ReactNode[]; })
{
    return (
        <Box sx={ {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
        } }>
            { props.children }
        </Box>
    );
}
export default function BlogEntryPreview(props: BlogEntryPreviewProps)
{
    return (
        <Card sx={ {
            padding: '1rem',
            minWidth: '20rem',
            maxWidth: '40rem',
            borderColor: 'GrayText',
            borderWidth: '0.1rem',
            borderStyle: 'solid'
        } }>
            <Box sx={ {
                // Split the card into two columns
                display: 'grid',
                gridTemplateColumns: '1fr 20fr',
                gridTemplateRows: '1fr',
            } }>
                <Avatar src={ props.authorImage } alt={ props.authorName } sx={ {
                    marginRight: '1rem',
                } } />
                <Box>
                    <SingleLine>
                        <Typography variant='body1' color='GrayText'>{ props.authorName }</Typography>
                        {
                            props.verified ?
                                <SingleLine>
                                    <GppGoodIcon sx={ { marginLeft: '0.5rem', marginRight: '0.5rem' } } color="success" />
                                </SingleLine> : null
                        }
                    </SingleLine>
                    <Typography variant="subtitle1" color='GrayText'>
                        {
                            props.date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })
                        }
                    </Typography>
                </Box>
            </Box>
            <Typography variant="h4" sx={ {
                margin: '1rem 0',
            } }>{ props.title }</Typography>
            <Typography variant="body1" color='GrayText'>{ props.content }</Typography>
        </Card>
    );
}