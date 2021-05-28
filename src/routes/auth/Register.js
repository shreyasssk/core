const router = require("express").Router();
const upload = require("../../middleware/multer");
const RegistrationController = require("../../controllers/auth/Registration.controller");

router.post("/", upload.single("avatar"), RegistrationController);

module.exports = router;
