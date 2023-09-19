import { Box } from "@mui/material";

export type HorizontalSplitProps = {
    children: React.ReactNode[];
};

export default function HorizontalSplit(props: HorizontalSplitProps)
{
    return (<>
        <Box sx={ { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'stretch', alignContent: 'stretch', height: '100%' } }>
            {
                props.children.map((child, index) => (<Box key={ index } sx={ { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minWidth: '0px', minHeight: '0px', overflow: 'auto' } }>
                    { child }
                </Box>))
            }
        </Box>
    </>);
}