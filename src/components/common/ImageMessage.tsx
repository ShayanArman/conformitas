import { crispShadow1px } from "@helpers/styleHelpers";
import DiscoverButton from "./DiscoverButton";
import { Flex, Text } from "@mantine/core";

export default function ImageMessage(
  {mainText, withBorder, CustomButton, subText, routeTo}: 
  {mainText: string, withBorder: boolean; subText: string, routeTo?: () => void, CustomButton?: React.ReactNode}) {
    return (
      <Flex 
        direction="column"
        align={"center"}
        p={"1rem"}
        h={"100%"}
        style={withBorder ? {
          borderRadius: "15px",
          boxShadow: crispShadow1px
        }: undefined }
      >
        { 
          CustomButton ??
          <DiscoverButton
            mt={0}
            onClick={routeTo}
          /> 
        }
        <Text align="center" size="xl" mt={10} weight={600} color="var(--thaly-color)">
          { mainText }
        </Text>
        <Text mt={10} c="dimmed" size={"xs"}>
          {subText}
        </Text>
      </Flex>
    );
}
