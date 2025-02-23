import redis from "db/redis";
import { isNil } from "lodash";
import type { Payload } from ".";
import { userDao } from "container";
import bcrypt from "@node-rs/bcrypt";
import { createJwt } from "lib/jwt";
import { User } from "dao/entities/User";
import type { Request, Response } from "express";

const verify = async (req: Request, res: Response) => {
  const { token: suppliedToken } = req.params;
  const { password: suppliedPassword } = req.body;

  // Getting the verification token from Redis
  const redisPayload = await redis.get(`verif:${suppliedToken}`);

  if (!isNil(redisPayload)) {
    const parsed = JSON.parse(redisPayload) as Payload;
    const correctPassword = await bcrypt.verify(
      suppliedPassword,
      parsed.password
    );

    if (correctPassword) {
      const [user] = await Promise.all([
        // Creating a user
        await userDao.createUser(
          new User(
            parsed.email,
            parsed.password,
            parsed.username,
            parsed.lastName,
            parsed.firstName
          )
        ),
        // Deleting the verification token from Redis
        await redis.del(`verif:${suppliedToken}`),
      ]);

      const token = createJwt({ id: user?.id });
      req.session.token = token;
      return res.status(201).json({ token });
    } else return res.sendStatus(401);
  } else return res.sendStatus(401);
};

export default verify;
