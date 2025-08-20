require('dotenv').config();
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const sendErrorToTelegram = async function (errorObj) {

    if (process.env.ENV === 'test') {
        console.log('Skipping Telegram message in test environment');
        return;
    }

    let errorMessage;

    // Check if errorObj is an object, then stringify
    if (typeof errorObj === 'object' && errorObj !== null) {
        errorMessage = JSON.stringify(errorObj, null, 2);

        const maxLength = 4000;
        if (errorMessage.length > 4000) {
            const half = Math.floor(maxLength / 2);
            errorMessage = errorMessage.substring(0, half) + '... (truncated) ...' + errorMessage.substring(errorMessage.length - half);
        }

        // Apply Markdown formatting if it's an object
        errorMessage = `🚨 *Error Alert* 🚨\n\n\`\`\`${errorMessage}\`\`\``;
    } else {
        // If it's not an object, just convert it to string and avoid Markdown
        errorMessage = `🚨 *Error Alert* 🚨\n\n*${String(errorObj)}*`;
    }

    const escapeMarkdownV2 = (text) => {
        return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    };

    errorMessage = `🚨 *Error Alert* 🚨\n\n\`\`\`${escapeMarkdownV2(errorMessage)}\`\`\``;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    return axios
        .post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: errorMessage,
            parse_mode: 'MarkdownV2',
        })
        .catch((err) => console.error('Failed to send Telegram message:', err));
};

export default sendErrorToTelegram;