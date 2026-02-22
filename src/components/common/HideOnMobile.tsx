import { MediaQuery } from "@mantine/core";

export function HideOnMobile({ children }: { children: React.ReactNode }) {
  return (
    <MediaQuery smallerThan={"md"} styles={{ display: "none" }}>
      { children }
    </MediaQuery>
  );
}
