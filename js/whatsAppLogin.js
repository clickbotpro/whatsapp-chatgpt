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
exports.whatsAppLogin = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const qr = require('qr-image');
function whatsAppLogin(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = client.logger;
        const tmpFolder = (yield client.getBotData()).tmpFolder;
        const whatsApp = yield client.getMessenger("whatsapp");
        const browser = yield client.getBrowser();
        const imgPath = path_1.default.join(tmpFolder, "qr.svg");
        var htmlString = `
    <!DOCTYPE html> 
    <html>
    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding:0;">
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 300px; height: 400px;">
            <p>Open WhatsApp on your phone and scan the following QR code:</p>
            <img src="file://` + imgPath + `" width="300" height="300" alt="QR Code">
        </div>
    </body>
    </html>
    `;
        const htmlPath = path_1.default.join(tmpFolder, "qr.html");
        fs_1.default.writeFileSync(htmlPath, htmlString);
        let tab;
        return new Promise((resolve, reject) => {
            whatsApp.onMessengerEvent = (event) => __awaiter(this, void 0, void 0, function* () {
                if (event.event === "doLogin") {
                    const qrCode = event.data;
                    var qr_svg = qr.image(qrCode, { type: 'svg', size: 3 });
                    qr_svg.pipe(fs_1.default.createWriteStream(imgPath));
                    yield logger.clear();
                    yield logger.logImage(imgPath, { w: 300, h: 300 });
                    if (!tab) {
                        tab = yield browser.openTabData({ tabName: "QCCode", w: 400, h: 500, hidden: false, url: "file://" + htmlPath });
                    }
                }
                if (event.event === "isReady") {
                    if (event.data.AUTHENTICATED) {
                        yield browser.closeTab(["QCCode"]);
                        resolve(whatsApp);
                    }
                }
            });
        });
    });
}
exports.whatsAppLogin = whatsAppLogin;
