import CbpClient, { CbpMessenger, CbpTab, IMessengerEvent } from "cbp-client";
import path from "path";
import fs from "fs";
const qr = require('qr-image');

export async function whatsAppLogin(client:CbpClient):Promise<CbpMessenger>
{
    const logger=client.logger;
    const tmpFolder=(await client.getBotData()).tmpFolder;
    const whatsApp=await client.getMessenger("whatsapp");
    const browser=await client.getBrowser();
  
    const imgPath=path.join(tmpFolder,"qr.svg");
    var htmlString = `
    <!DOCTYPE html> 
    <html>
    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding:0;">
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 300px; height: 400px;">
            <p>Open WhatsApp on your phone and scan the following QR code:</p>
            <img src="file://`+imgPath+`" width="300" height="300" alt="QR Code">
        </div>
    </body>
    </html>
    `;
    
    const htmlPath=path.join(tmpFolder,"qr.html");
    fs.writeFileSync(htmlPath,htmlString);

    let tab:CbpTab|undefined;
  
    return new Promise<CbpMessenger>((resolve,reject)=>{
        whatsApp.onMessengerEvent=async(event:IMessengerEvent)=>{
            if(event.event==="doLogin") {
              const qrCode=event.data!;
              var qr_svg = qr.image(qrCode, { type: 'svg', size: 3 });
              qr_svg.pipe(fs.createWriteStream(imgPath));
              await logger.clear();
              await logger.logImage(imgPath,{w:300,h:300});
              if(!tab) {
                tab=await browser.openTabData({tabName:"QCCode",w:400,h:500,hidden:false,url:"file://"+htmlPath});
              }
            }
            if(event.event==="isReady") {
                if(event.data.AUTHENTICATED) {
                    await browser.closeTab(["QCCode"]);
                    resolve(whatsApp);
                }
              }
          };
    });
}