// import bodyParser from "body-parser";
import express from "express";
import http from "http";
import httpProxy from "http-proxy";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import * as socketio from "socket.io";
import tcpPortUsed from "tcp-port-used";
import { Session } from "../modules/Session";

export class Router {
    private ActiveSessions: Map<string, Session> = new Map();
    private proxy: any;

    constructor(port = 80) {
        const app = express();
        const httpServer = new http.Server(app);
        const io = require("socket.io")(httpServer);

        // app.use(bodyParser.urlencoded({ extended: false }));
        // app.use(bodyParser.json()); // support json encoded bodies
        const apiProxy = httpProxy.createProxyServer();

        apiProxy.on("error", (e, req: any, res: any) => {
            console.log("EREERER: ");
            console.log(e);
            res?.send("Please refresh this page to validate your session");
            res?.socket.destroy();
        });

        httpServer.on("upgrade", (req, socket, head) => {
            console.log("Upgrading");
            apiProxy.ws(req, socket, head);
        });

        app.set("views", path.join(__dirname, "views"));
        app.set("view engine", "ejs");

        app.use("/assets", express.static(path.join(__dirname, "views", "assets")));

        app.all("/s/:sessionID*", async (req: express.Request, res: express.Response) => {
            const sessionID = req.params.sessionID;
            const ActiveSession = this.ActiveSessions.get(sessionID);

            if (ActiveSession) {
                req.url = req.url.split("/").slice(3).join("/");

                apiProxy.web(req, res, {target: `http://localhost:${ActiveSession.port}`, autoRewrite: true});

            } else {
                res.status(404).send("Unkown SessionID");
            }
        })

        app.get("/gh/:creator/:repo", (req: express.Request, res: express.Response) => {
            const repo = req.params.repo;
            const creator = req.params.creator;

            res.render("loading", { app: repo, author: creator });
        } );

        io.on("connection", (socket: socketio.Socket) => {
            socket.on("load repo", async (creator: string, repo: string, cb: (sessionID: string) => void) => {
                const userSession = new Session(`https://github.com/${creator}/${repo}.git`);

                this.ActiveSessions.set(userSession.id, userSession);

                userSession.init().then((r: string) => {
                    cb(r);
                });
            });
        });

        const server = httpServer.listen(port, () => {
            // tslint:disable-next-line: no-console
            console.log("Started sever on port " + port);
        });
    }
}
