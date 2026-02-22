import { Flex } from "@mantine/core";

export function CustomCircle(
  {h, w, borderSize, color, hideBorder, children}: 
  {h: string | number, w: string | number, borderSize: number, color?: string, hideBorder?: boolean, children: React.ReactNode}) {
  return (
    <Flex 
      align="center" 
      justify="center" 
      h={h} w={w} 
      style={{borderRadius: "50%", border: !!hideBorder ? undefined : `${borderSize}px solid ${color ?? "#eee"}`}}
    >
      {children}
    </Flex>
  );
}

export function CustomRectangle(
  {h, w, radius, size, color, children}: 
  {h: string, w: string, radius: number, size: number, color?: string, children: React.ReactNode}) {
  return (
    <Flex 
      align="center" 
      justify="center" 
      h={h} w={w} 
      style={{borderRadius: `${radius}px`, border: `${size}px solid ${color ?? "#eee"}`}}
    >
      {children}
    </Flex>
  );
}