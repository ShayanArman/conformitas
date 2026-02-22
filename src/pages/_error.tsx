import Link from "next/link";
import { Box, Button, Text } from "@mantine/core";

export default function Error( {statusCode, text}: { statusCode?: number, text?: string } ) {
    const errorString = statusCode ? `An error ${statusCode} occurred` : 'An error occurred on client';

    return (
        <Box ml="lg" mt="lg">
            <Text size="lg" weight={"normal"}>
                { text ? text : errorString }
            </Text>
            <Link href={"/"}>
                <Button mt={"lg"}>Back Home</Button>
            </Link>
        </Box>
    );
}