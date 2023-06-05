"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cbp_client_1 = __importDefault(require("cbp-client"));
const ChatGptConversation_1 = __importDefault(require("./ChatGptConversation"));
const whatsAppLogin_1 = require("./whatsAppLogin");
const client = new cbp_client_1.default();
const logger = client.logger;
const contact2Conversation = new Map();
const respectContacts = new Array();
const isValidMsg = (msg) => {
    if (msg.type !== "chat") {
        return false;
    }
    if (!msg.body || msg.body.length === 0) {
        return false;
    }
    if (msg.fromMe) {
        return true;
    }
    if (respectContacts.length === 0) {
        return true;
    }
    for (const contact of respectContacts) {
        if (contact.id && (contact.id === msg.from || contact.id === msg.author)) {
            return true;
        }
        if (contact.name &&
            (contact.name === msg.from || contact.name === msg.author)) {
            return true;
        }
        if (contact.phone &&
            (contact.phone === msg.from || contact.phone === msg.author)) {
            return true;
        }
        if (contact.email &&
            (contact.email === msg.from || contact.email === msg.author)) {
            return true;
        }
    }
    return false;
};
const getInitialMsg = () => {
    if (!process.env.initialMsg) {
        return undefined;
    }
    const trimmed = process.env.initialMsg.trim();
    if (trimmed.length === 0) {
        return undefined;
    }
    return trimmed;
};
const getConversationByChatID = (chatId) => {
    if (!contact2Conversation.has(chatId)) {
        contact2Conversation.set(chatId, new ChatGptConversation_1.default(client, getInitialMsg()));
    }
    return contact2Conversation.get(chatId);
};
const fillContactsToRespect = (whatsApp) => __awaiter(void 0, void 0, void 0, function* () {
    const contactsStr = process.env.contacts;
    if (!contactsStr || contactsStr.trim().length === 0) {
        return;
    }
    const split = contactsStr.split(",");
    const allTrimmed = split.map((s) => s.trim());
    const allContacts = yield whatsApp.getContacts();
    for (const c of allContacts) {
        if ((c.id && allTrimmed.includes(c.id)) ||
            (c.name && allTrimmed.includes(c.name)) ||
            (c.phone && allTrimmed.includes(c.phone))) {
            respectContacts.push(c);
        }
    }
});
const f = () => __awaiter(void 0, void 0, void 0, function* () {
    yield client.connect();
    const whatsApp = yield (0, whatsAppLogin_1.whatsAppLogin)(client);
    yield logger.log("Logged in. Waiting for icoming messages...");
    yield fillContactsToRespect(whatsApp);
    whatsApp.onMessengerEvent = (e) => __awaiter(void 0, void 0, void 0, function* () {
        if (e.event === "receiveMessage") {
            const msg = e.data;
            if (!isValidMsg(msg)) {
                return false;
            }
            yield logger.log(msg.from + ">", msg.body);
            try {
                const conversation = getConversationByChatID(msg.from);
                const chatGptReply = yield conversation.sendUserMsg(msg.body);
                const didSend = yield whatsApp.sendTextMessage(msg.from, chatGptReply);
                const lineBreakToBr = chatGptReply.replace(/\n/g, "<br/>");
                yield logger.logHtml("ChatGPT>", lineBreakToBr);
            }
            catch (e) {
                yield logger.error(e.message, e);
            }
        }
    });
    yield client.pause();
    yield client.disconnect();
});
f().catch(console.error);
