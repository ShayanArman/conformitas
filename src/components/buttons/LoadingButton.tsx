import { buttonShadow, crispShadow1px, pulseAnimation } from "@helpers/styleHelpers";
import { createStyles, UnstyledButton } from "@mantine/core";
import { Flex } from "@mantine/core";
import Image from "next/image";
import React from 'react';

const useStyles = createStyles(() => ({
  buttonWrapper: {
    position: 'relative',
    width: '140px',
    height: '140px',
  },
  discoverButton: {
    position: 'absolute',
    top: '0',
    left: '0',
    borderRadius: "50%",
    boxShadow: crispShadow1px,
    height: "140px",
    width: "140px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'white',
    zIndex: 2,
    animation: `${pulseAnimation} 2s infinite`,

    ["&:hover"]: {
      cursor: "pointer",
      boxShadow: buttonShadow,
    },
  },
  discoverIcon: {
    fontSize: "50px",
    color: "var(--thaly-color)",
  },
}));

export default function LoadingButton({
  mt,
  onClick,
}: {
  mt: number;
  onClick?: () => void;
}) {
  const { classes } = useStyles();

  return (
    <div className={classes.buttonWrapper} style={{ marginTop: mt }}>
      <Flex direction="column" align={"center"} mt={mt}>
        <UnstyledButton
          className={classes.discoverButton}
          onClick={onClick}
        >
          <Image
            priority
            src="/thalyLogo2.svg"
            width={140}
            height={140}
            alt={"Zero AI"}
            style={{
              filter: "drop-shadow(0 0 5px rgba(0,0,0,0.4))",
              borderRadius: "50%"
            }}
          />
        </UnstyledButton>
      </Flex>
    </div>
  );
}