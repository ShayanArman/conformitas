import { useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

export default function useIsMobile() {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);
  return isMobile;
}
