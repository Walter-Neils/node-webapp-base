import { Box, Collapse, IconButton, SvgIconTypeMap, Theme } from "@mui/material";
import './ExpandableIconButton.css';

import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { OverridableComponent } from "@mui/material/OverridableComponent";

type ExposableIconButtonProps = {
    icon: OverridableComponent<SvgIconTypeMap<{
        className?: string;
    }, "svg">>;
    expandedContent: React.ReactNode;
    color: Theme[ 'palette' ][ 'primary' ][ 'main' ];
    onClick?: () => void;
};

export default function ExpandableIconButton(props: ExposableIconButtonProps)
{
    const Icon = props.icon;
    return (
        <Box className="expandable_icon_button_root">
            <Icon className="expandable_icon_button_icon" />
            <Box className="expandable_icon_button_content">
                { props.expandedContent }
            </Box>
        </Box>
    );
}