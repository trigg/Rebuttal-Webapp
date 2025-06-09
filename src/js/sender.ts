import { Sender, SendMessage, UserUUID, UUID, VideoReqType, type Message, type RoomUUID } from "./types";

export function create_sender(): Sender {
    return {
        ws: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        raw: function (json: any): void {
            this.ws?.send(JSON.stringify(json));
        },
        login: function (email: string, password: string, protocol: string) {
            this.raw({ type: 'login', email, password, protocol });
        },
        video: function (payload: VideoReqType | RTCIceCandidateInit | RTCSessionDescriptionInit, touserid: string) {
            console.log({ type: 'video', touserid, payload })
            this.raw({ type: 'video', touserid, payload });
        },
        letmesee: function (touserid: UserUUID, fromuserid: UserUUID, message: boolean) {
            this.raw({ type: 'letmesee', touserid, fromuserid, message });
        },
        chatdev: function (audio: boolean, video: boolean) {
            this.raw({ type: 'chatdev', audio, video });
        },
        update_message: function (roomid: RoomUUID, messageid: number, message: Message) {
            this.raw({ type: 'updatemessage', roomid, messageid, message })
        },
        contextoption: function (context: string, option: string, value: string) {
            this.raw({ type: 'contextoption', context, option, value });
        },
        message: function (roomid: RoomUUID, message: SendMessage) {
            this.raw({ type: 'message', roomid, message });
        },
        message_with_upload: function (roomid: RoomUUID, message: SendMessage, filename: string, rawfile: string) {
            this.raw({ type: 'message', roomid, message, filename, rawfile });
        },
        get_messages: function (roomid: RoomUUID, segment?: number) {
            this.raw({ type: 'getmessages', roomid, segment });
        },
        join_room: function (roomid: RoomUUID) {
            this.raw({ type: 'joinroom', roomid });
        },
        leave_room: function () {
            this.raw({ type: 'leaveroom' });
        },
        invite(group_name: string) {
            this.raw({ type: 'invite', group_name });
        },
        signup(sign_up: UUID, user_name: string, email: string, password: string) {
            this.raw({ type: 'signup', signUp: sign_up, userName: user_name, email, password })
        },
        talking(userid: UserUUID, talking: boolean) {
            this.raw({ type: "talking", talking, userid });
        },
    }
}