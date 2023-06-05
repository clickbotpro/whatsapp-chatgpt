import CbpClient, {
  CbpMessenger,
  IMessengerContact,
  IMessengerMsg,
} from "cbp-client";
import ChatGptConversation from "./ChatGptConversation";
import { whatsAppLogin } from "./whatsAppLogin";

const client = new CbpClient();
const logger = client.logger;
const contact2Conversation = new Map<string, ChatGptConversation>();
const respectContacts = new Array<IMessengerContact>();

const isValidMsg = (msg: IMessengerMsg): boolean => {
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
    if (
      contact.name &&
      (contact.name === msg.from || contact.name === msg.author)
    ) {
      return true;
    }
    if (
      contact.phone &&
      (contact.phone === msg.from || contact.phone === msg.author)
    ) {
      return true;
    }
    if (
      contact.email &&
      (contact.email === msg.from || contact.email === msg.author)
    ) {
      return true;
    }
  }
  return false;
};

const getInitialMsg = (): string | undefined => {
  if (!process.env.initialMsg) {
    return undefined;
  }
  const trimmed = process.env.initialMsg.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed;
};

const getConversationByChatID = (chatId: string): ChatGptConversation => {
  if (!contact2Conversation.has(chatId)) {
    contact2Conversation.set(
      chatId,
      new ChatGptConversation(client, getInitialMsg())
    );
  }
  return contact2Conversation.get(chatId)!;
};

const fillContactsToRespect = async (whatsApp: CbpMessenger) => {
  const contactsStr = process.env.contacts;
  if (!contactsStr || contactsStr.trim().length === 0) {
    return;
  }
  const split = contactsStr.split(",");
  const allTrimmed = split.map((s) => s.trim());
  const allContacts = await whatsApp.getContacts();
  for (const c of allContacts) {
    if (
      (c.id && allTrimmed.includes(c.id)) ||
      (c.name && allTrimmed.includes(c.name)) ||
      (c.phone && allTrimmed.includes(c.phone))
    ) {
      respectContacts.push(c);
    }
  }
};

const f = async () => {
  await client.connect();

  const whatsApp = await whatsAppLogin(client);
  await logger.log("Logged in. Waiting for icoming messages...");

  await fillContactsToRespect(whatsApp);

  whatsApp.onMessengerEvent = async (e) => {
    if (e.event === "receiveMessage") {
      const msg = e.data as IMessengerMsg;
      if (!isValidMsg(msg)) {
        return false;
      }
      await logger.log(msg.from+">", msg.body);
      try {
        const conversation = getConversationByChatID(msg.from!);
        const chatGptReply = await conversation.sendUserMsg(msg.body);
        const didSend = await whatsApp.sendTextMessage(msg.from!, chatGptReply);
        const lineBreakToBr = chatGptReply.replace(/\n/g, "<br/>");
        await logger.logHtml("ChatGPT>",lineBreakToBr);
      } catch (e: any) {
        await logger.error(e.message, e);
      }
    }
  };

  await client.pause();
  await client.disconnect();
};
f().catch(console.error);
