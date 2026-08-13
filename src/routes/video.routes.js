import { Router } from "express"
import { getAllVideos, getVideoById, publishAVideo, updateVideo, deleteVideo } from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/get-all-videos").get(verifyJWT, getAllVideos)

router.route("/publish-video").post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount:1
        },
        {
            name: "thumbnail",
            maxCount:1
        }
    ]),
    publishAVideo
)

router.route("/get-video/:videoId").get(verifyJWT, getVideoById)

router.route("/update-video/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo)

router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo)

export default router