import {Router} from "express"
import { changeCurrentPassword, getCurrentUser, getUserChannelPofile, getWatchHistory, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {loginUser, logoutUser} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(upload.fields([
    {name: "avatar", //frontend me bhi yhi naam rakhna
        maxCount: 1
    },
    {name: "coverImage",
        maxCount: 1
    }
]), registerUser)

router.route("/login").post(loginUser)


//secures routes h ye, inko vhi access kr skta h jiska token shi hoga or vo jo accoutn ki taraf point krega, isi k lie auth wala middleware use krenge ham
router.route("/logout").post(verifyJWT ,logoutUser) //ab hame logout k func me pata chal jayega ki konsa user h, or use ham logout kr denge
router.route("/refreshTokens").post(refreshAccessToken) //decode or verify ka kaam isi controller me kr dia h, isliye verifyjwt jesa kuch ya yahi lagane ki jaroort nhi lagi, tum jo logic chaho use laga skti ho, jo middleware and all ya kuch or tareeka
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/get-current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/channel/:username").get(verifyJWT, getUserChannelPofile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)

export default router