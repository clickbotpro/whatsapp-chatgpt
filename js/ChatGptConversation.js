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
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("openai");
let openai;
if (process.env.chatgpt_api_key && process.env.chatgpt_api_key.length > 1) {
    const configuration = new openai_1.Configuration({
        apiKey: process.env.chatgpt_api_key
    });
    openai = new openai_1.OpenAIApi(configuration);
}
class ChatGptConversation {
    constructor(client, initialSystemMessage) {
        this.messages = new Array();
        this.client = client;
        this.initialSystemMessage = initialSystemMessage;
    }
    sendUserMsg(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendMsg("user", msg);
        });
    }
    sendMsg(role, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const newMsgToSend = { role, msg };
            const msgDataToSend = new Array();
            if (this.initialSystemMessage) {
                msgDataToSend.push({ role: "system", msg: this.initialSystemMessage });
            }
            msgDataToSend.push(...this.messages);
            msgDataToSend.push(newMsgToSend);
            const pars = {
                max_tokens: 1000,
                messages: msgDataToSend,
                model: "gpt-3.5-turbo",
                temperature: 0.6,
            };
            let answer;
            if (openai) {
                answer = yield this.openAIsendChatgpt(pars); //can throw error
            }
            else {
                answer = yield this.client.services.chatgpt(pars); //can throw error
            }
            this.messages.push(newMsgToSend);
            this.messages.push({ role: "assistant", msg: answer });
            if (this.messages.length > 50) {
                //remove first messages so the length is 10
                this.messages.splice(0, this.messages.length - 50);
            }
            return answer;
        });
    }
    openAIsendChatgpt(chatGptContent) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestMsgList = new Array();
            chatGptContent.messages.forEach((msg) => {
                const r = {
                    content: msg.msg,
                    role: msg.role,
                };
                requestMsgList.push(r);
            });
            const chatResponse = yield openai.createChatCompletion({
                model: chatGptContent.model,
                messages: requestMsgList,
                max_tokens: Math.min(4096, chatGptContent.max_tokens),
                temperature: chatGptContent.temperature,
                stop: "",
                n: 1,
            });
            if (chatResponse.status !== 200) {
                throw new Error("openai api error " + chatResponse.status);
            }
            const answers = new Array();
            chatResponse.data.choices.forEach((c) => {
                const cc = c.message;
                answers.push(cc);
            });
            return answers[0].content;
        });
    }
}
exports.default = ChatGptConversation;
