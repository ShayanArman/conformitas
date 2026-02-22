import { Flex } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function ThalyButton(
  {logoSvg, includeShadow, href, w, mt}:
  {logoSvg?: string, includeShadow: boolean, href: string, w: number, mt: string}) {
    return (
      <Flex direction="column" align={"center"} mt={mt}>
        <Link
          href={href}
          style={{
            width: `${w}`,
            height: `${w}`,
          }}
        >
          <Image
            priority
            src={ logoSvg ?? "/thalyLogo2.svg" }
            height={w}
            width={w}
            alt={"Zero AI"}
            style={includeShadow ? {
              filter: "drop-shadow(0 0 5px rgba(0,0,0,0.4))",
              borderRadius: "50%"
            } : undefined }
          />
        </Link>
      </Flex>
    );
}

export const ThalyImage = ({h, w}: {h: number, w: number}) => (
  <Image
    priority
    src="/thalyLogo2.svg"
    height={h}
    width={w}
    alt={"Zero AI"}
    style={{
      filter: "drop-shadow(0 0 5px rgba(0,0,0,0.4))",
      borderRadius: "50%"
    }}
  />
);