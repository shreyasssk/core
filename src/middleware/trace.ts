import chalk from "chalk";
import { logger } from "container";
import type { Handler, NextFunction, Request, Response } from "express";

/**
 * Calculates the time taken to execute a request.
 *
 * @param start - The start time of the request.
 */
const getLatency = (start: [number, number]): number => {
  // 1000000
  const NS_TO_MS = 1e6;
  // 1000
  const NS_PER_SEC = 1e9;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

/**
 * Returns a colored string of the response status code.
 *
 * @param status - The status code of the response.
 */
const getColoredStatus = (status: number): string => {
  if (status >= 100 && status <= 199) return chalk.blue(status);
  else if (status >= 200 && status <= 299) return chalk.green(status);
  else if (status >= 300 && status <= 399) return chalk.gray(status);
  else return chalk.red(status);
};

/**
 * Returns a colored string of the request method.
 *
 * @param method - The HTTP method of the request.
 */
const getColoredMethod = (method: string): string => {
  switch (method.toLowerCase()) {
    case "get": {
      return chalk.green(method);
    }
    case "delete": {
      return chalk.red(method);
    }
    case "put":
    case "post":
    case "patch": {
      return chalk.yellow(method);
    }
    default: {
      return method;
    }
  }
};

/**
 * Simple middleware for logging requests
 * and related information in a development
 * environment.
 */
export const trace = (): Handler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();

    res.on("close", () => {
      const latency = Math.floor(getLatency(start));

      const path = req.originalUrl.toLowerCase();
      const status = getColoredStatus(res.statusCode);
      const method = getColoredMethod(req.method.toUpperCase());

      logger.debug(
        // prettier-ignore
        `${chalk.bold(method)} - ${chalk.bold(path)} - ${chalk.bold(status)} - ${chalk.bold(latency + "ms")}`
      );
    });

    return next(null);
  };
};
