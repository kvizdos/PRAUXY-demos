import { Docker } from "../services/docker";
import { Git } from "../services/git";

export class Session {
    public id: string;
    public repo: string;
    public git: Git;
    public docker: Docker;
    public port: number;

    constructor(repo: string) {
        this.repo = repo;
        this.id = this.generateSID();
        this.git = new Git();
        this.docker = new Docker();
        this.port = Math.floor(Math.random() * 8000) + 10000;
    }

    public async init(testingID?: string) {
        return new Promise<string>(async (resolve, reject) => {
            let listeningOn: any = await this.docker.parsePort(testingID || this.id);

            const requiresProcessEnv = typeof listeningOn == "string" ? listeningOn.includes("process.env") : undefined;

            const processEnvVar = requiresProcessEnv ? listeningOn.split(".")[2] : undefined;

            listeningOn = requiresProcessEnv ? Math.floor(Math.random() * 8000) + 10000 : listeningOn;

            await this.git.pull(this.repo, this.id);
            await this.docker.start(this.id, this.port, listeningOn, processEnvVar);
            if (process.env.NODE_ENV != "test") {
                await this.docker.waitUntilUp(this.port);
            }
            resolve(this.id);
        });
    }

    private generateSID(length: number = 64) {
        const opts = "1234567890abcdefghijklmnopqrstuvwxyz";
        return new Array(length).fill(0).map((i) => opts[Math.floor(Math.random() * opts.length)]).join("");
    }
}
