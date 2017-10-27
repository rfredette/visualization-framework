import { theme } from "../../theme";

const style = {
    card: {
        border: theme.palette.thinBorder + theme.palette.greyColor,
        height: "100%",
        width: "100%",
        WebkitBoxShadow: "rgb(31, 28, 31) 6px 6px 16px -11px",
        MozBoxShadow: "rgb(31, 28, 31) 6px 6px 16px -11px",
        boxShadow: "rgb(31, 28, 31) 6px 6px 16px -11px"
    },
    cardTitle: {
        background: theme.palette.greyLightColor,
        color: theme.palette.blackColor,
        padding: "10px",
        fontSize: "1em",
        fontWeight: "200",
        overflow: "hidden",
        whiteSpace: "nowrap"
    },
    copyContainer: {
        marginTop: "1px"
    },
    cardTitleIcon: {
        padding: 0,
        margin: "0 0 0 1px",
        width:16,
        height:16,
        fontSize: "0.75em",
        textAlign: "center",
        cursor: "pointer"
    },
    sharingOptionsContainer: {
        padding: "2px",
        background: theme.palette.greyColor,
        position: "absolute",
        zIndex: 999,
        width: "100%"
    },
    cardContainer: {
        height: "100%",
        width: "100%",
    },
    descriptionContainer: {
        textAlign: "justify",
        background: theme.palette.greyLighterColor,
        opacity: "0.8",
        cursor: "pointer",
        padding: 10
    },
    descriptionText: {
        position: "relative",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "1.1em",
        color: theme.palette.blackColor,
    }
};

export default style;
