import { buttonShadow, crispShadow1px, pulseWithBorderAnimation } from "@helpers/styleHelpers";
import { createStyles, UnstyledButton } from "@mantine/core";
import classNames from "classnames";
import { IoCloudyOutline } from "react-icons/io5";


const useStyles = createStyles(() => ({
  discoverButton: {
    borderRadius: "50%",
    boxShadow: crispShadow1px,
    height: "140px",
    width: "140px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    ["&:hover"]: {
      cursor: "pointer",
      boxShadow: buttonShadow,
    },
  },
  customButton: {
    padding: "15px",
  },
  animateBorder: {
    animation: `${pulseWithBorderAnimation} 2s infinite`,
  },
  discoverIcon: {
    fontSize: "50px",
    color: "var(--thaly-color)",
  }
}))


export default function DiscoverButton(
  { mt, disabled, onClick }: 
  { mt: number, disabled: boolean; onClick?: () => void }
) {
    const { classes } = useStyles();

    return (
      <UnstyledButton
        className={classes.discoverButton}
        mt={mt}
        disabled={disabled}
        // todo on click type hi and click send
        // todo wait 8 seconds, if no hi then just type it and click submit
        onClick={onClick}
      >
        <IoCloudyOutline className={classes.discoverIcon} />
      </UnstyledButton>
    );
}

export function CustomButton(
  {mt, animateBorder, onClick, children}: 
  {mt: number; animateBorder: boolean; onClick?: () => void, children: React.ReactNode}) {
    const { classes } = useStyles();

    return (
      <UnstyledButton
        className={classNames(
          classes.discoverButton, 
          classes.customButton,
          {[classes.animateBorder]: animateBorder}
        )}
        mt={mt}
        onClick={onClick}
      >
        { children }
      </UnstyledButton>
    );
}