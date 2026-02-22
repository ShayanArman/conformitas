import { MediaQuery } from "@mantine/core";

export function ShowOnMobile({ children }: { children: React.ReactNode }) {
  return (
    <MediaQuery largerThan={"md"} styles={{ display: "none" }}>
      {children}
    </MediaQuery>
  );
}
