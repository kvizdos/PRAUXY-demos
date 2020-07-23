import { exec } from "child_process";
import fs from "fs";
import { ServiceHandler } from "../ServicesHandler";

type ServiceTypes = "nodejs" | "static" | "unknown";
type DockerStatus = "online" | "offline";

interface DockerList {
    id: string;
    status: DockerStatus;
}

export class Docker extends ServiceHandler {
    constructor() {
        super();
    }

    public async getDocker(sessionID: string) {
        return new Promise<DockerList>(async (resolve, reject) => {
            try {
                const all = new Map<string, DockerList>();
                (await this.run("docker ps -a")).split("\n").slice(1).map((row) => {
                    return row.split(/\s{2,}/gm).filter((i) => {
                        return i.length > 0;
                    });
                }).forEach((row: string[]) => {
                    if (row.length != 0) {
                        const id = row.slice(-1)[0];
                        const status = row.slice(-3)[0].indexOf("Up") == 0 ? "online" : "offline";
                        const Info: DockerList = {
                            id,
                            status
                        };

                        all.set(Info.id, Info);
                    }
                });
                resolve(all.get(sessionID));
            } catch (e) {
                reject(e);
            }
        });
    }

    public async removeDocker(id: string, kill: boolean = false) {
        return new Promise(async (resolve, reject) => {
            try {
                if (kill) { await this.run(`docker kill ${id}`); }
                await this.run(`docker rm ${id}`);
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    public async killDocker(id: string) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.run(`docker kill ${id}`);
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    public async start(sessionID: string,
                       port: number,
                       listeningOn: number,
                       processEnvPortName?: string) {
        return new Promise(async (resolve, reject) => {
            const Service = fs.readdirSync(`repos/gh/${sessionID}`);
            const Type = this.parseType(Service);

            if (Type == "unknown") { return reject("unknown type"); }

            try {
                const started = await this.startDocker(sessionID, Type, port, listeningOn, processEnvPortName);
                resolve(started);
            } catch (e) {
                reject(e);
            }
        });
    }

    public async waitUntilUp(port: number) {
        return new Promise(async (resolve, reject) => {
            const hasStarted = exec(`wait-port http://:${port}`);
            hasStarted.stdout?.on("data", (data) => {
                if (data.indexOf("Connected") >= 0) {
                    resolve(true);
                }
            });
        });
    }

    public async parsePort(sessionID: string, fileOverride?: string) {
        return new Promise<any>(async (resolve, reject) => {
            // tslint:disable-next-line: max-line-length
            const file = fs.readFileSync(`${__dirname}/../../repos/gh/${sessionID}/${fileOverride == undefined ? "index.js" : fileOverride}`).toString("utf-8");

            const PORT = -1;

            //  /\.listen\((?:(?:process\.env\.(\w+))|(\w+))/gm
            // 1 = process.env.<WHATEVER>
            // 2 = Variable / Port #

            // If 2:
            // new RegExp("(?:var|let|const)\\s"+FOUND+"\\s?=\\s?(\\w+)", "m")

            // detect requires:
            // \.listen\((?:(?:process\.env\.(\w+))|(\w+\.(?:[^,\n\s)]+))|(\w+))

            const broadCheck = /\.listen\((?:(?:process\.env\.(\w+))|(\w+))/m;
            const broadCheckMatch = broadCheck.exec(file);
            if (broadCheckMatch == null) {
                return resolve(-1); // Returns -1 to signfiy that no port was found.
            }

            if (broadCheckMatch[2] !== undefined) {
                // Has either a variable / PORT assigned
                if (broadCheckMatch[2].match(/[0-9]/) !== null) {
                    console.log(fileOverride + " " + broadCheckMatch[2] + " - 1");

                    return resolve(parseInt(broadCheckMatch[2], 10));
                } else {
                    const FOUND = broadCheckMatch[2];
                    // tslint:disable-next-line: max-line-length
                    const varEquals = new RegExp("(?:var|let|const)\\s" + FOUND + "\\s?=\\s?(process\\.env\\.\\w+|\\w+)", "m");
                    const matched = varEquals.exec(file);

                    if (matched == null) {
                        return resolve(-1);
                    } else {
                        const isNum = matched[1][0].match(/[0-9]/);
                        console.log(FOUND + " " + fileOverride + " " + matched[1] + " - 2");

                        return resolve(isNum ? parseInt(matched[1], 10) : matched[1]);

                    }
                }
            } else if (broadCheckMatch[1] !== undefined) {
                console.log(fileOverride + " " + broadCheckMatch[1] + " - 3");
                resolve(`process.env.${broadCheckMatch[1]}`);
            }

            resolve(-1);
        });
    }

    private parseType(files: string[]) {
        const isNodeJS = files.indexOf("package.json") >= -1;

        const type: ServiceTypes = isNodeJS ? "nodejs" : "unknown";

        return type;
    }

    private async startDocker(id: string,
                              type: ServiceTypes,
                              serverPort: number,
                              listeningOn: number,
                              processEnvPortName?: string) {
        return new Promise(async (resolve, reject) => {
            // tslint:disable-next-line: max-line-length
            console.log("Running: " + `docker run -p ${serverPort}:${listeningOn} -t -d -v "${__dirname}/../../repos/gh/${id}":/app ${processEnvPortName === undefined ? "" : `-e ${processEnvPortName}=${listeningOn}`} --name ${id} ${type === "nodejs" ? "node-slim" : "unknown"}`)
            await this.run(`docker run -p ${serverPort}:${listeningOn} -t -d -v "${__dirname}/../../repos/gh/${id}":/app ${processEnvPortName === undefined ? "" : `-e ${processEnvPortName}=${listeningOn}`} --name ${id} ${type === "nodejs" ? "node-slim" : "unknown"}`);

            resolve(true);
        });
    }
}
