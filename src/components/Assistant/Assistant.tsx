import { Box, createStyles, Flex, Text, keyframes } from "@mantine/core";
import { buttonShadow, crispShadow1px } from "@helpers/styleHelpers";
import { useEffect, useState, type MutableRefObject } from "react";
import { useWordByWordText } from "@hooks/useWordByWordText";
import classNames from "classnames";

const useStyles = createStyles(() => ({
  container: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "0.8rem",
    boxSizing: "border-box",
  },
  ring: {
    width: "1.3rem",
    height: "1.3rem",
    borderRadius: "50%",
    boxShadow: crispShadow1px,
    ["&:hover"]: {
      boxShadow: buttonShadow,
    },
  },
  readyRing: {
    backgroundColor: "black"
  },
  thinkingRing: {
    zIndex: 2,
    animation: `${pulseAnimation} 2s infinite`,
    backgroundColor: "var(--thaly-color)"
  },
  errorRing: {
    backgroundColor: 'red'
  }
}))

export const ASSISTANT_MT_MOBILE = 10;
export const ASSISTANT_MT_DESKTOP = 30;
type args = {
  isMobile: boolean;
  mt: number;
  mb: number;
  boxShadow?: string;
  assistantRef?: MutableRefObject<any>;
  textToShow: string[];
  wordDelay: number;
  finalDelay?: number;
  centerText?: boolean;
  isThinking?: boolean;
  isError?: boolean;
  onComplete?: () => void;
};

export default function AssistantV2(
  { isMobile, mt, mb, assistantRef, boxShadow, textToShow, wordDelay, centerText, finalDelay, isThinking, isError, onComplete }:
    args) {
  const { classes } = useStyles();
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (textToShow && textToShow.length > 0) {
      setOpened(false);
      setTimeout(() => setOpened(true), 0); // Small delay to restart animation
    }
  }, [textToShow]);

  const finished = () => {
    setOpened(false);
    onComplete && onComplete();
  }

  const { visibleText } = useWordByWordText({
    text: textToShow,
    wordDelay,
    finalDelay,
    opened,
    onComplete: finished
  });

  return (
    <Flex
      direction="row"
      ref={assistantRef}
      gap={10}
      w={isMobile ? "90%" : "50%"}
      maw={isMobile ? "90%" : "50%"}
      mt={mt}
      mb={mb}
      className={classes.container}
      style={{
        boxShadow: boxShadow ?? crispShadow1px
      }}
    >
      <AssistantRing isThinking={!!isThinking} isError={!!isError} isOn={opened} />
      <Flex w="100%" justify={centerText ? "center" : undefined}>
        <Text weight={400} size={isMobile ? "lg" : "xl"} color="black">
          {visibleText}
        </Text>
      </Flex>
    </Flex>
  );
}

const pulseAnimation = keyframes({
  '0%': { boxShadow: '0 0 0 0 rgba(0, 123, 255, 0.4)' },
  '70%': { boxShadow: '0 0 0 20px rgba(0, 123, 255, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(0, 123, 255, 0)' }
});

enum RingStatus {
  ERROR,
  THINKING,
  READY
}
// if is thinking, its on
// but if on, is not always thinking
function AssistantRing(
  { isThinking, isError, isOn }: { isThinking: boolean; isError: boolean; isOn: boolean }
) {
  const { classes } = useStyles();
  let status = RingStatus.READY;
  if (isError) { status = RingStatus.ERROR }
  else if (isOn || isThinking) { status = RingStatus.THINKING }
  else { status = RingStatus.READY }

  return (
    <Box
      mt={3}
      className={
        classNames(
          classes.ring,
          {
            [classes.thinkingRing]: (status === RingStatus.THINKING),
            [classes.errorRing]: (status === RingStatus.ERROR),
            [classes.readyRing]: (status === RingStatus.READY)
          }
        )
      }
    >

    </Box>
  )
}