import fs from "fs";
import { Git } from "../services/git";

test("should pull a GitHub repo", async (done) => {
    const git = new Git();
    const pulled = await git.pull("https://github.com/jatins/express-hello-world.git", "1234");

    expect(pulled.files.length).toBe(2);

    const repoExists = fs.existsSync(`repos/gh/${pulled.sessionID}`);

    expect(repoExists).toBe(true);

    git.cleanup();

    done();
});
