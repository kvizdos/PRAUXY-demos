import { Docker } from "../services/docker";

test("shouldn't find a container with an invalid name", async (done) => {
    const DOC = new Docker();

    const dockers = await DOC.getDocker("test");

    expect(dockers).toBe(undefined);

    done();
});

test("should start a NodeJS Docker", async (done) => {
    const DOC = new Docker();

    const startedDocker = await DOC.start("test", 80);

    expect(startedDocker).toBe(true);

    done();
});

it("should find a running container", async (done) => {
    const DOC = new Docker();

    const dockers = await DOC.getDocker("test");

    expect(dockers.id).toBe("test");
    expect(dockers.status).toBe("online");
    done();
});

it("should find a running container", async (done) => {
    const DOC = new Docker();

    await DOC.killDocker("test");
    const dockers = await DOC.getDocker("test");

    expect(dockers.id).toBe("test");
    expect(dockers.status).toBe("offline");
    done();
});

it("should remove a container", async (done) => {
    const DOC = new Docker();

    await DOC.removeDocker("test");

    const dockers = await DOC.getDocker("test");

    expect(dockers).toBe(undefined);
    done();
});