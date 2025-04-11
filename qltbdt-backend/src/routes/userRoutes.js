const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const userPhanCongController = require("../controllers/userPhanCongController");
const {upload} = require("../middleware/upload");
router.use(verifyToken);

//route cho user admin  và user thuòng
router.patch('/:id/status', requireRole(['admin']), userController.updateUserStatus);
router.patch('/update-my-password', userController.updatePassword);
router.get("/", requireRole(['admin']),userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", requireRole(['admin']), userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", requireRole(['admin']),userController.deleteUser);
router.post("/uploadAvatar/:id", upload.single("avatar"), userController.uploadAvatar);




//route nhân viên về vde phân công
router.get("/:id/phong-phutrach", verifyToken, requireRole(['admin', 'nhanvien']), userPhanCongController.getPhuTrachByNhanVien);
router.post("/:id/phong-phutrach", verifyToken, requireRole(['admin']), userPhanCongController.addPhuTrach);
router.delete("/:id/phong-phutrach", verifyToken, requireRole(['admin']), userPhanCongController.removePhuTrach);

module.exports = router;
