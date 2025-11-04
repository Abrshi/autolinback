import express from "express";
import {titleGenerator} from "../../controllers/postGenerater/postGenerator.js";

const router = express.Router();

router.post("/titleGenerator", titleGenerator);

export default router;
