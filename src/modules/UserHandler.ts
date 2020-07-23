import { Session } from "./Session";
import { User } from "./User";

export class UserHandler {
    public Users: Map<string, User> = new Map();

    // tslint:disable-next-line: no-empty
    constructor() {}

    public addUser(forSession: Session) {
        const newUser = new User(forSession, this);
        this.Users.set(forSession.id, newUser);

        return newUser;
    }

    public removeUser(forSession: Session) {
        this.Users.delete(forSession.id);
    }
}