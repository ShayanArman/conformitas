export const crispShadow1px = "0 2px 5px 0 rgba(50,50,93,.1),0 1px 1px 0 rgba(0,0,0,.07)";
export const wideShadow2px = '0 1px 1px 0 rgba(50,50,93,.3),0 1px 5px 0 rgba(0,0,0,.2)';
export const buttonShadow = "0 2px 5px 0 rgba(50,50,93,.1),0 5px 5px 0 rgba(0,0,0,.07)";
import { keyframes } from "@mantine/core";

export const containerStyle = {
  borderRadius: "15px",
  boxShadow: crispShadow1px
};

export const pulseAnimation = keyframes({
  '0%': { boxShadow: '0 0 0 0 rgba(0, 123, 255, 0.4)' },
  '70%': { boxShadow: '0 0 0 20px rgba(0, 123, 255, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(0, 123, 255, 0)' }
});

export const pulseWithBorderAnimation = keyframes({
  '0%': { boxShadow: '0 2px 5px 0 rgba(50,50,93,.1),0 1px 1px 0 rgba(0,0,0,.07)' },
  '70%': { boxShadow: '0 2px 15px 0 rgba(50,50,93,.3),0 1px 5px 0 rgba(0,0,0,.2)' },
  '100%': { boxShadow: '0 2px 5px 0 rgba(50,50,93,.1),0 1px 1px 0 rgba(0,0,0,.07)' }
});

export const superSlowPulse = {
  '0%': { opacity: 0.3 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.3 }
};

export const superSlowBorderPulse = {
  '0%': { borderRadius: "8px" },
  '50%': { borderRadius: "20px"},
  '100%': { borderRadius: "8px" }
};

export const pinkTitleContainerStyle = {
  borderRadius: "15px",
  boxShadow: "0 2px 5px 0 #e64980,0 1px 1px 0 #e64980"
};