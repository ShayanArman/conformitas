import Link from "next/link";
import { Box, Button, Title } from "@mantine/core";

export default function Custom404() {
  return (
    <Box ml="lg" mt="lg">
      <Title size="lg" weight={"normal"}>
        404 - Page Not Found
      </Title>
      <Link href={"/"}>
        <Button mt={"lg"}>Back Home</Button>
      </Link>
    </Box>
);
}