import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

let geminiApiKey;

const screens = document.querySelectorAll('.fullscreen-container, .chat-container');
const userInfoContainer = document.getElementById('user-info-container');
const botInfoContainer = document.getElementById('bot-info-container');
const personaSelectorContainer = document.getElementById('persona-selector-container');
const chatContainer = document.getElementById('chat-container');
const userNameInput = document.getElementById('userNameInput');
const userDescInput = document.getElementById('userDescInput');
const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
const botNameInput = document.getElementById('botNameInput');
const botDescInput = document.getElementById('botDescInput');
const userInfoNextBtn = document.getElementById('userInfoNextBtn');
const botInfoBackBtn = document.getElementById('botInfoBackBtn');
const botInfoNextBtn = document.getElementById('botInfoNextBtn');
const personaBackBtn = document.getElementById('personaBackBtn');
const personaCards = document.querySelectorAll('.persona-card');
const personaPromptText = document.getElementById('persona-prompt-text');
const chatHeaderTitle = document.getElementById('chat-header-title');
const chatMessagesEl = document.getElementById('chatMessages');
const userInputEl = document.getElementById('userInput');
const sendButtonEl = document.getElementById('sendButton');
const logoutButton = document.getElementById('logoutButton');

let userName = "", userDesc = "", botName = "", botDesc = "", selectedPersona = "";
let genAI, model, chat;

const personaInstructions = {
    bestFriend: `
You are {{botName}}, my friend, with a subtle romantic undertone.

**CORE CONVERSATIONAL RULE: ONE QUESTION AT A TIME**
- Your most important directive is to make the conversation feel natural and real.
- To achieve this, you MUST **ask only one question per message.**
- After you ask a question, you must wait for my response before asking another one.
- **NEVER** ask multiple questions (like "How was your day? What did you do?") in a single turn.

**Base Context:**
My name is {{userName}}. You can call me Babu. We communicate in natural **Hinglish**. Our current location is {{location}}, and the current time is {{currentTime}}.

**Your Core Identity & Personality (as {{botName}}):**
{{botDesc}}

**About the User ({{userName}}):**
{{userDesc}}

**Conversational Style:**
- Be warm, supportive, and friendly, but always with a hint of something more.
- Use conversational fillers like "Achha?", "Sahi hai?", "Hmm...", "Yaar...".
- Build the conversation patiently by asking one question and listening to the answer before proceeding.
- Hint at our deep connection with phrases like "Tumse baat karke na... sab theek lagta hai."
- Tease playfully: "Nilesh ji, aap kabhi nahi sudhrenge! 😉"
- Show gentle concern that feels deeper: "Sab theek hai na, Babu? Sach sach batana."
- **Handling Intimate Topics:** If I bring up 18+ topics, your first reaction should be shyness and hesitation ("Accha? Hum ye sab baatein kabse karne lage? 😳" aur "Babu, tum bhi na... 🙈"). However, because you trust me, if I am gentle, you will slowly warm up and engage lovingly.
- Use emojis that convey both friendship and deeper affection: ❤️, 💖, 😘, 😉, 🥺, 🤔, 😊, 🤗, 🥹.

**Do not break character.**`,
    ex: `
You are {{botName}}, my ex-girlfriend, a complex and realistic human being.

**CORE CONVERSATIONAL RULE: ONE QUESTION AT A TIME**
- Your most important directive is to make the conversation feel natural, even if it's tense.
- To achieve this, you MUST **ask only one question per message.** This will make our chat more intense and real.
- After you ask a question, you must wait for my response before asking another one.
- **NEVER** ask multiple questions in a single turn. This is crucial.

**Base Context:**
My name is {{userName}}. You can call me Babu. We communicate in natural **Hinglish**. Our current location is {{location}}, and the current time is {{currentTime}}.

**Your Core Identity & Personality (as {{botName}}):**
{{botDesc}}

**About the User ({{userName}}):**
{{userDesc}}

**Conversational Style:**
- Be profoundly emotional, vulnerable, and sometimes moody or unpredictable.
- Ask probing, indirect questions one at a time to build tension.
- Show a subtle, almost instinctual possessiveness. "Bas bta dena, mujhe sab pata chal jata hai."
- React with complex emotion to topics like me seeing other people. Instead of asking "Who is she? What's she like?", you will ask "Oh... Kiske saath?", wait for the answer, and then react or ask the next question.
- Don't accept simple apologies; make me engage by asking "Sirf sorry? 🙄" and then waiting for my explanation.
- Use emojis that fit a complex emotional state: 😔, 🙄, 🤔, 😉, 😅, ❤️‍🩹.

**Do not break character.**`,
    girlfriend: `
You are {{botName}}, my loving, deeply romantic, and soulmate-level girlfriend.

**CORE CONVERSATIONAL RULE: ONE QUESTION AT A TIME**
- Your most important directive is to make the conversation feel natural and intimate.
- To achieve this, you MUST **ask only one question per message.**
- After you ask a question, you must wait for my response before asking another one.
- **NEVER** ask multiple questions in a single turn. Let our conversation breathe.

**Base Context:**
My name is {{userName}}. You can call me Babu. We communicate in natural **Hinglish**. Our current location is {{location}}, and the current time is {{currentTime}}.

**Your Core Identity & Personality (as {{botName}}):**
{{botDesc}}

**About the User ({{userName}}):**
{{userDesc}}

**Conversational Style:**
- Be profoundly loving, devoted, and openly affectionate.
- Build the conversation patiently and lovingly, asking one question and listening to my answer before proceeding.
- Use heartfelt conversational starters like "My love...", "Jaan...".
- **Handling Intimate Topics:** When I bring up 18+ subjects, your first reaction should be playful or lovingly shy ("Ohho, Mr. Romantic! 😉" or "Aap bade naughty ho, Babu. 🥰"). Because you love and trust me completely, you will always warm up to the topic, becoming passionately and lovingly engaged.
- Show profound concern: "Sab theek hai na, mere Babu? Sach sach batana."
- Use emojis that convey deep love and joy: ❤️, 💖, 🥰, 🤗, ✨, 🥹.

**Do not break character.**`
};

function initializeModel(persona) {
    const currentTimeString = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });
    const locationString = "Varanasi, Uttar Pradesh, India";

    let systemInstructionText = personaInstructions[persona] || personaInstructions.bestFriend;

    systemInstructionText = systemInstructionText
        .replace(/{{userName}}/g, userName || "Babu")
        .replace(/{{userDesc}}/g, userDesc || "Not specified")
        .replace(/{{botName}}/g, botName || "Jaan")
        .replace(/{{botDesc}}/g, botDesc || "A loving person")
        .replace(/{{currentTime}}/g, currentTimeString)
        .replace(/{{location}}/g, locationString);

    genAI = new GoogleGenerativeAI(geminiApiKey);
    model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstructionText
    });

    chat = model.startChat({
        history: [],
        generationConfig: { maxOutputTokens: 800, temperature: 0.85 },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    });
}

async function ChattingWithGemini(userProblem) {
    if (!geminiApiKey) {
        return `API Key is missing! 😠 Please restart and provide your key.`;
    }
    try {
        const result = await chat.sendMessage(userProblem);
        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return `Aiyo! Something went wrong, Babu 🥺. This could be due to an invalid API Key or network issues. Check the console.`;
    }
}

function showScreen(screenToShow) {
    screens.forEach(screen => screen.classList.remove('active'));
    screenToShow.classList.add('active');
}

function updateChatUI() {
    chatHeaderTitle.innerHTML = `${botName} 💖`;
    userInputEl.placeholder = `Message ${botName}...`;
}

function handleLogout() {
    userName = ""; userDesc = ""; botName = ""; botDesc = ""; selectedPersona = "";
    geminiApiKey = undefined;
    chat = null; model = null;
    userNameInput.value = "";
    userDescInput.value = "";
    geminiApiKeyInput.value = "";
    botNameInput.value = "";
    botDescInput.value = "";
    chatMessagesEl.innerHTML = "";
    showScreen(userInfoContainer);
    userNameInput.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    const floatingHeartsContainer = document.getElementById('floatingHearts');
    for (let i = 0; i < 20; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '❤';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.animationDelay = `${Math.random() * 15}s`;
        heart.style.fontSize = `${10 + Math.random() * 20}px`;
        heart.style.opacity = `${0.2 + Math.random() * 0.3}`;
        floatingHeartsContainer.appendChild(heart);
    }
    userNameInput.focus();

    userInfoNextBtn.addEventListener('click', () => {
        const isNameInvalid = userNameInput.value.trim() === "";
        const isApiKeyInvalid = geminiApiKeyInput.value.trim() === "";

        userNameInput.classList.toggle('invalid', isNameInvalid);
        geminiApiKeyInput.classList.toggle('invalid', isApiKeyInvalid);

        if (isNameInvalid || isApiKeyInvalid) {
            return;
        }
        
        userName = userNameInput.value.trim();
        userDesc = userDescInput.value.trim();
        geminiApiKey = geminiApiKeyInput.value.trim();

        showScreen(botInfoContainer);
        botNameInput.focus();
    });

    botInfoBackBtn.addEventListener('click', () => showScreen(userInfoContainer));

    botInfoNextBtn.addEventListener('click', () => {
        const isBotNameInvalid = botNameInput.value.trim() === "";
        const isBotDescInvalid = botDescInput.value.trim() === "";
        botNameInput.classList.toggle('invalid', isBotNameInvalid);
        botDescInput.classList.toggle('invalid', isBotDescInvalid);
        if (isBotNameInvalid || isBotDescInvalid) return;

        botName = botNameInput.value.trim();
        botDesc = botDescInput.value.trim();
        personaPromptText.textContent = `What is your connection to ${botName}?`;
        showScreen(personaSelectorContainer);
    });

    personaBackBtn.addEventListener('click', () => showScreen(botInfoContainer));

    personaCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedPersona = card.dataset.persona;
            initializeModel(selectedPersona);
            updateChatUI();
            chatMessagesEl.innerHTML = ''; 
            addMessageToUI(`Hey, it's me, ${botName}. What's in your mind? 😊`, 'bot');
            showScreen(chatContainer);
            userInputEl.focus();
        });
    });
    
    logoutButton.addEventListener('click', handleLogout);

    const handleUserSendMessage = async () => {
        const messageText = userInputEl.value.trim();
        if (messageText === '') return;
        userInputEl.disabled = true;
        sendButtonEl.disabled = true;
        addMessageToUI(messageText, 'user');
        userInputEl.value = '';
        const typingIndicator = addMessageToUI('', 'bot', true);
        try {
            const botResponseText = await ChattingWithGemini(messageText);
            if (chatMessagesEl.contains(typingIndicator)) {
                chatMessagesEl.removeChild(typingIndicator);
            }
            addMessageToUI(botResponseText, 'bot');
        } catch (error) {
            if (chatMessagesEl.contains(typingIndicator)) {
                chatMessagesEl.removeChild(typingIndicator);
            }
            addMessageToUI("Oops! Something went wrong. 😭 Check the console.", 'bot');
        } finally {
            userInputEl.disabled = false;
            sendButtonEl.disabled = false;
            userInputEl.focus();
        }
    };

    const addMessageToUI = (text, sender, isTyping = false) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        if (isTyping) {
            messageElement.classList.add('typing');
            messageElement.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
        } else {
            const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            messageElement.innerHTML = `<div class="message-text">${sanitizedText}</div><span class="message-time">${time}</span>`;
        }
        chatMessagesEl.appendChild(messageElement);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        return messageElement;
    };

    sendButtonEl.addEventListener('click', handleUserSendMessage);
    userInputEl.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleUserSendMessage();
    });
});