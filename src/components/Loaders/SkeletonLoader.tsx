import { Skeleton } from "@mantine/core";

export function SkeletonLoader({isMobile }: {isMobile: boolean}) {
  return (
    <Skeleton
      visible={true}
      mt={15}
      h={"10rem"}
      w={isMobile ? "90%" : "20%"}
      style={{ boxShadow: "0px 5px 5px 1px #eeeeee5e" }}
      radius="xl"
    />
  );
}
