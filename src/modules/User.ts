import { Session } from "./Session";
import { UserHandler } from "./UserHandler";

export class User {
    public forSession: Session;
    public UserHandler: UserHandler;

    constructor(forSession: Session, UH: UserHandler) {
        this.forSession = forSession;
        this.UserHandler = UH;
    }

    public logout() {
        this.UserHandler.Users.delete(this.forSession.id);
    }
}