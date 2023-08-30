import cookieParser from "cookie-parser";
import express from "express";

export const expressApp = express();

expressApp.use(cookieParser());