import { Router } from "express";
import { getCachedShips } from "../providers/maritimeProvider";
import { buildMapAssets } from "../services/aggregationService";

export const shipsRouter = Router();

shipsRouter.get("/", (req, res) => {
  if (String(req.query.resource ?? "") === "mapAssets") {
    return res.json(buildMapAssets());
  }

  return res.json(getCachedShips());
});
