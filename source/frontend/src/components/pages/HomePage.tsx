import { Box, Button } from "@mui/material";
import Header from "../buildingblocks/Header";
import { LoremIpsum } from "lorem-ipsum";
import { notificationEvents } from "../../events/NotificationEvents";
import toast from "react-hot-toast";
export type HomePageProps = Record<string, never>;


export default function HomePage() {
  return (
    <>
      <Header title="Home" />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%'
      }}>
      </Box>
    </>
  );
}
