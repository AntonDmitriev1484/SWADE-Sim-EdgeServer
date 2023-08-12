import fs from "fs";
import FormData from "form-data"
import  * as f from "../util/functions.js"
import fetch from "node-fetch"

const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;
const og = "e-srv"+process.env.EDGE_ID;
const TIMER = 5000;
const E_URL = "http://e-srv:3000";

const EXP_CLEANED_DATA = true;

// Re-send email to Zitlaly?