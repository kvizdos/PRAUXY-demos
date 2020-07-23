import { exec } from "child_process";

export class ServiceHandler {
    constructor() {}

    public run(cmd: string) {
        return new Promise<string>((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                if (err) { reject(stderr); }

                resolve(stdout);
            });
        });
    }
}
