import crypto from "crypto";
import redis from "db/redis";
import config from "config/index";
import { createJwt } from "lib/jwt";
import bcrypt from "@node-rs/bcrypt";
import { send } from "services/mailer";
import { User } from "dao/entities/User";
import { logger, userDao } from "container";
import type { Request, Response } from "express";
import { DuplicateRecordException } from "dao/errors/DuplicateRecordException";

/**
 * Temporary payload that will be deserialized from
 * Redis for finalizing user registration
 */
export type Payload = {
  email: string;
  password: string;
  lastName: string;
  username: string;
  firstName: string;
};

const register = async (req: Request, res: Response) => {
  const { firstName, lastName, password, username } = req.body;
  const encryptedPassword = await bcrypt.hash(password);
  const email = String(req.body.email).toLowerCase();

  // If email verification is disabled
  if (!config.email.enableVerification) {
    try {
      // Creating a user
      const user = await userDao.createUser(
        new User(email, encryptedPassword, username, lastName, firstName)
      );

      const token = createJwt({ id: user?.id });
      req.session.token = token;
      return res.status(201).json({ token });
    } catch (error) {
      if (error instanceof DuplicateRecordException) return res.sendStatus(403);
      else {
        logger.error(error);
        return res.sendStatus(500);
      }
    }
  } else {
    const payload: Payload = { email, password, lastName, username, firstName };
    const token = crypto.randomBytes(12).toString("hex");
    const stringified = JSON.stringify(payload);

    await Promise.all([
      // Sending a verification email
      send(
        email,
        config.email.client === "courier"
          ? config.courier.events?.verification!
          : "email/verification",
        {
          email,
          token,
          firstName,
          frontend: config.polygon.frontend,
        }
      ),
      redis.set(`verif:${token}`, stringified),
      redis.expire(`verif:${token}`, config.email.expireVerification),
    ]);

    return res.sendStatus(204);
  }
};

export default register;
