import fs from "fs";
import fse from "fs-extra";
import { ServiceHandler } from "../ServicesHandler";

// tslint:disable-next-line: interface-name
export interface GitReturnStatus {
    repoName: string;
    sessionID: string;
    files: string[];
}

export class Git extends ServiceHandler {
    public pulled: Map<string, GitReturnStatus> = new Map();

    constructor() {
        super();
    }

    public cleanup() {
        this.pulled.forEach((value: GitReturnStatus, key: string) => {
            fse.removeSync(`repos/gh/${key}`);
        });
    }

    public async pull(url: string, sessionID: string) {
        const repoName = url.split("/").splice(-1)[0].split(".")[0];

        return new Promise<GitReturnStatus>(async (resolve, reject) => {
            try {
                await this.getRepo(url, repoName);
            } catch (e) {
                return reject(e);
            }

            fs.readdir(`tmp/${repoName}`, (err, files) => {
                if (err) { return reject(err); }

                const sessionInfo: GitReturnStatus = {
                    files,
                    repoName,
                    sessionID
                };

                this.pulled.set(sessionInfo.sessionID, sessionInfo);

                fse.move(`tmp/${repoName}`, `repos/gh/${sessionInfo.sessionID}`).then(() => {
                    resolve(sessionInfo);
                });
            });
        });
    }

    private getRepo(repoURL: string, repoName: string) {
        return new Promise(async (resolve, reject) => {
            if (process.env.NODE_ENV == "test") {
                fs.mkdirSync(`tmp/${repoName}`);
                // tslint:disable-next-line: max-line-length
                fs.writeFileSync(`tmp/${repoName}/index.js`, `var express = require('express')\nvar app = express()\n\napp.get('/', function (req, res) {\n  res.send('Hello World!')\n})\n\napp.listen(3000, function () {\n  console.log('Listening on port 3000...')\n})`);
                // tslint:disable-next-line: max-line-length
                fs.writeFileSync(`tmp/${repoName}/package.json`, `{\n  "name": "express-hello-world",\n  "version": "1.0.0",\n  "description": "Hello world app with express 4",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "test": "echo "Error: no test specified && exit 1"\n  },\n  "keywords": [\n    "express",\n    "hello-world"\n  ],\n  "author": "Jatin Shridhar",\n  "license": "MIT",\n  "dependencies": {\n    "express": "^4.15.0"\n  }\n}`);
                resolve(true);
            } else {
                try {
                const status = await this.run(`git clone ${repoURL} tmp/${repoName}`);
                resolve(status);
                } catch (e) {
                    reject(e);
                }
            }
        });
    }
}
