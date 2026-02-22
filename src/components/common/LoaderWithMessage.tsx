import { crispShadow1px } from "@helpers/styleHelpers";
import { Flex, Loader, Text } from "@mantine/core";

export default function LoaderWithMessage({ message }: { message: string}) {
  return (
    <Flex direction="column" align="center" gap={5}>
      <Loader color="var(--loader-color)" />
      <Text weight={800} color="var(--loader-color)">{message}</Text>
    </Flex>
  )
}

export function AppleLoaderWithMessage({ message }: { message: string }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="100vh"
      w="100%"
      style={{
        background: "linear-gradient(135deg, #ffffff, #f2f2f2)",
        color: "#007aff",
      }}
    >
      <Flex 
        direction="column" 
        align='center' justify="center" 
        style={{ 
          width: "12rem", height: "12rem", 
          padding: "15px", 
          boxShadow: crispShadow1px,
          borderRadius: "50%"
        }}
      >
        <Loader size="xl" variant="bars" color="black" />
        <Text weight={700} size="lg" mt="md" color="black">
          {message}
        </Text>
      </Flex>
    </Flex>
  );
}