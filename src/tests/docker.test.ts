import { Docker } from "../services/docker";

test("shouldn't find a container with an invalid name", async (done) => {
    const DOC = new Docker();

    const dockers = await DOC.getDocker("test");

    expect(dockers).toBe(undefined);

    done();
});

test("should start a NodeJS Docker", async (done) => {
    const DOC = new Docker();

    const startedDocker = await DOC.start("test", 80, 3000);

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

it("should find an offline container", async (done) => {
    const DOC = new Docker();

    await DOC.killDocker("test");
    const dockers = await DOC.getDocker("test");

    expect(dockers.id).toBe("test");
    expect(dockers.status).toBe("offline");
    done();
});

it("should catch an error when attempting to start two docker containers with identical names", async (done) => {
    const DOC = new Docker();

    DOC.start("test", 80, 3000).catch((e: string) => {
        expect(e.split(".")[0]).toBe("docker: Error response from daemon: Conflict");
        done();
    });

});

it("should remove a container", async (done) => {
    const DOC = new Docker();

    await DOC.removeDocker("test");

    const dockers = await DOC.getDocker("test");

    expect(dockers).toBe(undefined);
    done();
});

it("shouldn't remove an invalid container", async (done) => {
    const DOC = new Docker();

    DOC.removeDocker("badContainer").catch((e: string) => {
        expect(e).toBe("Error: No such container: badContainer\n");

        done();
    });
});

it("shouldn't kill an invalid container", async (done) => {
    const DOC = new Docker();

    DOC.killDocker("badContainer").catch((e: string) => {
        // tslint:disable-next-line: max-line-length
        expect(e).toBe("Error response from daemon: Cannot kill container: badContainer: No such container: badContainer\n");

        done();
    });
});

it("should properly detect ports in Node files", async (done) => {
    const DOC = new Docker();

    const staticPort               = await DOC.parsePort("test", "index.js");
    const variablePort             = await DOC.parsePort("test", "variablePort.js");
    const variablePortUndefined    = await DOC.parsePort("test", "variablePortUndefined.fjs");
    const envPort                  = await DOC.parsePort("test", "envPort.js");
    const variableEnvPort          = await DOC.parsePort("test", "variableEnvPort.js");
    const noPort                   = await DOC.parsePort("test", "noPort.fjs");

    const fromFound                = await DOC.parsePort("test");

    expect(staticPort).toBe(3000);
    expect(variablePort).toBe(3001);
    expect(variablePortUndefined).toBe(-1);
    expect(envPort).toBe("process.env.PORT");
    expect(variableEnvPort).toBe("process.env.VARIABLEPORT");
    expect(noPort).toBe(-1);

    expect(fromFound).toBe(3000);

    done();
})

test("should start a NodeJS Docker with process variable", async (done) => {
    const DOC = new Docker();

    const startedDocker = await DOC.start("test-process-variable", 8082, 8081, "PORT");

    expect(startedDocker).toBe(true);

    const dockers = await DOC.getDocker("test-process-variable");

    expect(dockers.id).toBe("test-process-variable");
    expect(dockers.status).toBe("online");

    const hasStarted = await DOC.waitUntilUp(8082);

    expect(hasStarted).toBe(true);

    await DOC.removeDocker("test-process-variable", true);

    done();
}, 60000);