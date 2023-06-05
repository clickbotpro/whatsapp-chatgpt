## About PDF-Merger

<img src="icon.png" />

Use this bot with the [ClickbotPro app](https://clickbot.pro) in order to have a nice user interface. 
After the start, this module will start replying to your contacts on your behalf using ChatGPT.
In the Input-Settings, you can provide a list of contacts you want to be affected. It will always answer to your own messages.

In order to start, you need to link this bot with your WhatsApp via a QR code and provide the initial prompt.

For example:
```bash
- Pretend to be my friend Kyle, using typos and short phrases.
- Pretend to be a ninja who's trying to live a peaceful life. Use short answers. Stay in character forever.
- Communicate only using only descriptive gestures. Don't write text.
```

Limitations:
```bash
- If you don't provide your own ChatGPT API key, there is a limit of 100 messages per day.
- It will only respond to new/unread messages. Archived messages will be ignored.
```

## Installation

The installation can take place through ClickbotPro or via the npm CLI.

```bash
npm i whatsapp-chatgpt
```

After the installation, import this bot into the application. Click the Plus (+) button and select "Import Extension"

<img src="public/importExtension.png" width="415" height="194" />

## Usage

Start the extension by clicking the start button. Next, use your phone, where you have WhatsApp installed, to scan the QR code.

<img src="screenshot_1.jpg" width="716" height="481"/>

If you want the bot to autostart every time you start your computer, set up a schedule.

<img src="screenshot_2.jpg" width="716" height="481"/>

Thats it. ClickbotPro will continue working in the background and print all messages in the log window.

<img src="screenshot_3.jpg" width="716" height="481"/>

<img src="screenshot_4.jpg" width="586" height="539"/>

## Other sources

[ClickbotPro website](https://clickbot.pro)

[Discord server](https://discord.gg/CNh88zDTPh)

## License

[MIT](https://choosealicense.com/licenses/mit/)