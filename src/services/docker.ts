import fs from "fs";
import { ServiceHandler } from "../ServicesHandler";
import { exec } from "child_process";

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

    public async start(sessionID: string, port: number) {
        return new Promise(async (resolve, reject) => {
            const Service = fs.readdirSync(`repos/gh/${sessionID}`);
            const Type = this.parseType(Service);

            if (Type == "unknown") { return reject("unknown type"); }

            try {
                const started = await this.startDocker(sessionID, Type, port);
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
        })
    }

    private parseType(files: string[]) {
        const isNodeJS = files.indexOf("package.json") >= -1;

        const type: ServiceTypes = isNodeJS ? "nodejs" : "unknown";

        return type;
    }

    private async startDocker(id: string, type: ServiceTypes, serverPort: number) {
        return new Promise(async (resolve, reject) => {
            // tslint:disable-next-line: max-line-length
            await this.run(`docker run -p ${serverPort}:3000 -t -d -v "${__dirname}/../../repos/gh/${id}":/app --name ${id} ${type === "nodejs" ? "node-slim" : "unknown"}`);

            resolve(true);
        });
    }
}
