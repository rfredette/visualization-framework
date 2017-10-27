import { theme } from "../../theme";

const style = {

    cardText: {
        padding: "0px",
        fontSize: "0.85em",
        color: theme.palette.blackColor,
        position: "relative"
    },
    overlayContainer: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        display: "inline-block",
        textAlign: "center",
    },
    overlayText: {
        position: "relative",
        top: "50%",
        transform: "translateY(-50%)",
        width: "100%",
        fontSize: "1.2em",
        fontWeight: 300,
        color: theme.palette.blackColor,
    },
    fullWidth: {
        width: "100%",
    }
};

export default style;
