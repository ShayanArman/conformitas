import { buttonShadow, crispShadow1px } from "@helpers/styleHelpers";
import { createStyles, Header as MantineHeader } from "@mantine/core";
import useIsMobile from "@hooks/useIsMobile";
import styles from "./Header.module.css";
import { useRouter } from "next/router";
import { Flex, Text, UnstyledButton } from "@mantine/core";
import { APP_NAME } from "@constants/Constants";

export const HEADER_HEIGHT_PX = 85;

export default function Header() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const goHome = () => {
    return router.push("/");
  };

  return (
    <MantineHeader height={HEADER_HEIGHT_PX} className={styles.header} p="md">
      <UnstyledButton onClick={goHome}>
        <HeaderTitle isMobile={isMobile} />
      </UnstyledButton>
    </MantineHeader>
  );
}

const useStyles = createStyles(() => ({
  ring: {
    width: "1.3rem", 
    height: "1.3rem", 
    borderRadius: "50%",
    zIndex: 2,
    backgroundColor: "var(--thaly-color)",
    boxShadow: crispShadow1px,
    ["&:hover"]: {
      boxShadow: buttonShadow,
    },
  },
}));

function HeaderTitle({ isMobile }: { isMobile: boolean }) {
  const { classes } = useStyles();

  return (
    <Flex gap={7} ml={isMobile ? 0 : 50} align="center" style={{ padding: "3px" }}>
      <Flex mt={3} w={"25px"} h={"25px"} style={{ borderRadius: "50%" }} className={classes.ring} />
      <Text style={{ fontSize: "2rem", color: "black" }}>{APP_NAME}</Text>
    </Flex>
  );
}
