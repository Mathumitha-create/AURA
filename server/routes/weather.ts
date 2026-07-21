import { Router } from "express";
import { getCachedWeather } from "../providers/weatherProvider";

export const weatherRouter = Router();

weatherRouter.get("/", (_req, res) => {
  res.json(getCachedWeather());
});
