import CbpClient, * as jbdt from "cbp-client";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  Configuration,
  OpenAIApi,
} from "openai";

let openai: OpenAIApi | undefined;
if (process.env.chatgpt_api_key && process.env.chatgpt_api_key.length > 1) {
  const configuration = new Configuration({
    apiKey: process.env.chatgpt_api_key
  });
  openai = new OpenAIApi(configuration);
}

type MsgRole = "system" | "user" | "assistant";
type MsgType = { role: MsgRole; msg: string };

class ChatGptConversation {
  private messages = new Array<MsgType>();
  private client: CbpClient;
  private initialSystemMessage?: string;

  constructor(client: CbpClient, initialSystemMessage?: string) {
    this.client = client;
    this.initialSystemMessage = initialSystemMessage;
  }

  public async sendUserMsg(msg: string): Promise<string> {
    return this.sendMsg("user", msg);
  }

  public async sendMsg(role: MsgRole, msg: string): Promise<string> {
    const newMsgToSend: MsgType = { role, msg };
    const msgDataToSend = new Array<MsgType>();
    if(this.initialSystemMessage) {
        msgDataToSend.push({ role: "system", msg: this.initialSystemMessage });
    }
    msgDataToSend.push(...this.messages);
    msgDataToSend.push(newMsgToSend);
    const pars: jbdt.IServiceDataChatGptContent = {
      max_tokens: 1000,
      messages: msgDataToSend,
      model: "gpt-3.5-turbo",
      temperature: 0.6,
    };
    let answer: string;
    if(openai) {
        answer = await this.openAIsendChatgpt(pars); //can throw error
    } else {
        answer = await this.client.services.chatgpt(pars); //can throw error
    }
    this.messages.push(newMsgToSend);
    this.messages.push({ role: "assistant", msg: answer });
    if (this.messages.length > 50) {
      //remove first messages so the length is 10
      this.messages.splice(0, this.messages.length - 50);
    }
    return answer;
  }

  private async openAIsendChatgpt(
    chatGptContent: jbdt.IServiceDataChatGptContent
  ): Promise<string> {
    const requestMsgList = new Array<ChatCompletionRequestMessage>();
    chatGptContent.messages.forEach((msg) => {
      const r: ChatCompletionRequestMessage = {
        content: msg.msg,
        role: msg.role,
      };
      requestMsgList.push(r);
    });
    const chatResponse = await openai!.createChatCompletion({
      model: chatGptContent.model, // "gpt-3.5-turbo",
      messages: requestMsgList,
      max_tokens: Math.min(4096, chatGptContent.max_tokens),
      temperature: chatGptContent.temperature,
      stop: "",
      n: 1,
    });
    if (chatResponse.status !== 200) {
      throw new Error("openai api error " + chatResponse.status);
    }
    const answers = new Array<ChatCompletionResponseMessage>();
    chatResponse.data.choices.forEach((c) => {
      const cc: ChatCompletionResponseMessage = c.message!;
      answers.push(cc);
    });
    return answers[0].content;
  }
}

export default ChatGptConversation;
