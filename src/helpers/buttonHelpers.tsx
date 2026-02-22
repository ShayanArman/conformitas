import { Flex, Text } from "@mantine/core";
import { IoArrowForwardCircle } from "react-icons/io5";

export function getSeparatedText({
  left,
  right,
  Icon = <IoArrowForwardCircle />,
}: {
  left: string;
  right: string;
  Icon?: JSX.Element;
}): JSX.Element {
  return (
    <Flex>
      <div>{ left }</div>
      <div style={{ paddingLeft: ".1rem", paddingRight: ".1rem" }}>{ Icon }</div>
      <div>{ right }</div>
    </Flex>
  );
}

export function getButtonInnerText(text: string) {
  return <Text>{ text }</Text>;
}