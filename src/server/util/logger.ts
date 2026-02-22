import { env } from "@env/server.mjs";
import winston from "winston";

const formatter = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  format: formatter,
  transports: [new winston.transports.Console()],
});
