import express from "express";
import { linkedinRedirect, linkedinCallback, postToLinkedIn, rewritePost } from "../../controllers/linkedinController.js";
import { generatePost } from "../../controllers/postGenerater/aiPostGenerator.js";

const router = express.Router();

// Step 1: redirect user to LinkedIn OAuth
router.get("/auth/linkedin", linkedinRedirect);

// Step 2: LinkedIn callback
router.get("/auth/linkedin/callback", linkedinCallback);

// rewrite post
router.post("/rewcrite", rewritePost);

// Step 3: post on behalf of user
router.post("/linkedin/post", postToLinkedIn);


// ai post generater
router.post("/generatePost", generatePost);

export default router;
