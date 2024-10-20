import { readdirSync } from "fs";
import path from "path";
import express from "express";
import { basename as _basename } from "path";

const basename = _basename(__filename);
const restRouter = express.Router();
readdirSync(__dirname)
    .filter((file) => {
        return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
    })
    .forEach((file) => {
        restRouter.use("/" + file.slice(0, file.length - 3), require(path.join(__dirname, file))["default"]);
    });
export default restRouter;
