import express from "express";
import config from "config/index";
import { verify, register } from "controllers/auth";
import { celebrate, Joi, Segments } from "celebrate";

const router = express.Router();

// Main registration endpoint
// prettier-ignore
router.post("/", celebrate({
    [Segments.BODY]: {
      lastName: Joi.string().exist(),
      firstName: Joi.string().exist(),
      email: Joi.string().email().exist(),
      username: Joi.string().alphanum().exist(),
      password: Joi.string().alphanum().min(8).exist(),
    },
  }),
  register
);

// Only enabling the verification route if it is specified in the configuration.
if (config.email.enableVerification) {
  // Verification endpoint. This is used to verify the email address of a temporary user.
  // prettier-ignore
  router.post("/verify/:token", celebrate({ [Segments.BODY]: { password: Joi.string().min(8).exist() }}), verify);
}

export default router;
