import { Session } from "../modules/Session";

test("should initialize a session", async (done) => {
    const sess = new Session("https://github.com/test/test.git");

    await sess.init("test");

    const isRunning = await sess.docker.getDocker(sess.id);

    await sess.docker.removeDocker(sess.id, true);
    sess.git.cleanup();

    expect(isRunning.id).toBe(sess.id);
    expect(isRunning.status).toBe("online");

    done();
});
