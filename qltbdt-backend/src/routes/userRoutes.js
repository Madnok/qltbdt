const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../middleware/upload");


router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.post("/uploadAvatar/:id", upload.single("avatar"), userController.uploadAvatar);
router.put("/status/:id", userController.toggleUserStatus);

module.exports = router;
