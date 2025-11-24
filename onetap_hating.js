const defaults = {
    lombre_onetap_hating_onetap_class: '["icon_1.png", "icon_14.png", "icon_29.png"]',
    lombre_onetap_hating_you_text_color: '["rgb(255, 255, 255)", "#fff"]',
    lombre_onetap_hating_you_text_username: "You",
    lombre_onetap_hating_status: true
}

// Initialize localStorage if values don't exist
Object.keys(defaults).forEach(key => {
    if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, defaults[key]);
        console.log(`[LombreScripts] [onetap_hating.js] ${key} created with default value: ${defaults[key]}`);
    }
});

// Check if script is enabled
const scriptStatus = localStorage.getItem('lombre_onetap_hating_status');
const isEnabled = scriptStatus === 'true' || scriptStatus === true;


if (!isEnabled) {
    console.log("[LombreScripts] [onetap_hating.js] Script is disabled (lombre_onetap_hating_status = false)");
    return; // Exit script
}

console.log("[LombreScripts] [onetap_hating.js] Script is enabled");

// Load configuration
const config = {
    OTWEAPON: JSON.parse(localStorage.getItem('lombre_onetap_hating_onetap_class')),
    YOUCOLOR: JSON.parse(localStorage.getItem('lombre_onetap_hating_you_text_color')),
    YOUTEXT: localStorage.getItem("lombre_onetap_hating_you_text_username")
};


// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Counters
    let onetapDeaths = 0;
    let totalDeaths = 0;

    const onetapWeapons = config.OTWEAPON; // Sniper, Crossbow, Infiltrator

    // Function to display the counters
    function updateCounters() {
        let counter = document.getElementById('deathCounter');
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'deathCounter';
            counter.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: #ff0000;
                padding: 10px 20px;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                z-index: 9999;
                border: 2px solid #ff0000;
                text-align: center;
            `;
            document.body.appendChild(counter);
        }

        counter.textContent = `One-Tap Deaths: ${onetapDeaths}/${totalDeaths}`;
    }

    // Function to check if it's a death
    function checkForDeath(chatItem) {
        const chatMsg = chatItem.querySelector('.chatMsg');
        if (!chatMsg) return {
            isDeath: false,
            isOnetap: false
        };

        // Check if "You" is present (victim)
        const youSpan = Array.from(chatMsg.querySelectorAll('span')).find(
            span => span.textContent === config.YOUTEXT && config.YOUCOLOR.includes(span.style.color)
        );
        if (!youSpan) return {
            isDeath: false,
            isOnetap: false
        };

        // Check if there's an enemy name (red)
        const enemyName = chatMsg.querySelector('span[style*="color:#eb5656"]');
        if (!enemyName) return {
            isDeath: false,
            isOnetap: false
        };

        // Check if there's a weapon icon (weapon OR melee)
        const weaponIcon = chatMsg.querySelector('.weaponChatIcon');
        const meleeIcon = chatMsg.querySelector('.meleeChatIcon');
        const thrownIcon = chatMsg.querySelector('.thrownChatIcon');

        if (!weaponIcon && !meleeIcon) return {
            isDeath: false,
            isOnetap: false
        };

        // Check the order: enemy -> icon -> You
        const msgHTML = chatMsg.innerHTML;
        const enemyIndex = msgHTML.indexOf(enemyName.outerHTML);
        const youIndex = msgHTML.indexOf(youSpan.outerHTML);

        // Find the icon index (weapon or melee)
        let iconIndex;
        if (weaponIcon) {
            iconIndex = msgHTML.indexOf(weaponIcon.outerHTML);
        } else if (meleeIcon) {
            iconIndex = msgHTML.indexOf(meleeIcon.outerHTML);
        }

        if (!(enemyIndex < iconIndex && iconIndex < youIndex)) {
            return {
                isDeath: false,
                isOnetap: false
            };
        }

        // It's a death, check if it's a one-tap
        let isOnetap = false;

        // Check normal weapons
        if (weaponIcon && onetapWeapons.some(weapon => weaponIcon.src.includes(weapon))) {
            isOnetap = true;
        }

        // Check thrown knives (thrownIcon + meleeIcon)
        if (thrownIcon && meleeIcon) {
            isOnetap = true;
        }

        return {
            isDeath: true,
            isOnetap: isOnetap
        };
    }

    // Observer to monitor new messages
    const chatObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.id && node.id.startsWith('chatMsg_')) {
                    const chatItem = node.querySelector('.chatItem');
                    if (chatItem) {
                        const result = checkForDeath(chatItem);

                        if (result.isDeath) {
                            totalDeaths++;

                            if (result.isOnetap) {
                                onetapDeaths++;
                                const enemyName = chatItem.querySelector('span[style*="color:#eb5656"]');
                                console.log(`One-Tap Death by ${enemyName?.textContent}!`);
                            }

                            updateCounters();
                            console.log(`Deaths - One-Tap: ${onetapDeaths}/${totalDeaths}`);
                        }
                    }
                }
            });
        });
    });

    // Start observing the chat
    const chatList = document.getElementById('chatList');
    if (chatList) {
        chatObserver.observe(chatList, {
            childList: true,
            subtree: true
        });
        updateCounters();
        console.log('Death Counter initialized!');
    } else {
        console.error('chatList not found!');
    }
});
