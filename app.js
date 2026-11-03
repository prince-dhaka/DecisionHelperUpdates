// Global Uncaught Error Boundary Shield (Prevents JS crashes from freezing the UI)
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.warn('Handled Global Error:', msg, 'at line', lineNo);
    return true; // Suppress uncaught error propagation to keep app running
};
window.addEventListener('unhandledrejection', function(e) {
    console.warn('Handled Promise Rejection:', e.reason);
    e.preventDefault();
});

// Hosted Backend Server URL. If running locally or empty, relative paths will be used.
window.BACKEND_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname) ? "" : "https://decisionhelper-c0e3.onrender.com";

// Pros & Cons Helper - Dropdown & Flyout Outliner Logic
let state = {
    categories: [
        {
            name: 'Drafts',
            decisions: [
                { id: 'dec_draft_default', topic: '', pros: [''], cons: [''] }
            ]
        },
        {
            name: 'Career',
            decisions: []
        },
        {
            name: 'Relationships',
            decisions: []
        },
        {
            name: 'Health',
            decisions: []
        }
    ],
    activeCategoryName: 'Drafts',
    activeDecisionId: 'dec_draft_default'
};

// DOM Elements
const topicInput = document.getElementById('topicInput');
const advantagesList = document.getElementById('advantagesList');
const disadvantagesList = document.getElementById('disadvantagesList');
const copyMarkdownBtn = document.getElementById('copyMarkdownBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const toast = document.getElementById('toast');
const footerActions = document.querySelector('.footer-actions');

// Menu DOM Elements
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const menuOverlay = document.getElementById('menuOverlay');
const areasList = document.getElementById('areasList');

// New DOM Elements for AI Chat and Password Lock
const floatingChatBtn = document.getElementById('floatingChatBtn');
const aiChatPanel = document.getElementById('aiChatPanel');
const closeAiChatBtn = document.getElementById('closeAiChatBtn');
const aiChatMessages = document.getElementById('aiChatMessages');
const aiChatInput = document.getElementById('aiChatInput');
const aiChatSendBtn = document.getElementById('aiChatSendBtn');
const aiDiscussBtn = document.getElementById('aiDiscussBtn');
const aiSuggestionModal = document.getElementById('aiSuggestionModal');
const aiSuggestionContent = document.querySelector('.ai-suggestion-content');
const closeAiSuggestionBtn = document.getElementById('closeAiSuggestionBtn');

const lockDecisionBtn = document.getElementById('lockDecisionBtn');
const lockWorkspaceOverlay = document.getElementById('lockWorkspaceOverlay');
const workspacePasswordInput = document.getElementById('workspacePasswordInput');
const workspaceUnlockBtn = document.getElementById('workspaceUnlockBtn');
const workspaceUnlockError = document.getElementById('workspaceUnlockError');
const splitColumns = document.getElementById('splitColumns');

const passwordModal = document.getElementById('passwordModal');
const passwordModalTitle = document.getElementById('passwordModalTitle');
const passwordModalDesc = document.getElementById('passwordModalDesc');
const passwordModalInput1 = document.getElementById('passwordModalInput1');
const passwordModalInput2 = document.getElementById('passwordModalInput2');
const passwordModalSubmitBtn = document.getElementById('passwordModalSubmitBtn');

// Modal & Overlay DOM Elements
const categoryContextMenu = document.getElementById('categoryContextMenu');
const reorderListsModal = document.getElementById('reorderListsModal');
const reorderListsContainer = document.getElementById('reorderListsContainer');
const reorderPresetsContainer = document.getElementById('reorderPresetsContainer');

const editAreaModal = document.getElementById('editAreaModal');
const editAreaEmojiInput = document.getElementById('editAreaEmojiInput');
const editAreaNameInput = document.getElementById('editAreaNameInput');
const editAreaDecisionsList = document.getElementById('editAreaDecisionsList');

const pinKeypadModal = document.getElementById('pinKeypadModal');
const pinTitle = document.getElementById('pinTitle');
const pinSubtitle = document.getElementById('pinSubtitle');
const pinErrorMsg = document.getElementById('pinErrorMsg');

const saveBubbleBtn = document.getElementById('saveBubbleBtn');
const colAdvantages = document.getElementById('colAdvantages');
const colDisadvantages = document.getElementById('colDisadvantages');
const customContextMenu = document.getElementById('customContextMenu');
const closePasswordBtn = document.getElementById('closePasswordBtn');

window.unlockedDecisions = {};
window.activeChatHistory = [];

// Settings DOM Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');
const themeLightBtn = document.getElementById('themeLightBtn');
const themeDarkBtn = document.getElementById('themeDarkBtn');
const themeSepiaBtn = document.getElementById('themeSepiaBtn');
const toggleBalanceScore = document.getElementById('toggleBalanceScore');
const togglePrudential = document.getElementById('togglePrudential');
const toggleHorizons = document.getElementById('toggleHorizons');
const toggleProbability = document.getElementById('toggleProbability');

// Drawer Sort DOM Elements
const drawerSortBtn = document.getElementById('drawerSortBtn');
const drawerSortDropdown = document.getElementById('drawerSortDropdown');

// Mobile Tabs DOM Elements
const mobileTabs = document.getElementById('mobileTabs');
const tabAdvantagesBtn = document.getElementById('tabAdvantagesBtn');
const tabDisadvantagesBtn = document.getElementById('tabDisadvantagesBtn');
const tabCompareBtn = document.getElementById('tabCompareBtn');

// Time Horizon Filter DOM Elements
const horizonFilterRow = document.getElementById('horizonFilterRow');
const horizonFilterSelect = document.getElementById('horizonFilterSelect');

// Save Bubble DOM Elements
const saveBubbleDropdown = document.getElementById('saveBubbleDropdown');

// Full-Page Home View DOM Elements & State
const homePage = document.getElementById('homePage');
const appLayout = document.querySelector('.app-layout');
const newDecisionBtn = document.getElementById('newDecisionBtn');
const homeSearchRow = document.getElementById('homeSearchRow');
const homeSearchToggleBtn = document.getElementById('homeSearchToggleBtn');
const homeSearchCloseBtn = document.getElementById('homeSearchCloseBtn');
const homeSearchInput = document.getElementById('homeSearchInput');
const homeCategoriesBar = document.getElementById('homeCategoriesBar');
const homeDecisionsList = document.getElementById('homeDecisionsList');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const homeSettingsBtn = document.getElementById('homeSettingsBtn');

state.selectedFilterCategory = 'All';
state.activeView = 'home';

// Self-Updater DOM Elements & Config
const settingsUpdateSection = document.getElementById('settingsUpdateSection');
const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
const updateModal = document.getElementById('updateModal');
const updateModalText = document.getElementById('updateModalText');
const remindLaterBtn = document.getElementById('remindLaterBtn');
const updateNowBtn = document.getElementById('updateNowBtn');
const UPDATE_CHECK_URL = 'https://gist.githubusercontent.com/prince-dhaka/1dc7a48696fee7dea5b91ea6c0cfa787/raw/gistfile1.txt';

// AI Suggestions DOM Elements
const aiSuggestBtn = document.getElementById('aiSuggestBtn');
const aiSuggestedPros = document.getElementById('aiSuggestedPros');
const aiSuggestedCons = document.getElementById('aiSuggestedCons');
const aiAddSelectedBtn = document.getElementById('aiAddSelectedBtn');
const aiSuggestionSubtitle = document.getElementById('aiSuggestionSubtitle');

let selectedPros = [];
let selectedCons = [];

// Helper: Standard debounce utility to throttle server saves
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
const debouncedSaveStateToStorage = debounce(saveStateToStorage, 300);

// Trashcan SVG Icon Definition (Very simple and clean)
const trashSvg = `
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
</svg>
`;

// Focus helpers
function focusFirstItem(type) {
    const list = type === 'pro' ? advantagesList : disadvantagesList;
    const firstInput = list.querySelector('.item-input');
    if (firstInput) {
        firstInput.focus();
    }
}

function focusLastItem(type) {
    const list = type === 'pro' ? advantagesList : disadvantagesList;
    if (!list) return;
    const inputs = list.querySelectorAll('.item-input');
    if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
    }
}

function addProItem() {
    const activeDec = getActiveDecision();
    if (!activeDec) return;
    if (!activeDec.pros || !Array.isArray(activeDec.pros)) activeDec.pros = [];
    const lastItem = activeDec.pros[activeDec.pros.length - 1];
    if (!lastItem || getItemText(lastItem).trim() !== '') {
        activeDec.pros.push({ text: '', weight: 1 });
        saveStateToStorage();
        renderList('pro');
        renderFooter();
    }
    setTimeout(() => {
        focusLastItem('pro');
    }, 0);
}

function addConItem() {
    const activeDec = getActiveDecision();
    if (!activeDec) return;
    if (!activeDec.cons || !Array.isArray(activeDec.cons)) activeDec.cons = [];
    const lastItem = activeDec.cons[activeDec.cons.length - 1];
    if (!lastItem || getItemText(lastItem).trim() !== '') {
        activeDec.cons.push({ text: '', weight: 1 });
        saveStateToStorage();
        renderList('con');
        renderFooter();
    }
    setTimeout(() => {
        focusLastItem('con');
    }, 0);
}

// Perform local server availability check to toggle the sync dot indicator
async function checkServerStatus() {
    const statusDot = document.getElementById('syncStatus');
    if (!statusDot) return;
    try {
        const res = await fetch((window.BACKEND_API_URL || '') + '/api/load');
        if (res.ok) {
            statusDot.classList.remove('offline');
            statusDot.title = 'Local server connected & active';
        } else {
            statusDot.classList.add('offline');
            statusDot.title = 'Local server returned error code ' + res.status;
        }
    } catch (e) {
        statusDot.classList.add('offline');
        statusDot.title = 'Local server disconnected';
    }
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
    setupTheme(); // Initialize user-preferred theme
    await loadStateFromStorage(); // Wait for server or local state
    
    // Ensure state.settings is initialized on load
    if (!state.settings) {
        state.settings = {
            showPrudential: false,
            showHorizons: false,
            showProbability: false
        };
    }
    
    // Initialize active category as expanded
    window.expandedCategories = { [state.activeCategoryName]: true };
    
    setupEventListeners();
    setupExportHandlers();
    updateSettingsPanelUI();
    
    // Show time horizon filter row if enabled
    if (state.settings.showHorizons && horizonFilterRow) {
        horizonFilterRow.classList.remove('hidden');
    }
    
    renderApp();
    renderDrawer();
    renderFooter();

    // Bind Add Advantage & Add Disadvantage Buttons & Column Clicks
    const addAdvantageBtn = document.getElementById('addAdvantageBtn');
    if (addAdvantageBtn) {
        addAdvantageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addProItem();
        });
    }
    const addDisadvantageBtn = document.getElementById('addDisadvantageBtn');
    if (addDisadvantageBtn) {
        addDisadvantageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addConItem();
        });
    }
    const colAdvantages = document.getElementById('colAdvantages');
    if (colAdvantages) {
        colAdvantages.addEventListener('click', (e) => {
            if (e.target === colAdvantages || e.target === advantagesList) {
                focusLastItem('pro');
            }
        });
    }
    const colDisadvantages = document.getElementById('colDisadvantages');
    if (colDisadvantages) {
        colDisadvantages.addEventListener('click', (e) => {
            if (e.target === colDisadvantages || e.target === disadvantagesList) {
                focusLastItem('con');
            }
        });
    }
    
    // Bind Home Page Event Listeners
    if (newDecisionBtn) {
        newDecisionBtn.addEventListener('click', handleCreateNewDecision);
    }
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => switchView('home'));
    }
    const workspaceAreaBackBtn = document.getElementById('workspaceAreaBackBtn');
    if (workspaceAreaBackBtn) {
        workspaceAreaBackBtn.addEventListener('click', () => {
            state.selectedFilterCategory = state.activeCategoryName || 'All';
            switchView('home');
        });
    }
    if (homeSearchInput) {
        homeSearchInput.addEventListener('input', () => renderHomeScreen());
    }
    
    // Expandable Search Bar Toggle (Smooth Sliding under + New Decision button)
    if (homeSearchToggleBtn && homeSearchRow && homeSearchInput) {
        homeSearchToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (homeSearchRow.classList.contains('collapsed')) {
                homeSearchRow.classList.remove('collapsed');
                homeSearchRow.classList.add('expanded');
                homeSearchInput.focus();
            } else {
                homeSearchRow.classList.remove('expanded');
                homeSearchRow.classList.add('collapsed');
                homeSearchInput.value = '';
                renderHomeScreen();
            }
        });

        if (homeSearchCloseBtn) {
            homeSearchCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                homeSearchInput.value = '';
                renderHomeScreen();
                homeSearchRow.classList.remove('expanded');
                homeSearchRow.classList.add('collapsed');
            });
        }

        // Collapse search if clicked outside and search input is empty
        document.addEventListener('click', (e) => {
            if (homeSearchRow && !homeSearchRow.contains(e.target) && e.target !== homeSearchToggleBtn && !homeSearchInput.value.trim()) {
                homeSearchRow.classList.remove('expanded');
                homeSearchRow.classList.add('collapsed');
            }
        });
    }

    if (homeSettingsBtn && settingsDropdown) {
        homeSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('hidden');
        });
    }
    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('hidden');
        });
    }

    // Close settings dropdown & category context menu on click outside
    document.addEventListener('click', (e) => {
        if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) {
            const isInsideSettings = settingsDropdown.contains(e.target);
            const isHomeSettingsBtn = homeSettingsBtn && homeSettingsBtn.contains(e.target);
            const isSettingsBtn = settingsBtn && settingsBtn.contains(e.target);
            if (!isInsideSettings && !isHomeSettingsBtn && !isSettingsBtn) {
                settingsDropdown.classList.add('hidden');
            }
        }
        const ctxMenu = document.getElementById('categoryContextMenu');
        if (ctxMenu && !ctxMenu.classList.contains('hidden')) {
            if (!ctxMenu.contains(e.target) && !e.target.classList.contains('category-pill')) {
                closeCategoryContextMenu();
            }
        }
    });

    // Context Menu & Reorder Modal Button Bindings
    const categoryCtxEditBtn = document.getElementById('categoryCtxEditBtn');
    const categoryCtxDeleteBtn = document.getElementById('categoryCtxDeleteBtn');
    const categoryCtxReorderBtn = document.getElementById('categoryCtxReorderBtn');

    if (categoryCtxEditBtn) categoryCtxEditBtn.addEventListener('click', () => editCategoryName());
    if (categoryCtxDeleteBtn) categoryCtxDeleteBtn.addEventListener('click', () => deleteCategoryArea());
    if (categoryCtxReorderBtn) categoryCtxReorderBtn.addEventListener('click', () => openReorderListsModal());

    const closeReorderModalBtn = document.getElementById('closeReorderModalBtn');
    const saveReorderModalBtn = document.getElementById('saveReorderModalBtn');
    const closeEditAreaModalBtn = document.getElementById('closeEditAreaModalBtn');
    const saveEditAreaModalBtn = document.getElementById('saveEditAreaModalBtn');

    if (closeReorderModalBtn) closeReorderModalBtn.addEventListener('click', closeReorderListsModal);
    if (saveReorderModalBtn) saveReorderModalBtn.addEventListener('click', closeReorderListsModal);
    if (closeEditAreaModalBtn) closeEditAreaModalBtn.addEventListener('click', closeEditAreaModal);
    if (saveEditAreaModalBtn) saveEditAreaModalBtn.addEventListener('click', saveEditAreaModal);

    // Private Vault & PIN Keypad Bindings
    const panicLockBtn = document.getElementById('panicLockBtn');
    const categoryCtxLockBtn = document.getElementById('categoryCtxLockBtn');
    const pinCancelBtn = document.getElementById('pinCancelBtn');
    const pinClearBtn = document.getElementById('pinClearBtn');

    if (panicLockBtn) panicLockBtn.addEventListener('click', triggerPanicLock);
    if (categoryCtxLockBtn) categoryCtxLockBtn.addEventListener('click', () => toggleAreaLock());
    if (pinCancelBtn) pinCancelBtn.addEventListener('click', closePinKeypadModal);
    if (pinClearBtn) {
        pinClearBtn.addEventListener('click', () => {
            if (currentPinEntered.length > 0) {
                currentPinEntered = currentPinEntered.slice(0, -1);
                updatePinDotsUI();
            }
        });
    }

    document.querySelectorAll('.pin-key-btn[data-key]').forEach(btn => {
        btn.addEventListener('click', () => {
            handlePinKeyPress(btn.dataset.key);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePinKeypadModal();
            closeCategoryContextMenu();
            closeEditAreaModal();
            closeReorderListsModal();
        }
    });

    // Default view on launch is Full-Page Home Screen
    state.selectedFilterCategory = 'All';
    switchView('home');
    
    // Bind dynamic scroll tracker for mobile footer hide/reveal on scroll
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        const footer = document.querySelector('.footer-actions');
        if (footer && window.innerWidth <= 600) {
            if (st > lastScrollTop && st > 50) {
                // Scrolling down: hide footer
                footer.classList.add('footer-hidden');
            } else {
                // Scrolling up: show footer
                footer.classList.remove('footer-hidden');
            }
        }
        lastScrollTop = st <= 0 ? 0 : st;
    }, { passive: true });
    
    // Toggle footer visibility on mobile screen tap/click
    document.addEventListener('click', (e) => {
        if (window.innerWidth > 600) return;
        
        const interactiveTags = ['BUTTON', 'INPUT', 'TEXTAREA', 'A', 'SELECT'];
        if (interactiveTags.includes(e.target.tagName) || 
            e.target.closest('.footer-share-dropdown') || 
            e.target.closest('.save-bubble-dropdown') || 
            e.target.closest('.menu-dropdown') || 
            e.target.closest('.settings-dropdown') || 
            e.target.closest('.ai-chat-panel') || 
            e.target.closest('.modal-content')) {
            return;
        }
        
        const footer = document.querySelector('.footer-actions');
        if (footer) {
            footer.classList.toggle('footer-hidden');
            adjustFloatingChatBtnPosition();
        }
    });

    adjustFloatingChatBtnPosition();
});

// Heals/validates the state categories and active slots
function ensureStateStructure() {
    // Remove 'General' area and migrate decisions to 'Career'
    const generalIndex = state.categories.findIndex(c => c.name.toLowerCase() === 'general');
    if (generalIndex !== -1) {
        const generalCat = state.categories[generalIndex];
        const careerCat = state.categories.find(c => c.name === 'Career') || state.categories[0];
        
        generalCat.decisions.forEach(dec => {
            if (!careerCat.decisions.some(d => d.id === dec.id)) {
                careerCat.decisions.push(dec);
            }
        });
        
        state.categories.splice(generalIndex, 1);
        
        if (state.activeCategoryName.toLowerCase() === 'general') {
            state.activeCategoryName = careerCat.name;
            if (careerCat.decisions.length > 0) {
                state.activeDecisionId = careerCat.decisions[0].id;
            } else {
                const newId = 'dec_' + Date.now();
                careerCat.decisions.push({ id: newId, topic: '', pros: [''], cons: [''] });
                state.activeDecisionId = newId;
            }
        }
    }
    
    // Ensure Drafts area exists at index 0
    if (!state.categories.some(c => c.name === 'Drafts')) {
        state.categories.unshift({
            name: 'Drafts',
            decisions: [{ id: 'dec_draft_' + Date.now(), topic: '', pros: [''], cons: [''] }]
        });
    }
    
    // Ensure default areas exist in state
    const defaultAreas = ['Career', 'Relationships', 'Health'];
    defaultAreas.forEach(areaName => {
        if (!state.categories.some(c => c.name === areaName)) {
            state.categories.push({ name: areaName, decisions: [] });
        }
    });
    
    // Defensive data healing: ensure all decisions have valid arrays
    state.categories.forEach(cat => {
        if (cat.decisions) {
            cat.decisions.forEach(dec => {
                if (!dec.pros || !Array.isArray(dec.pros)) dec.pros = [''];
                if (!dec.cons || !Array.isArray(dec.cons)) dec.cons = [''];
                if (dec.passwordHash === undefined) dec.passwordHash = "";
            });
        }
    });
    
    // Ensure active state points to valid data
    let cat = state.categories.find(c => c.name === state.activeCategoryName);
    if (!cat) {
        state.activeCategoryName = state.categories[0].name;
        cat = state.categories[0];
    }
    
    let dec = cat.decisions.find(d => d.id === state.activeDecisionId);
    if (!dec) {
        if (cat.decisions.length > 0) {
            state.activeDecisionId = cat.decisions[0].id;
        } else {
            const newId = 'dec_' + Date.now();
            cat.decisions.push({ id: newId, topic: '', pros: [''], cons: [''] });
            state.activeDecisionId = newId;
        }
    }
    
    // Ensure settings object is initialized
    if (!state.settings) {
        state.settings = {
            showPrudential: false,
            showHorizons: false,
            showProbability: false,
            showBalanceScore: true
        };
    }
}

// View Navigation & Full-Page Home Rendering Functions
function switchView(viewName) {
    state.activeView = viewName;
    const menuContainer = document.querySelector('.menu-container');
    const footerActions = document.querySelector('.footer-actions');
    const floatingChatBtn = document.getElementById('floatingChatBtn');
    const workspaceHeader = document.getElementById('workspaceHeader');
    const workspaceAreaNameText = document.getElementById('workspaceAreaNameText');

    if (viewName === 'home') {
        if (homePage) { homePage.classList.remove('hidden'); homePage.style.display = 'block'; }
        if (appLayout) { appLayout.classList.add('hidden'); appLayout.style.display = 'none'; }
        if (workspaceHeader) { workspaceHeader.classList.add('hidden'); workspaceHeader.style.display = 'none'; }
        if (menuContainer) { menuContainer.classList.add('hidden'); menuContainer.style.display = 'none'; }
        if (footerActions) { footerActions.classList.add('hidden'); footerActions.style.display = 'none'; }
        if (floatingChatBtn) { floatingChatBtn.classList.add('hidden'); floatingChatBtn.style.display = 'none'; }
        renderHomeScreen();
    } else {
        if (homePage) { homePage.classList.add('hidden'); homePage.style.display = 'none'; }
        if (appLayout) { appLayout.classList.remove('hidden'); appLayout.style.display = 'flex'; }
        if (workspaceHeader) {
            workspaceHeader.classList.remove('hidden');
            workspaceHeader.style.display = 'flex';
            if (workspaceAreaNameText) {
                workspaceAreaNameText.textContent = state.activeCategoryName || 'Home';
            }
        }
        if (menuContainer) { menuContainer.classList.add('hidden'); menuContainer.style.display = 'none'; }
        if (footerActions) { footerActions.classList.remove('hidden'); footerActions.style.display = 'flex'; }
        if (floatingChatBtn) { floatingChatBtn.classList.remove('hidden'); floatingChatBtn.style.display = 'flex'; }
        renderApp();
    }
}

function computeDecisionScore(dec) {
    if (!dec) return 0;
    let proScore = 0;
    let conScore = 0;
    (dec.pros || []).forEach(p => {
        let text = typeof p === 'string' ? p : (p.text || '');
        if (text && text.trim() !== '') {
            let weight = (typeof p === 'object' && p.weight) ? p.weight : 1;
            let prob = (typeof p === 'object' && typeof p.probability === 'number') ? (p.probability / 100) : 1;
            proScore += (weight * prob);
        }
    });
    (dec.cons || []).forEach(c => {
        let text = typeof c === 'string' ? c : (c.text || '');
        if (text && text.trim() !== '') {
            let weight = (typeof c === 'object' && c.weight) ? c.weight : 1;
            let prob = (typeof c === 'object' && typeof c.probability === 'number') ? (c.probability / 100) : 1;
            conScore += (weight * prob);
        }
    });
    return Math.round(proScore - conScore);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderHomeScreen() {
    if (!homeCategoriesBar || !homeDecisionsList) return;
    ensureStateStructure();

    // 1. Render Category Filter Pills
    const categories = ['All', '🔒 Locked Vault', ...state.categories.filter(c => c.name !== '🔒 Private Vault' && c.name !== 'Private Vault').map(c => c.name)];
    homeCategoriesBar.innerHTML = '';

    categories.forEach(catName => {
        const catObj = state.categories.find(c => c.name === catName);
        const pill = document.createElement('button');
        
        if (catName === '🔒 Locked Vault' || catName.includes('Locked Vault')) {
            pill.className = 'category-pill locked-vault-pill' + (state.selectedFilterCategory === catName ? ' active' : '');
            pill.textContent = '🔒 Locked Vault';
        } else {
            pill.className = 'category-pill' + (state.selectedFilterCategory === catName ? ' active' : '');
            const lockIcon = (catObj && catObj.isLocked && !catName.includes('🔒')) ? '🔒 ' : '';
            pill.textContent = lockIcon + catName;
        }

        let isLongPress = false;
        let pressTimer = null;

        const showCtx = (e) => {
            if (catName === 'All' || catName === '🔒 Locked Vault') return;
            isLongPress = true;
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
            openCategoryContextMenu(e, catName);
        };

        pill.addEventListener('touchstart', (e) => {
            isLongPress = false;
            pressTimer = setTimeout(() => showCtx(e), 450);
        }, { passive: false });

        pill.addEventListener('touchend', () => { if (pressTimer) clearTimeout(pressTimer); });
        pill.addEventListener('touchmove', () => { if (pressTimer) clearTimeout(pressTimer); });
        pill.addEventListener('contextmenu', showCtx);

        pill.addEventListener('click', (e) => {
            if (isLongPress) {
                isLongPress = false;
                return;
            }
            if (catName === '🔒 Locked Vault' && !window.unlockedVaultSession) {
                openPinKeypadModal("Enter Vault PIN", "Enter PIN to access Private Vault", (success) => {
                    if (success) {
                        state.selectedFilterCategory = catName;
                        renderHomeScreen();
                    }
                });
                return;
            }
            if (catObj && catObj.isLocked && !window.unlockedVaultSession) {
                openPinKeypadModal("Area Locked", `Enter PIN to open "${catName}"`, (success) => {
                    if (success) {
                        state.selectedFilterCategory = catName;
                        renderHomeScreen();
                    }
                });
                return;
            }
            state.selectedFilterCategory = catName;
            renderHomeScreen();
        });

        homeCategoriesBar.appendChild(pill);
    });

    // Add Area Pill
    const addAreaBtn = document.createElement('button');
    addAreaBtn.className = 'category-pill';
    addAreaBtn.textContent = '+ Add Area';
    addAreaBtn.addEventListener('click', () => {
        const areaName = prompt('Enter new Area name:');
        if (areaName && areaName.trim()) {
            const trimmed = areaName.trim();
            if (!state.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
                const isLockedFolder = (state.selectedFilterCategory === '🔒 Locked Vault') || 
                    !!(state.categories.find(c => c.name === state.selectedFilterCategory && c.isLocked));
                state.categories.push({ name: trimmed, isLocked: isLockedFolder, decisions: [] });
                state.selectedFilterCategory = trimmed;
                saveStateToStorage();
                renderHomeScreen();
                renderDrawer();
            }
        }
    });
    homeCategoriesBar.appendChild(addAreaBtn);

    // 2. Filter & Collect Decisions
    let decisionsToDisplay = [];
    const searchTerm = (homeSearchInput ? homeSearchInput.value : '').toLowerCase().trim();

    state.categories.forEach(cat => {
        const isVaultView = state.selectedFilterCategory === '🔒 Locked Vault';
        
        if (isVaultView) {
            // Show only locked decisions or decisions in locked categories
            if (!cat.isLocked && (!cat.decisions || !cat.decisions.some(d => d.passwordHash))) {
                return;
            }
        } else if (state.selectedFilterCategory === 'All') {
            // Hide locked category decisions from All view unless unlocked
            if (cat.isLocked && !window.unlockedVaultSession) {
                return;
            }
        } else if (cat.name !== state.selectedFilterCategory) {
            return;
        }

        if (cat.decisions) {
            cat.decisions.forEach(dec => {
                const topicText = (dec.topic || 'Untitled Decision').toLowerCase();
                if (!searchTerm || topicText.includes(searchTerm)) {
                    if (isVaultView && !cat.isLocked && !dec.passwordHash) return;
                    decisionsToDisplay.push({
                        areaName: cat.name,
                        dec: dec,
                        catIsLocked: cat.isLocked
                    });
                }
            });
        }
    });

    // Apply Area Sort Rules
    const currentCatObj = state.categories.find(c => c.name === state.selectedFilterCategory);
    const sortRule = (currentCatObj && currentCatObj.sortRule) ? currentCatObj.sortRule : 'score';

    if (sortRule === 'score') {
        decisionsToDisplay.sort((a, b) => computeDecisionScore(b.dec) - computeDecisionScore(a.dec));
    } else if (sortRule === 'alpha') {
        decisionsToDisplay.sort((a, b) => (a.dec.topic || '').localeCompare(b.dec.topic || ''));
    } else if (sortRule === 'date') {
        decisionsToDisplay.sort((a, b) => (b.dec.createdAt || 0) - (a.dec.createdAt || 0));
    }

    // 3. Render Decisions List
    homeDecisionsList.innerHTML = '';
    if (decisionsToDisplay.length === 0) {
        homeDecisionsList.innerHTML = `<div class="empty-decisions-msg">No decisions found. Tap <strong id="emptyStateNewDecBtn" style="cursor:pointer; text-decoration:underline; color:var(--primary-color, #1a73e8);">+ New Decision</strong> to start!</div>`;
        const emptyStateNewDecBtn = document.getElementById('emptyStateNewDecBtn');
        if (emptyStateNewDecBtn) {
            emptyStateNewDecBtn.addEventListener('click', handleCreateNewDecision);
        }
        return;
    }

    decisionsToDisplay.forEach(item => {
        const dec = item.dec;
        const card = document.createElement('div');
        
        const isPrivateLocked = (dec.passwordHash || item.catIsLocked) && !window.unlockedVaultSession && !window.unlockedDecisions[dec.id];
        card.className = 'home-decision-card' + (isPrivateLocked ? ' locked-masked' : '');

        const score = computeDecisionScore(dec);
        let scoreLabel = 'Balanced';
        if (score > 0) scoreLabel = `+${score} Pro`;
        else if (score < 0) scoreLabel = `${score} Con`;

        const prosCount = (dec.pros || []).filter(p => typeof p === 'string' ? p.trim() !== '' : p.text && p.text.trim() !== '').length;
        const consCount = (dec.cons || []).filter(c => typeof c === 'string' ? c.trim() !== '' : c.text && c.text.trim() !== '').length;

        card.innerHTML = `
            ${isPrivateLocked ? '<div class="card-privacy-overlay">🔒 Private Decision (Tap to Unlock)</div>' : ''}
            <div class="card-main-info">
                <div class="card-title">${escapeHtml(dec.topic || 'Untitled Decision')} ${dec.passwordHash ? '🔒' : ''}</div>
                <div class="card-meta">
                    <span class="card-area-badge">${escapeHtml((item.areaName === '🔒 Private Vault' || item.areaName === 'Private Vault') ? 'Locked Vault' : item.areaName)}</span>
                    <span>${prosCount} Pros · ${consCount} Cons</span>
                </div>
            </div>
            <div class="card-right-info">
                <span class="card-score-pill">${scoreLabel}</span>
                <button class="card-delete-btn" title="Delete Decision">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;

        const deleteBtn = card.querySelector('.card-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (confirm(`Delete decision "${dec.topic || 'Untitled Decision'}"?`)) {
                    const catIndex = state.categories.findIndex(c => c.name === item.areaName);
                    if (catIndex !== -1) {
                        state.categories[catIndex].decisions = state.categories[catIndex].decisions.filter(d => d.id !== dec.id);
                        saveStateToStorage();
                        renderHomeScreen();
                        renderDrawer();
                    }
                }
            });
        }

        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-delete-btn')) return;
            state.activeCategoryName = item.areaName;
            state.activeDecisionId = dec.id;
            saveStateToStorage();
            switchView('workspace');
        });

        homeDecisionsList.appendChild(card);
    });
}

window.unlockedVaultSession = false;
let currentPinEntered = "";
let pinCallback = null;
let isValidatingPin = false;

function openPinKeypadModal(title, subtitle, callback) {
    currentPinEntered = "";
    isValidatingPin = false;
    pinCallback = callback;
    
    const modal = document.getElementById('pinKeypadModal');
    const titleEl = document.getElementById('pinTitle');
    const subtitleEl = document.getElementById('pinSubtitle');
    const errorEl = document.getElementById('pinErrorMsg');
    
    if (titleEl) titleEl.innerText = title || "Enter Vault PIN";
    if (subtitleEl) subtitleEl.innerText = subtitle || "Enter 4-digit PIN to access private decisions";
    if (errorEl) errorEl.classList.add('hidden');
    
    updatePinDotsUI();
    if (modal) modal.classList.remove('hidden');
}

function updatePinDotsUI() {
    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById(`dot${i}`);
        if (dot) {
            if (i < currentPinEntered.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }
}

function handlePinKeyPress(digit) {
    if (isValidatingPin || currentPinEntered.length >= 4) return;
    
    currentPinEntered += digit;
    updatePinDotsUI();
    
    if (currentPinEntered.length === 4) {
        isValidatingPin = true;
        const enteredPin = currentPinEntered;
        setTimeout(() => {
            const masterPin = localStorage.getItem('master_vault_pin') || '1234';
            const decoyPin = localStorage.getItem('decoy_vault_pin') || '0000';
            const isMaster = enteredPin === masterPin;
            const isDecoy = enteredPin === decoyPin;

            if (isMaster || isDecoy) {
                window.unlockedVaultSession = true;
                const cb = pinCallback;
                closePinKeypadModal();
                if (cb) cb(true);
            } else {
                const errorEl = document.getElementById('pinErrorMsg');
                if (errorEl) errorEl.classList.remove('hidden');
                currentPinEntered = "";
                updatePinDotsUI();
            }
            isValidatingPin = false;
        }, 150);
    }
}

function closePinKeypadModal() {
    const modal = document.getElementById('pinKeypadModal');
    if (modal) modal.classList.add('hidden');
    currentPinEntered = "";
    isValidatingPin = false;
    pinCallback = null;
}

function triggerPanicLock() {
    window.unlockedVaultSession = false;
    window.unlockedDecisions = {};
    if (typeof showToast === 'function') showToast("🔒 All Private Vaults Locked!");
    renderHomeScreen();
    renderDrawer();
}

function toggleAreaLock(catName) {
    closeCategoryContextMenu();
    const targetCatName = catName || selectedCtxCategoryName;
    if (!targetCatName || targetCatName === 'All' || targetCatName === 'Drafts') {
        alert('Cannot lock system category.');
        return;
    }

    const catObj = state.categories.find(c => c.name === targetCatName);
    if (!catObj) return;

    if (catObj.isLocked) {
        openPinKeypadModal("Unlock Area", `Enter PIN to unlock "${targetCatName}"`, (success) => {
            if (success) {
                catObj.isLocked = false;
                saveStateToStorage();
                renderHomeScreen();
                renderDrawer();
            }
        });
    } else {
        openPinKeypadModal("Lock Area", `Confirm PIN to lock "${targetCatName}"`, (success) => {
            if (success) {
                catObj.isLocked = true;
                saveStateToStorage();
                renderHomeScreen();
                renderDrawer();
            }
        });
    }
}

let selectedCtxCategoryName = null;

function openCategoryContextMenu(e, catName) {
    selectedCtxCategoryName = catName;
    const ctxMenu = document.getElementById('categoryContextMenu');
    if (!ctxMenu) return;

    const rect = e.target ? e.target.getBoundingClientRect() : { left: 20, bottom: 120 };
    ctxMenu.style.top = `${Math.min(rect.bottom + window.scrollY + 6, window.innerHeight - 180)}px`;
    ctxMenu.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 200)}px`;
    ctxMenu.classList.remove('hidden');
}

function closeCategoryContextMenu() {
    const ctxMenu = document.getElementById('categoryContextMenu');
    if (ctxMenu) ctxMenu.classList.add('hidden');
}

let currentEditingCategoryName = null;
let currentEditingSortRule = 'score';

function openEditAreaModal(catName) {
    closeCategoryContextMenu();
    const targetCat = catName || selectedCtxCategoryName;
    if (!targetCat || targetCat === 'All') return;

    currentEditingCategoryName = targetCat;
    const catObj = state.categories.find(c => c.name === targetCat);
    if (!catObj) return;

    const modal = document.getElementById('editAreaModal');
    const nameInput = document.getElementById('editAreaNameInput');
    const emojiInput = document.getElementById('editAreaEmojiInput');
    const decisionsList = document.getElementById('editAreaDecisionsList');
    if (!modal || !nameInput || !emojiInput || !decisionsList) return;

    try {
        const match = catObj.name.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*(.*)$/u);
        if (match) {
            emojiInput.value = match[1];
            nameInput.value = match[2];
        } else {
            emojiInput.value = '';
            nameInput.value = catObj.name;
        }
    } catch (err) {
        emojiInput.value = '';
        nameInput.value = catObj.name;
    }

    document.querySelectorAll('.emoji-preset-btn').forEach(btn => {
        btn.onclick = () => {
            emojiInput.value = btn.textContent.trim();
        };
    });

    currentEditingSortRule = catObj.sortRule || 'score';
    document.querySelectorAll('.area-sort-opt-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === currentEditingSortRule);
        btn.onclick = () => {
            currentEditingSortRule = btn.dataset.sort;
            document.querySelectorAll('.area-sort-opt-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    decisionsList.innerHTML = '';
    let otherDecisions = [];
    state.categories.forEach(c => {
        if (c.decisions) {
            c.decisions.forEach(d => {
                otherDecisions.push({
                    catName: c.name,
                    dec: d,
                    inCurrentArea: c.name === targetCat
                });
            });
        }
    });

    if (otherDecisions.length === 0) {
        decisionsList.innerHTML = '<div style="font-size:0.85rem; color:var(--subtle-text); padding:8px 0;">No decisions available to move.</div>';
    } else {
        otherDecisions.forEach(item => {
            const label = document.createElement('label');
            label.className = 'move-decision-checkbox-item';
            label.innerHTML = `
                <input type="checkbox" value="${item.dec.id}" ${item.inCurrentArea ? 'checked' : ''}>
                <div style="display:flex; flex-direction:column; flex:1;">
                    <span style="font-weight:600; color:var(--text-color);">${escapeHtml(item.dec.topic || 'Untitled Decision')}</span>
                    <span style="font-size:0.75rem; color:var(--subtle-text);">Currently in: ${escapeHtml(item.catName)}</span>
                </div>
            `;
            decisionsList.appendChild(label);
        });
    }

    modal.classList.remove('hidden');
}

function saveEditAreaModal() {
    if (!currentEditingCategoryName) return;
    const catObj = state.categories.find(c => c.name === currentEditingCategoryName);
    if (!catObj) return;

    const nameInput = document.getElementById('editAreaNameInput');
    const emojiInput = document.getElementById('editAreaEmojiInput');
    const decisionsList = document.getElementById('editAreaDecisionsList');

    const cleanName = (nameInput ? nameInput.value.trim() : '') || currentEditingCategoryName;
    const emoji = emojiInput ? emojiInput.value.trim() : '';
    const newFullName = emoji ? `${emoji} ${cleanName}` : cleanName;

    const oldName = catObj.name;
    catObj.name = newFullName;
    catObj.sortRule = currentEditingSortRule || 'score';

    if (decisionsList) {
        const checkboxes = decisionsList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            const decId = cb.value;
            const isChecked = cb.checked;
            
            let sourceCat = state.categories.find(c => c.decisions && c.decisions.some(d => d.id === decId));
            if (sourceCat && isChecked && sourceCat.name !== newFullName) {
                const decIndex = sourceCat.decisions.findIndex(d => d.id === decId);
                if (decIndex !== -1) {
                    const [movedDec] = sourceCat.decisions.splice(decIndex, 1);
                    catObj.decisions.push(movedDec);
                }
            } else if (sourceCat && !isChecked && sourceCat.name === newFullName) {
                const decIndex = catObj.decisions.findIndex(d => d.id === decId);
                if (decIndex !== -1) {
                    const [movedDec] = catObj.decisions.splice(decIndex, 1);
                    let draftsCat = state.categories.find(c => c.name === 'Drafts');
                    if (!draftsCat) {
                        draftsCat = { name: 'Drafts', decisions: [] };
                        state.categories.unshift(draftsCat);
                    }
                    draftsCat.decisions.push(movedDec);
                }
            }
        });
    }

    if (state.selectedFilterCategory === oldName) state.selectedFilterCategory = newFullName;
    if (state.activeCategoryName === oldName) state.activeCategoryName = newFullName;

    closeEditAreaModal();
    saveStateToStorage();
    renderHomeScreen();
    renderDrawer();
}

function closeEditAreaModal() {
    const modal = document.getElementById('editAreaModal');
    if (modal) modal.classList.add('hidden');
    currentEditingCategoryName = null;
}

function editCategoryName(catName) {
    openEditAreaModal(catName);
}

function deleteCategoryArea(catName) {
    const targetCat = catName || selectedCtxCategoryName;
    closeCategoryContextMenu();
    if (!targetCat || targetCat === 'All' || targetCat === 'Drafts') {
        alert('Cannot delete system category.');
        return;
    }

    setTimeout(() => {
        if (confirm(`Delete area "${targetCat}"? Decisions inside will be moved to Drafts.`)) {
            const catIndex = state.categories.findIndex(c => c.name === targetCat);
            if (catIndex !== -1) {
                const decisionsToMove = state.categories[catIndex].decisions || [];
                let draftsCat = state.categories.find(c => c.name === 'Drafts');
                if (!draftsCat) {
                    draftsCat = { name: 'Drafts', decisions: [] };
                    state.categories.unshift(draftsCat);
                }
                draftsCat.decisions.push(...decisionsToMove);
                state.categories.splice(catIndex, 1);

                if (state.selectedFilterCategory === targetCat) state.selectedFilterCategory = 'All';
                if (state.activeCategoryName === targetCat) state.activeCategoryName = 'Drafts';

                saveStateToStorage();
                renderHomeScreen();
                renderDrawer();
            }
        }
    }, 50);
}

function openReorderListsModal() {
    closeCategoryContextMenu();
    const modal = document.getElementById('reorderListsModal');
    const listsContainer = document.getElementById('reorderListsContainer');
    const presetsContainer = document.getElementById('reorderPresetsContainer');
    if (!modal || !listsContainer || !presetsContainer) return;

    listsContainer.innerHTML = '';
    state.categories.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = 'reorder-list-item';
        const isPreset = ['Drafts', 'Career', 'Relationships', 'Health'].includes(cat.name);

        li.innerHTML = `
            <div class="reorder-item-left">
                <span class="reorder-item-title">${escapeHtml(cat.name)}</span>
                ${isPreset ? '<span style="font-size:0.75rem; color:var(--subtle-text);">Preset</span>' : ''}
            </div>
            <div class="reorder-item-actions">
                ${cat.name !== 'Drafts' ? `
                <button class="reorder-item-btn delete-btn" title="Delete Area">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>` : ''}
                <button class="reorder-item-btn up-btn" title="Move Up">↑</button>
                <button class="reorder-item-btn down-btn" title="Move Down">↓</button>
                <span style="cursor:grab; color:var(--subtle-text);">＝</span>
            </div>
        `;

        li.querySelector('.up-btn')?.addEventListener('click', () => {
            if (index > 0) {
                const temp = state.categories[index];
                state.categories[index] = state.categories[index - 1];
                state.categories[index - 1] = temp;
                openReorderListsModal();
            }
        });

        li.querySelector('.down-btn')?.addEventListener('click', () => {
            if (index < state.categories.length - 1) {
                const temp = state.categories[index];
                state.categories[index] = state.categories[index + 1];
                state.categories[index + 1] = temp;
                openReorderListsModal();
            }
        });

        li.querySelector('.delete-btn')?.addEventListener('click', () => {
            deleteCategoryArea(cat.name);
            openReorderListsModal();
        });

        listsContainer.appendChild(li);
    });

    const availablePresets = ['Favorites', 'Unread', 'Groups', 'Collage', 'Home', 'Communities'].filter(p => !state.categories.some(c => c.name === p));
    presetsContainer.innerHTML = '';
    availablePresets.forEach(presetName => {
        const li = document.createElement('li');
        li.className = 'reorder-list-item';
        li.innerHTML = `
            <div class="reorder-item-left">
                <span class="reorder-item-title">${presetName}</span>
                <span style="font-size:0.75rem; color:var(--subtle-text);">Preset</span>
            </div>
            <button class="preset-add-btn">Add</button>
        `;
        li.querySelector('.preset-add-btn').addEventListener('click', () => {
            state.categories.push({ name: presetName, decisions: [] });
            saveStateToStorage();
            openReorderListsModal();
        });
        presetsContainer.appendChild(li);
    });

    modal.classList.remove('hidden');
}

function closeReorderListsModal() {
    const modal = document.getElementById('reorderListsModal');
    if (modal) modal.classList.add('hidden');
    saveStateToStorage();
    renderHomeScreen();
    renderDrawer();
}

function handleCreateNewDecision() {
    ensureStateStructure();

    const isLockedVaultTab = state.selectedFilterCategory && (state.selectedFilterCategory === '🔒 Locked Vault' || state.selectedFilterCategory.includes('Locked Vault'));

    let currentCatObj = state.categories.find(c => c.name === state.selectedFilterCategory);
    const targetIsLocked = isLockedVaultTab || (currentCatObj && currentCatObj.isLocked);

    if (targetIsLocked && !window.unlockedVaultSession) {
        openPinKeypadModal("Enter Vault PIN", "Enter PIN to create decision in Private Vault", (success) => {
            if (success) {
                handleCreateNewDecision();
            }
        });
        return;
    }

    let targetCatName;
    let targetCat;

    if (isLockedVaultTab) {
        targetCat = state.categories.find(c => c.isLocked);
        if (!targetCat) {
            targetCatName = 'Private Vault';
            targetCat = { name: targetCatName, isLocked: true, decisions: [] };
            state.categories.push(targetCat);
        } else {
            targetCatName = targetCat.name;
        }
    } else if (state.selectedFilterCategory && state.selectedFilterCategory !== 'All') {
        targetCatName = state.selectedFilterCategory;
        targetCat = state.categories.find(c => c.name === targetCatName);
    } else {
        targetCatName = state.activeCategoryName || (state.categories[0] ? state.categories[0].name : 'Drafts');
        targetCat = state.categories.find(c => c.name === targetCatName);
    }

    if (!targetCat) {
        targetCat = state.categories[0];
        if (!targetCat) {
            targetCat = { name: 'Drafts', decisions: [] };
            state.categories.push(targetCat);
        }
        targetCatName = targetCat.name;
    }

    const newId = 'dec_' + Date.now();
    targetCat.decisions.push({
        id: newId,
        topic: '',
        pros: [''],
        cons: [''],
        createdAt: Date.now()
    });

    state.activeCategoryName = targetCatName;
    state.activeDecisionId = newId;
    saveStateToStorage();
    
    switchView('workspace');

    setTimeout(() => {
        if (typeof topicInput !== 'undefined' && topicInput) {
            topicInput.focus();
        }
    }, 100);
}

async function hashPassword(password) {
    if (!password) return "";
    try {
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
    } catch (e) {
        console.warn("Crypto API failed, falling back to simple hash", e);
    }
    // Fallback pure-JS hash
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < password.length; i++) {
        h1 = Math.imul(h1 ^ password.charCodeAt(i), 2654435761);
        h2 = Math.imul(h2 ^ password.charCodeAt(i), 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h2 = Math.imul(h2 ^ (h2 >>> 15), 3266489909);
    return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padStart(16, '0');
}

let passwordModalCallback = null;
let passwordModalMode = null; // 'set' or 'verify'

function openPasswordModal(mode, title, desc, callback) {
    passwordModalMode = mode;
    passwordModalCallback = callback;
    
    passwordModalTitle.innerText = title;
    passwordModalDesc.innerText = desc;
    
    passwordModalInput1.value = '';
    passwordModalInput2.value = '';
    passwordModalError.classList.add('hidden');
    
    if (mode === 'set') {
        passwordModalInput2.classList.remove('hidden');
        passwordModalInput2.placeholder = 'Confirm password';
    } else {
        passwordModalInput2.classList.add('hidden');
    }
    
    passwordModal.classList.remove('hidden');
    passwordModalInput1.focus();
}

function closePasswordModal() {
    passwordModal.classList.add('hidden');
    passwordModalInput1.value = '';
    passwordModalInput2.value = '';
    passwordModalError.classList.add('hidden');
    passwordModalCallback = null;
    passwordModalMode = null;
}

async function handlePasswordSubmit() {
    const p1 = passwordModalInput1.value;
    
    if (!p1) {
        passwordModalError.innerText = 'Password cannot be empty!';
        passwordModalError.classList.remove('hidden');
        return;
    }
    
    if (passwordModalMode === 'set') {
        const p2 = passwordModalInput2.value;
        if (p1 !== p2) {
            passwordModalError.innerText = 'Passwords do not match!';
            passwordModalError.classList.remove('hidden');
            return;
        }
        
        const hashed = await hashPassword(p1);
        if (passwordModalCallback) {
            await passwordModalCallback(hashed);
        }
        closePasswordModal();
    } else if (passwordModalMode === 'verify') {
        const hashed = await hashPassword(p1);
        if (passwordModalCallback) {
            const success = await passwordModalCallback(hashed);
            if (success) {
                closePasswordModal();
            } else {
                passwordModalError.innerText = 'Incorrect password!';
                passwordModalError.classList.remove('hidden');
                passwordModalInput1.value = '';
                passwordModalInput1.focus();
            }
        }
    }
}

async function unlockWorkspace() {
    const dec = getActiveDecision();
    if (!dec) return;
    
    const pw = workspacePasswordInput.value.trim();
    const hashed = await hashPassword(pw);
    
    const masterPin = localStorage.getItem('master_vault_pin') || '1234';
    const decoyPin = localStorage.getItem('decoy_vault_pin') || '0000';
    
    if ((dec.passwordHash && hashed === dec.passwordHash) || pw === masterPin || pw === decoyPin) {
        window.unlockedDecisions[dec.id] = true;
        workspacePasswordInput.value = '';
        workspaceUnlockError.classList.add('hidden');
        renderApp();
        renderDrawer();
        renderFooter();
        loadChatForActiveDecision();
    } else {
        workspaceUnlockError.classList.remove('hidden');
        workspacePasswordInput.value = '';
        workspacePasswordInput.focus();
    }
}

function getMasterPasswordHash() {
    let hash = localStorage.getItem('master_password_hash');
    if (hash) return hash;
    
    // Fallback: search all decisions in categories
    for (let cat of state.categories) {
        for (let d of cat.decisions) {
            if (d.passwordHash) {
                localStorage.setItem('master_password_hash', d.passwordHash);
                return d.passwordHash;
            }
        }
    }
    return "";
}

function handleLockBtnClick() {
    const dec = getActiveDecision();
    if (!dec) return;
    
    if (!dec.topic || dec.topic.trim() === '') {
        showToast("Please enter a decision topic name before locking.");
        return;
    }
    
    if (dec.passwordHash) {
        // Unlock / Remove Lock
        openPasswordModal('verify', 'Remove Password Lock', 'Enter the current password or PIN to unlock and remove protection.', async (enteredHash) => {
            const enteredRaw = passwordModalInput1.value.trim();
            const masterPin = localStorage.getItem('master_vault_pin') || '1234';
            const decoyPin = localStorage.getItem('decoy_vault_pin') || '0000';
            if (enteredHash === dec.passwordHash || enteredRaw === masterPin || enteredRaw === decoyPin) {
                dec.passwordHash = "";
                delete window.unlockedDecisions[dec.id];
                saveStateToStorage();
                renderApp();
                renderDrawer();
                renderFooter();
                showToast("Password protection removed.");
                return true;
            } else {
                return false;
            }
        });
    } else {
        const existingMasterHash = getMasterPasswordHash();
        if (existingMasterHash) {
            // Already has a master password, lock immediately using it!
            dec.passwordHash = existingMasterHash;
            delete window.unlockedDecisions[dec.id];
            saveStateToStorage();
            renderApp();
            renderDrawer();
            renderFooter();
            showToast("Decision locked.");
        } else {
            // Set lock password (first time setting lock)
            openPasswordModal('set', 'Set Password Lock', 'Enter a password to lock this decision list.', async (hashedPassword) => {
                localStorage.setItem('master_password_hash', hashedPassword);
                dec.passwordHash = hashedPassword;
                delete window.unlockedDecisions[dec.id];
                saveStateToStorage();
                renderApp();
                renderDrawer();
                renderFooter();
                showToast("Password set and decision locked.");
                return true;
            });
        }
    }
}

function addChatBubble(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `ai-chat-bubble ${role}`;
    bubble.innerText = text;
    aiChatMessages.appendChild(bubble);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

async function sendChatMessage() {
    const text = aiChatInput.value.trim();
    if (!text) return;
    
    aiChatInput.value = '';
    addChatBubble('user', text);
    
    // Disable inputs while loading
    aiChatInput.disabled = true;
    aiChatSendBtn.disabled = true;
    
    // Add a typing indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'ai-chat-bubble ai system-typing';
    typingBubble.innerText = 'Gemini is typing...';
    aiChatMessages.appendChild(typingBubble);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    
    const dec = getActiveDecision();
    
    // Collect suggested pros & cons from suggestions checklist
    const suggestedPros = [];
    const suggestedCons = [];
    document.querySelectorAll('#aiSuggestedPros li').forEach(li => {
        const label = li.querySelector('label');
        if (label) {
            suggestedPros.push(label.innerText.trim());
        } else {
            suggestedPros.push(li.innerText.trim());
        }
    });
    document.querySelectorAll('#aiSuggestedCons li').forEach(li => {
        const label = li.querySelector('label');
        if (label) {
            suggestedCons.push(label.innerText.trim());
        } else {
            suggestedCons.push(li.innerText.trim());
        }
    });
    
    // Prepare history array from persisted decision chat history
    if (!dec.chatHistory || !Array.isArray(dec.chatHistory)) dec.chatHistory = [];
    const history = dec.chatHistory.map(h => ({ role: h.role, text: h.text }));
    
    try {
        const response = await fetch((window.BACKEND_API_URL || '') + '/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: dec.topic,
                pros: dec.pros,
                cons: dec.cons,
                suggested_pros: suggestedPros,
                suggested_cons: suggestedCons,
                history: history,
                message: text
            })
        });
        
        // Remove typing indicator
        typingBubble.remove();
        
        if (response.ok) {
            const data = await response.json();
            const reply = data.text;
            addChatBubble('ai', reply);
            
            // Persist to decision chat history
            dec.chatHistory.push({ role: 'user', text: text });
            dec.chatHistory.push({ role: 'model', text: reply });
            saveStateToStorage();
        } else {
            const errData = await response.json();
            addChatBubble('ai', `Error: ${errData.error || 'Failed to connect to AI server.'}`);
        }
    } catch (e) {
        typingBubble.remove();
        addChatBubble('ai', `Network Error: ${e.message || 'Could not reach server.'}`);
    } finally {
        aiChatInput.disabled = false;
        aiChatSendBtn.disabled = false;
    }
}

function loadChatForActiveDecision() {
    const dec = getActiveDecision();
    if (!aiChatMessages) return;
    aiChatMessages.innerHTML = '';
    if (dec && dec.chatHistory && Array.isArray(dec.chatHistory) && dec.chatHistory.length > 0) {
        dec.chatHistory.forEach(msg => {
            addChatBubble(msg.role === 'user' ? 'user' : 'ai', msg.text);
        });
    } else {
        addChatBubble('ai', "Hello! I'm your Decision Assistant. You can ask me questions about the pros, cons, or trade-offs of this decision topic.");
    }
}

function ensureStateStructure() {
    if (!state || typeof state !== 'object') {
        state = {};
    }
    if (!state.categories || !Array.isArray(state.categories) || state.categories.length === 0) {
        state.categories = [
            { name: 'Drafts', decisions: [{ id: 'dec_draft_default', topic: '', pros: [''], cons: [''] }] },
            { name: 'Career', decisions: [] },
            { name: 'Relationships', decisions: [] },
            { name: 'Health', decisions: [] }
        ];
    }
    if (!state.activeCategoryName || !state.categories.some(c => c.name === state.activeCategoryName)) {
        state.activeCategoryName = state.categories[0].name;
    }
    if (!state.activeDecisionId && state.categories[0].decisions.length > 0) {
        state.activeDecisionId = state.categories[0].decisions[0].id;
    }
}

// Load state from local server with local storage fallback
async function loadStateFromStorage() {
    window.drawerSortMode = localStorage.getItem('drawer_sort_mode') || 'alpha';
    const isMobileApp = window.location.protocol === 'file:' || typeof cordova !== 'undefined';
    if (isMobileApp) {
        loadStateFromLocalStorage();
        sortDecisions(window.drawerSortMode, false);
        undoStack.push(JSON.stringify({ state: state, focus: null }));
        return;
    }
    try {
        const response = await fetch((window.BACKEND_API_URL || '') + '/api/load');
        if (response.ok) {
            state = await response.json();
            ensureStateStructure();
            sortDecisions(window.drawerSortMode, false);
            undoStack.push(JSON.stringify({ state: state, focus: null }));
            return;
        }
    } catch (e) {
        console.warn('Local server not running offline, falling back to localStorage');
    }
    loadStateFromLocalStorage();
    sortDecisions(window.drawerSortMode, false);
    undoStack.push(JSON.stringify({ state: state, focus: null }));
}

function loadStateFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('pros_cons_multi_state');
        if (savedState) {
            state = JSON.parse(savedState);
        } else {
            // Migration for older single-topic state
            const oldTopic = localStorage.getItem('pros_cons_topic');
            const oldPros = localStorage.getItem('pros_cons_advantages');
            const oldCons = localStorage.getItem('pros_cons_disadvantages');
            
            if (oldTopic !== null || oldPros !== null || oldCons !== null) {
                state.categories[0].decisions[0].topic = oldTopic || '';
                state.categories[0].decisions[0].pros = oldPros ? JSON.parse(oldPros) : [''];
                state.categories[0].decisions[0].cons = oldCons ? JSON.parse(oldCons) : [''];
                
                localStorage.removeItem('pros_cons_topic');
                localStorage.removeItem('pros_cons_advantages');
                localStorage.removeItem('pros_cons_disadvantages');
                
                saveStateToStorage();
            }
        }
        ensureStateStructure();
    } catch (e) {
        console.error('Failed to load state from localStorage', e);
    }
}



const undoStack = [];
const redoStack = [];
const MAX_UNDO_LIMIT = 50;

function getActiveFocusState() {
    const activeEl = document.activeElement;
    if (!activeEl) return null;
    
    if (activeEl.id === 'topicInput') {
        return { type: 'topic', selectionStart: activeEl.selectionStart, selectionEnd: activeEl.selectionEnd };
    }
    
    if (activeEl.classList.contains('item-input')) {
        const itemRow = activeEl.closest('.item-row');
        if (itemRow) {
            const list = activeEl.closest('.items-list');
            if (list) {
                const isPro = list.id === 'advantagesList';
                const inputs = Array.from(list.querySelectorAll('.item-input'));
                const index = inputs.indexOf(activeEl);
                return {
                    type: 'list-item',
                    column: isPro ? 'pro' : 'con',
                    index: index,
                    selectionStart: activeEl.selectionStart,
                    selectionEnd: activeEl.selectionEnd
                };
            }
        }
    }
    return null;
}

function restoreActiveFocusState(focusState) {
    if (!focusState) return;
    
    if (focusState.type === 'topic') {
        const input = document.getElementById('topicInput');
        if (input) {
            input.focus();
            try {
                input.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
            } catch (e) {}
        }
    } else if (focusState.type === 'list-item') {
        const listId = focusState.column === 'pro' ? 'advantagesList' : 'disadvantagesList';
        const list = document.getElementById(listId);
        if (list) {
            const inputs = Array.from(list.querySelectorAll('.item-input'));
            if (inputs[focusState.index]) {
                const target = inputs[focusState.index];
                target.focus();
                try {
                    target.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
                } catch (e) {}
            }
        }
    }
}

function pushStateToHistory() {
    const snapshot = JSON.stringify({
        state: state,
        focus: getActiveFocusState()
    });
    
    let isDifferent = true;
    if (undoStack.length > 0) {
        const lastSnap = JSON.parse(undoStack[undoStack.length - 1]);
        if (JSON.stringify(lastSnap.state) === JSON.stringify(state)) {
            isDifferent = false;
        }
    }
    
    if (undoStack.length === 0 || isDifferent) {
        undoStack.push(snapshot);
        if (undoStack.length > MAX_UNDO_LIMIT) {
            undoStack.shift();
        }
        redoStack.length = 0; // Clear redo stack on fresh state commits
    }
}

// Save state to localStorage AND local server (with undo tracking)
async function saveStateToStorage() {
    pushStateToHistory();
    await saveStateToStorageNoHistory();
}

function triggerAutosaveFlash() {
    const indicator = document.getElementById('autosaveIndicator');
    if (indicator) {
        indicator.classList.add('show');
        if (window.autosaveTimeout) clearTimeout(window.autosaveTimeout);
        window.autosaveTimeout = setTimeout(() => {
            indicator.classList.remove('show');
        }, 1500);
    }
}

async function saveStateToStorageNoHistory() {
    // 1. Save to local storage
    try {
        localStorage.setItem('pros_cons_multi_state', JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save state to localStorage', e);
    }
    
    const isMobileApp = window.location.protocol === 'file:' || typeof cordova !== 'undefined';
    if (isMobileApp) {
        triggerAutosaveFlash();
        return;
    }
    
    // 2. Save to local server
    try {
        const response = await fetch((window.BACKEND_API_URL || '') + '/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        if (response.ok) {
            triggerAutosaveFlash();
        }
    } catch (e) {
        triggerAutosaveFlash(); // Fallback flash for local storage saves
    }
}

// Get the active decision object (Auto-initializes decision if category is empty)
function getActiveDecision() {
    let category = state.categories.find(c => c.name === state.activeCategoryName);
    if (!category) {
        category = state.categories[0];
        if (category) state.activeCategoryName = category.name;
    }
    if (!category) return null;
    
    if (!category.decisions || category.decisions.length === 0) {
        const newId = 'dec_' + Date.now();
        category.decisions = [{
            id: newId,
            topic: '',
            pros: [''],
            cons: [''],
            createdAt: Date.now()
        }];
        state.activeDecisionId = newId;
    }
    
    let dec = category.decisions.find(d => d.id === state.activeDecisionId);
    if (!dec) {
        dec = category.decisions[0];
        if (dec) state.activeDecisionId = dec.id;
    }
    return dec;
}

function updateAiSuggestBtnVisibility() {
    if (!aiSuggestBtn) return;
    if (topicInput.value.trim().length > 0) {
        aiSuggestBtn.classList.add('visible');
    } else {
        aiSuggestBtn.classList.remove('visible');
    }
}

// Open AI Suggestions Checklist Modal
function openAiSuggestionsModal(data) {
    if (!aiSuggestionModal) return;
    
    selectedPros = [];
    selectedCons = [];
    updateAddSelectedBtnText();
    
    if (aiSuggestionSubtitle) {
        aiSuggestionSubtitle.innerText = `Showing AI-generated variables for "${topicInput.value.trim()}"`;
    }
    
    if (aiSuggestedPros) {
        aiSuggestedPros.innerHTML = '';
        (data.pros || []).forEach((pro, index) => {
            const li = document.createElement('li');
            li.className = 'ai-suggest-item';
            
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'flex-start';
            label.style.gap = '10px';
            label.style.cursor = 'pointer';
            label.style.width = '100%';
            
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    selectedPros.push(pro);
                    li.classList.add('selected');
                } else {
                    selectedPros = selectedPros.filter(p => p !== pro);
                    li.classList.remove('selected');
                }
                updateAddSelectedBtnText();
            });
            
            const span = document.createElement('span');
            span.innerText = pro;
            
            label.appendChild(cb);
            label.appendChild(span);
            li.appendChild(label);
            
            li.addEventListener('click', (e) => {
                if (e.target !== cb) {
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
            
            aiSuggestedPros.appendChild(li);
        });
    }
    
    if (aiSuggestedCons) {
        aiSuggestedCons.innerHTML = '';
        (data.cons || []).forEach((con, index) => {
            const li = document.createElement('li');
            li.className = 'ai-suggest-item';
            
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'flex-start';
            label.style.gap = '10px';
            label.style.cursor = 'pointer';
            label.style.width = '100%';
            
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    selectedCons.push(con);
                    li.classList.add('selected');
                } else {
                    selectedCons = selectedCons.filter(c => c !== con);
                    li.classList.remove('selected');
                }
                updateAddSelectedBtnText();
            });
            
            const span = document.createElement('span');
            span.innerText = con;
            
            label.appendChild(cb);
            label.appendChild(span);
            li.appendChild(label);
            
            li.addEventListener('click', (e) => {
                if (e.target !== cb) {
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
            
            aiSuggestedCons.appendChild(li);
        });
    }
    
    aiSuggestionModal.classList.remove('hidden');
}

function updateAddSelectedBtnText() {
    if (!aiAddSelectedBtn) return;
    const total = selectedPros.length + selectedCons.length;
    aiAddSelectedBtn.innerText = `Add Selected (${total})`;
}

// Set up UI Event Listeners
function setupEventListeners() {
    // Topic input change
    topicInput.addEventListener('input', () => {
        const dec = getActiveDecision();
        if (dec) {
            dec.topic = topicInput.value;
            debouncedSaveStateToStorage();
            renderDrawer(); 
            adjustTopicFontSizeAndHeight(); 
            renderFooter(); 
            updateNetBalanceScore();
            updateAiSuggestBtnVisibility();
            
            // Also update header labels since the empty state changed!
            const advantagesHeader = document.getElementById('advantagesHeader');
            const disadvantagesHeader = document.getElementById('disadvantagesHeader');
            if (isDecisionEmpty(dec)) {
                if (advantagesHeader) advantagesHeader.innerText = 'Advantages';
                if (disadvantagesHeader) disadvantagesHeader.innerText = 'Disadvantages';
            } else {
                const proCount = dec.pros.filter(item => getItemText(item).trim() !== '').length;
                const conCount = dec.cons.filter(item => getItemText(item).trim() !== '').length;
                if (advantagesHeader) advantagesHeader.innerText = `Advantages (${proCount})`;
                if (disadvantagesHeader) disadvantagesHeader.innerText = `Disadvantages (${conCount})`;
            }
        }
    });
    
    // Focus first advantage when hitting enter in the topic input
    topicInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            focusFirstItem('pro');
        }
    });

    // AI Suggestions button click
    if (aiSuggestBtn) {
        aiSuggestBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const topic = topicInput.value.trim();
            if (!topic) return;
            
            aiSuggestBtn.classList.add('loading');
            showToast("Detecting perspectives...");
            
            try {
                const res = await fetch((window.BACKEND_API_URL || '') + '/api/suggest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic })
                });
                
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch suggestions");
                }
                
                openAiSuggestionsModal(data);
            } catch (err) {
                showToast(err.message || "Connection error. Make sure your local server is running.");
            } finally {
                aiSuggestBtn.classList.remove('loading');
            }
        });
    }

    // AI Suggestions Add Selected Button
    if (aiAddSelectedBtn) {
        aiAddSelectedBtn.addEventListener('click', () => {
            const dec = getActiveDecision();
            if (!dec) return;
            
            selectedPros.forEach(pText => {
                if (dec.pros.length === 1 && getItemText(dec.pros[0]).trim() === '') {
                    dec.pros[0] = { text: pText, weight: 1 };
                } else {
                    dec.pros.push({ text: pText, weight: 1 });
                }
            });
            
            selectedCons.forEach(cText => {
                if (dec.cons.length === 1 && getItemText(dec.cons[0]).trim() === '') {
                    dec.cons[0] = { text: cText, weight: 1 };
                } else {
                    dec.cons.push({ text: cText, weight: 1 });
                }
            });
            
            saveStateToStorage();
            renderApp();
            
            if (aiSuggestionModal) {
                aiSuggestionModal.classList.add('hidden');
            }
            
            showToast(`Added ${selectedPros.length + selectedCons.length} perspectives!`);
        });
    }

    // AI Suggestions Close button click
    if (closeAiSuggestionBtn && aiSuggestionModal) {
        const closeMod = () => {
            aiSuggestionModal.classList.add('hidden');
        };
        closeAiSuggestionBtn.addEventListener('click', closeMod);
        aiSuggestionModal.addEventListener('click', (e) => {
            if (e.target === aiSuggestionModal) {
                closeMod();
            }
        });
    }

    // Workspace Lock screen event listeners
    if (workspaceUnlockBtn) {
        workspaceUnlockBtn.addEventListener('click', unlockWorkspace);
    }
    if (workspacePasswordInput) {
        workspacePasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                unlockWorkspace();
            }
        });
    }

    // Custom password modal
    if (passwordModalSubmitBtn) {
        passwordModalSubmitBtn.addEventListener('click', handlePasswordSubmit);
    }
    if (closePasswordBtn) {
        closePasswordBtn.addEventListener('click', closePasswordModal);
    }
    const pwdInputs = [passwordModalInput1, passwordModalInput2];
    pwdInputs.forEach(inp => {
        if (inp) {
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePasswordSubmit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closePasswordModal();
                }
            });
        }
    });

    // AI Chat panel event listeners
    if (floatingChatBtn) {
        floatingChatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = aiChatPanel.classList.contains('open');
            if (isOpen) {
                aiChatPanel.classList.remove('open');
            } else {
                aiChatPanel.classList.add('open');
                loadChatForActiveDecision();
                aiChatInput.focus();
            }
        });
    }
    if (closeAiChatBtn) {
        closeAiChatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            aiChatPanel.classList.remove('open');
        });
    }
    if (aiDiscussBtn) {
        aiDiscussBtn.addEventListener('click', () => {
            const dec = getActiveDecision();
            if (!dec) return;
            
            if (selectedPros.length === 0 && selectedCons.length === 0) {
                showToast("Please select at least one suggested point to discuss.");
                return;
            }
            
            const topic = topicInput.value.trim() || 'Untitled Decision';
            let discussPrompt = `I would like to discuss these suggested points for my decision on '${topic}':`;
            selectedPros.forEach(p => discussPrompt += `\n- Advantage: "${p}"`);
            selectedCons.forEach(c => discussPrompt += `\n- Disadvantage: "${c}"`);
            discussPrompt += `\n\nCan you explain these points further, help me evaluate their trade-offs, and give me practical advice?`;
            
            // Clear checklist selection state
            selectedPros = [];
            selectedCons = [];
            
            // Reset checkboxes in suggestions modal
            const checkboxes = aiSuggestionModal.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
            
            // Update button text to "Add Selected (0)"
            if (aiAddSelectedBtn) aiAddSelectedBtn.innerText = 'Add Selected (0)';
            
            // Close suggestions modal
            aiSuggestionModal.classList.add('hidden');
            
            // Open chat panel and trigger message send
            aiChatPanel.classList.add('open');
            aiChatInput.value = discussPrompt;
            
            setTimeout(() => {
                sendChatMessage();
            }, 150);
        });
    }
    if (aiChatSendBtn) {
        aiChatSendBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sendChatMessage();
        });
    }
    if (aiChatInput) {
        aiChatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    // Dropdown Toggles
    menuBtn.addEventListener('click', () => {
        if (menuDropdown.classList.contains('hidden')) {
            openDropdown();
        } else {
            closeDropdown();
        }
    });
    menuOverlay.addEventListener('click', closeDropdown);

    // Save Thought Bubble Toggle
    saveBubbleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        saveBubbleDropdown.classList.toggle('hidden');
        if (!saveBubbleDropdown.classList.contains('hidden')) {
            renderBubbleTargets();
        }
    });

    // Close save bubble dropdown and share dropdown when clicking anywhere else
    document.addEventListener('click', (e) => {
        if (saveBubble && !saveBubble.contains(e.target)) {
            saveBubbleDropdown.classList.add('hidden');
        }
        const shareDropdown = document.getElementById('footerShareDropdown');
        const shareBtn = document.getElementById('footerShareBtn');
        if (shareDropdown && !shareDropdown.contains(e.target) && (!shareBtn || !shareBtn.contains(e.target))) {
            shareDropdown.classList.add('hidden');
        }
    });

    // Keyboard Shortcuts: Ctrl+Space (focus), ? (help), Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+Home/End (navigation bounds)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            toggleColumnFocus();
        } else if (e.key === '?' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            toggleHelpModal();
        } else if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            handleUndo();
        } else if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            handleRedo();
        } else if (e.ctrlKey && e.key === 'Home') {
            const listContainer = document.activeElement.closest('.items-list');
            if (listContainer) {
                e.preventDefault();
                const inputs = Array.from(listContainer.querySelectorAll('.item-input'));
                if (inputs.length > 0) inputs[0].focus();
            }
        } else if (e.ctrlKey && e.key === 'End') {
            const listContainer = document.activeElement.closest('.items-list');
            if (listContainer) {
                e.preventDefault();
                const inputs = Array.from(listContainer.querySelectorAll('.item-input'));
                if (inputs.length > 0) inputs[inputs.length - 1].focus();
            }
        } else if (e.ctrlKey && e.altKey && e.key === 'f') {
            e.preventDefault();
            toggleFocusMode();
        }
    });

    // Close help modal on button click or outside click
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (closeHelpBtn && helpModal) {
        closeHelpBtn.addEventListener('click', () => {
            helpModal.classList.add('hidden');
        });
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.add('hidden');
            }
        });
    }

    // Analytics Modal triggers
    const netBalanceScore = document.getElementById('netBalanceScore');
    if (netBalanceScore) {
        netBalanceScore.addEventListener('click', openAnalyticsModal);
    }
    const analyticsModal = document.getElementById('analyticsModal');
    const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');
    if (closeAnalyticsBtn && analyticsModal) {
        closeAnalyticsBtn.addEventListener('click', closeAnalyticsModal);
        analyticsModal.addEventListener('click', (e) => {
            if (e.target === analyticsModal) {
                closeAnalyticsModal();
            }
        });
    }

    // Custom Context Menu item click bindings & close on click-away
    document.addEventListener('click', () => {
        hideCustomContextMenu();
    });
    
    const ctxCycleWeight = document.getElementById('ctxCycleWeight');
    if (ctxCycleWeight) {
        ctxCycleWeight.addEventListener('click', () => {
            if (currentContextItem) {
                const { type, index } = currentContextItem;
                const dec = getActiveDecision();
                const arr = type === 'pro' ? dec.pros : dec.cons;
                const nextWeight = (getItemWeight(arr[index]) % 5) + 1;
                setItemWeight(arr, index, nextWeight);
                saveStateToStorage();
                renderList(type);
                updateNetBalanceScore();
            }
        });
    }
    
    const ctxDuplicate = document.getElementById('ctxDuplicate');
    if (ctxDuplicate) {
        ctxDuplicate.addEventListener('click', () => {
            if (currentContextItem) {
                const { type, index } = currentContextItem;
                duplicateOutlinerRow(type, index);
            }
        });
    }
    
    const ctxDelete = document.getElementById('ctxDelete');
    if (ctxDelete) {
        ctxDelete.addEventListener('click', () => {
            if (currentContextItem) {
                const { type, index } = currentContextItem;
                deleteOutlinerRow(type, index);
            }
        });
    }

    // Drawer search input expand and key binding
    const drawerSearchInput = document.getElementById('drawerSearchInput');
    const drawerSearchBtn = document.getElementById('drawerSearchBtn');
    
    if (drawerSearchBtn && drawerSearchInput) {
        drawerSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            drawerSearchInput.classList.toggle('expanded');
            if (drawerSearchInput.classList.contains('expanded')) {
                drawerSearchInput.focus();
            } else {
                drawerSearchInput.value = '';
                window.drawerSearchQuery = '';
                renderDrawer();
            }
        });
        
        drawerSearchInput.addEventListener('input', () => {
            window.drawerSearchQuery = drawerSearchInput.value;
            renderDrawer();
        });
        
        drawerSearchInput.addEventListener('keydown', (e) => {
            e.stopPropagation(); // prevent outliner keys trigger
            if (e.key === 'Escape') {
                drawerSearchInput.classList.remove('expanded');
                drawerSearchInput.value = '';
                window.drawerSearchQuery = '';
                renderDrawer();
                drawerSearchInput.blur();
            }
        });
        
        // Hide if clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.drawer-search-wrapper')) {
                if (drawerSearchInput.value === '') {
                    drawerSearchInput.classList.remove('expanded');
                }
            }
        });
    }

    // Settings gear button click
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (settingsDropdown.classList.contains('hidden')) {
                closeDropdown();
                openSettings();
            } else {
                closeSettings();
            }
        });
    }

    // Theme selector buttons inside settings
    if (themeLightBtn && themeDarkBtn && themeSepiaBtn) {
        themeLightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setTheme('clean-white');
            updateSettingsPanelUI();
            showToast('Theme: light');
        });
        themeDarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setTheme('zen-dark');
            updateSettingsPanelUI();
            showToast('Theme: dark');
        });
        themeSepiaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setTheme('warm-sepia');
            updateSettingsPanelUI();
            showToast('Theme: sepia');
        });
    }

    // Drawer Sort button and dropdown listeners
    if (drawerSortBtn && drawerSortDropdown) {
        drawerSortBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            drawerSortDropdown.classList.toggle('hidden');
        });
        
        // Handle sorting options clicks
        document.querySelectorAll('.sort-opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sortMode = btn.getAttribute('data-sort');
                sortDecisions(sortMode);
                drawerSortDropdown.classList.add('hidden');
            });
        });
        
        // Close sort dropdown if clicking outside
        document.addEventListener('click', (e) => {
            if (!drawerSortDropdown.classList.contains('hidden') && !drawerSortDropdown.contains(e.target) && e.target !== drawerSortBtn && !drawerSortBtn.contains(e.target)) {
                drawerSortDropdown.classList.add('hidden');
            }
        });
    }

    // Advanced tools toggle switches
    if (togglePrudential) {
        togglePrudential.addEventListener('change', () => {
            state.settings.showPrudential = togglePrudential.checked;
            debouncedSaveStateToStorage();
            renderApp();
            showToast(`Prudential Algebra: ${togglePrudential.checked ? 'Enabled' : 'Disabled'}`);
        });
    }
    if (toggleHorizons) {
        toggleHorizons.addEventListener('change', () => {
            state.settings.showHorizons = toggleHorizons.checked;
            debouncedSaveStateToStorage();
            
            // Show/hide horizons filter row
            if (toggleHorizons.checked) {
                horizonFilterRow.classList.remove('hidden');
            } else {
                horizonFilterRow.classList.add('hidden');
                if (horizonFilterSelect) horizonFilterSelect.value = 'all';
            }
            
            renderApp();
            showToast(`Time Horizons: ${toggleHorizons.checked ? 'Enabled' : 'Disabled'}`);
        });
    }
    if (toggleProbability) {
        toggleProbability.addEventListener('change', () => {
            state.settings.showProbability = toggleProbability.checked;
            debouncedSaveStateToStorage();
            renderApp();
            showToast(`Probability Weights: ${toggleProbability.checked ? 'Enabled' : 'Disabled'}`);
        });
    }
    if (toggleBalanceScore) {
        toggleBalanceScore.addEventListener('change', () => {
            state.settings.showBalanceScore = toggleBalanceScore.checked;
            debouncedSaveStateToStorage();
            renderApp();
            showToast(`Balance Score: ${toggleBalanceScore.checked ? 'Shown' : 'Hidden'}`);
        });
    }

    // Time horizon filter dropdown selection
    if (horizonFilterSelect) {
        horizonFilterSelect.addEventListener('change', () => {
            renderApp();
        });
    }

    // Mobile tabs clicking
    if (tabAdvantagesBtn && tabDisadvantagesBtn && tabCompareBtn) {
        tabAdvantagesBtn.addEventListener('click', () => {
            tabAdvantagesBtn.classList.add('active');
            tabDisadvantagesBtn.classList.remove('active');
            tabCompareBtn.classList.remove('active');
            if (splitColumns) splitColumns.className = 'split-columns show-advantages';
            growAllTextareas();
        });
        tabDisadvantagesBtn.addEventListener('click', () => {
            tabDisadvantagesBtn.classList.add('active');
            tabAdvantagesBtn.classList.remove('active');
            tabCompareBtn.classList.remove('active');
            if (splitColumns) splitColumns.className = 'split-columns show-disadvantages';
            growAllTextareas();
        });
        tabCompareBtn.addEventListener('click', () => {
            tabCompareBtn.classList.add('active');
            tabAdvantagesBtn.classList.remove('active');
            tabDisadvantagesBtn.classList.remove('active');
            if (splitColumns) splitColumns.className = 'split-columns show-advantages show-disadvantages compare-mode';
            growAllTextareas();
        });
    }
    
    // Close settings dropdown if clicking outside
    document.addEventListener('click', (e) => {
        if (settingsDropdown && !settingsDropdown.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)) {
            settingsDropdown.classList.add('hidden');
            if (menuDropdown.classList.contains('hidden')) {
                menuOverlay.classList.remove('active');
            }
        }
    });

    // Backup import file change trigger
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        importFileInput.addEventListener('change', (e) => {
            handleImportJSON(e);
            importFileInput.value = ''; // reset selection
        });
    }

    // Double-click empty list space or column background to append new outliner row
    document.getElementById('colAdvantages').addEventListener('dblclick', (e) => {
        if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && !e.target.closest('.column-header')) {
            appendEmptyOutlinerRow('pro');
        }
    });

    document.getElementById('colDisadvantages').addEventListener('dblclick', (e) => {
        if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && !e.target.closest('.column-header')) {
            appendEmptyOutlinerRow('con');
        }
    });

    // Show update check section if running inside WebView (Android app)
    if (window.AndroidUpdater) {
        if (settingsUpdateSection) {
            settingsUpdateSection.classList.remove('hidden');
        }
        if (checkUpdatesBtn) {
            checkUpdatesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                checkForAppUpdates(true);
            });
        }
        if (remindLaterBtn) {
            remindLaterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                localStorage.setItem('lastUpdateReminderTime', Date.now().toString());
                if (updateModal) updateModal.classList.add('hidden');
            });
        }
        if (updateNowBtn) {
            updateNowBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (updateModal) updateModal.classList.add('hidden');
                const downloadUrl = updateNowBtn.getAttribute('data-url');
                if (downloadUrl) {
                    showToast("Downloading update...");
                    window.AndroidUpdater.triggerUpdate(downloadUrl);
                }
            });
        }
        
        setTimeout(() => {
            checkForAppUpdates(false);
        }, 3000);
    }
}

// Self-Updater for Android WebView app
function checkForAppUpdates(isManual) {
    if (!window.AndroidUpdater) return;

    if (!isManual) {
        const lastReminder = localStorage.getItem('lastUpdateReminderTime');
        if (lastReminder) {
            const timeElapsed = Date.now() - parseInt(lastReminder, 10);
            const hoursElapsed = timeElapsed / (1000 * 60 * 60);
            if (hoursElapsed < 24) {
                console.log("OTA Update check suppressed: 24h reminder cooldown active.");
                return;
            }
        }
    }

    if (isManual) {
        showToast("Checking for updates...");
    }

    fetch(UPDATE_CHECK_URL + '?t=' + Date.now(), { cache: "no-store" })
        .then(response => {
            if (!response.ok) throw new Error("Network response error");
            return response.json();
        })
        .then(data => {
            const currentVersion = window.AndroidUpdater.getVersionCode();
            const latestVersion = data.versionCode;
            const downloadUrl = data.apkUrl;

            if (latestVersion > currentVersion) {
                const versionBadge = document.getElementById('updateVersionBadge');
                const sizeBadge = document.getElementById('updateSizeBadge');
                const notesList = document.getElementById('updateNotesList');

                if (versionBadge) {
                    versionBadge.innerText = `Version 1.${latestVersion}`;
                }
                if (sizeBadge) {
                    sizeBadge.innerText = `Size: ${data.fileSize || 'Unknown'}`;
                }

                if (notesList) {
                    notesList.innerHTML = '';
                    if (data.whatsNew && Array.isArray(data.whatsNew)) {
                        data.whatsNew.forEach(note => {
                            const li = document.createElement('li');
                            li.innerText = note;
                            notesList.appendChild(li);
                        });
                    } else {
                        const li = document.createElement('li');
                        li.innerText = "Bug fixes and user interface performance enhancements.";
                        notesList.appendChild(li);
                    }
                }

                if (updateNowBtn) {
                    updateNowBtn.setAttribute('data-url', downloadUrl);
                }
                if (updateModal) {
                    updateModal.classList.remove('hidden');
                }
            } else {
                if (isManual) {
                    showToast("You are on the latest version!");
                }
            }
        })
        .catch(err => {
            console.error("Update check failed:", err);
            if (isManual) {
                showToast("Update check failed. Check internet connection.");
            }
        });
}

// Open Decision Analytics Modal
function openAnalyticsModal() {
    const dec = getActiveDecision();
    const modal = document.getElementById('analyticsModal');
    if (!dec || !modal) return;
    
    const activePros = dec.pros.filter(p => getItemText(p).trim() !== '');
    const activeCons = dec.cons.filter(c => getItemText(c).trim() !== '');
    
    const totalFactors = activePros.length + activeCons.length;
    document.getElementById('metricTotalPoints').innerText = totalFactors;
    
    let sumWeight = 0;
    let countFactors = 0;
    activePros.forEach(p => { sumWeight += getItemWeight(p); countFactors++; });
    activeCons.forEach(c => { sumWeight += getItemWeight(c); countFactors++; });
    const avgWeight = countFactors > 0 ? (sumWeight / countFactors).toFixed(1) : "0.0";
    document.getElementById('metricAvgWeight').innerText = avgWeight;
    
    let wordCount = 0;
    const allTexts = [dec.topic || ''];
    activePros.forEach(p => allTexts.push(getItemText(p)));
    activeCons.forEach(c => allTexts.push(getItemText(c)));
    allTexts.forEach(txt => {
        const clean = txt.trim().replace(/\s+/g, ' ');
        if (clean) {
            wordCount += clean.split(' ').length;
        }
    });
    document.getElementById('metricWords').innerText = wordCount;
    
    let weightedPros = 0;
    activePros.forEach(p => weightedPros += getItemWeight(p));
    let weightedCons = 0;
    activeCons.forEach(c => weightedCons += getItemWeight(c));
    
    const recText = document.getElementById('analyticsRecommendation');
    if (recText) {
        if (totalFactors === 0) {
            recText.innerText = "Please write some advantages and disadvantages to generate a decisiveness score and recommendation summary.";
        } else {
            const diff = weightedPros - weightedCons;
            if (diff === 0) {
                recText.innerText = "The advantages and disadvantages are perfectly balanced. Review your critical factors to break the tie.";
            } else if (diff > 0) {
                const ratio = (weightedPros / (weightedPros + weightedCons) * 100).toFixed(0);
                recText.innerText = `The advantages outweigh the disadvantages by a margin of +${diff} (totaling ${ratio}% of the decision weight). Recommendation: Proceed with this course of action.`;
            } else {
                const ratio = (weightedCons / (weightedPros + weightedCons) * 100).toFixed(0);
                recText.innerText = `The disadvantages outweigh the advantages by a margin of ${diff} (totaling ${ratio}% of the decision weight). Recommendation: Reconsider or explore other alternative paths.`;
            }
        }
    }
    
    const list = document.getElementById('criticalFactorsList');
    if (list) {
        list.innerHTML = '';
        const cfPros = activePros.filter(p => getItemWeight(p) === 5);
        const cfCons = activeCons.filter(c => getItemWeight(c) === 5);
        
        if (cfPros.length === 0 && cfCons.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.style.opacity = '0.5';
            emptyLi.innerText = "No critical (5x importance) factors marked.";
            list.appendChild(emptyLi);
        } else {
            cfPros.forEach(p => {
                const li = document.createElement('li');
                li.className = 'pro-cf';
                li.innerHTML = `<span class="badge-cf">PRO</span> <span>${getItemText(p)}</span>`;
                list.appendChild(li);
            });
            cfCons.forEach(c => {
                const li = document.createElement('li');
                li.className = 'con-cf';
                li.innerHTML = `<span class="badge-cf">CON</span> <span>${getItemText(c)}</span>`;
                list.appendChild(li);
            });
        }
    }
    
    modal.classList.remove('hidden');
}

function closeAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function toggleHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.toggle('hidden');
    }
}

// Toggle Zen Focus Mode
function toggleFocusMode() {
    document.body.classList.toggle('focus-mode');
    const isFocus = document.body.classList.contains('focus-mode');
    showToast(isFocus ? "Focus Mode Enabled (Ctrl+Alt+F to exit)" : "Focus Mode Disabled");
}

// Custom Outliner Context Menu handlers
let currentContextItem = null;

function showCustomContextMenu(e, type, index) {
    const menu = document.getElementById('customContextMenu');
    if (!menu) return;
    
    currentContextItem = { type: type, index: index };
    
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    
    const submenu = document.getElementById('ctxMoveSubmenu');
    if (submenu) {
        submenu.innerHTML = '';
        state.categories.forEach(cat => {
            if (cat.name === 'Drafts' || cat.name === state.activeCategoryName) return;
            const li = document.createElement('li');
            li.className = 'context-menu-item';
            li.innerText = cat.name;
            li.addEventListener('click', (ev) => {
                ev.stopPropagation();
                moveOutlinerItemToArea(type, index, cat.name);
                hideCustomContextMenu();
            });
            submenu.appendChild(li);
        });
        
        const parentLi = submenu.closest('.context-menu-submenu-parent');
        if (parentLi) {
            const hasOtherCats = state.categories.filter(c => c.name !== 'Drafts' && c.name !== state.activeCategoryName).length > 0;
            parentLi.style.display = hasOtherCats ? 'flex' : 'none';
        }
    }
    
    menu.classList.remove('hidden');
}

function hideCustomContextMenu() {
    const menu = document.getElementById('customContextMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

function duplicateOutlinerRow(type, index) {
    const dec = getActiveDecision();
    if (!dec) return;
    const arr = type === 'pro' ? dec.pros : dec.cons;
    const original = arr[index];
    const clone = typeof original === 'object' ? { text: original.text, weight: original.weight } : original;
    arr.splice(index + 1, 0, clone);
    saveStateToStorage();
    renderList(type);
    updateNetBalanceScore();
}

function deleteOutlinerRow(type, index) {
    const dec = getActiveDecision();
    if (!dec) return;
    const arr = type === 'pro' ? dec.pros : dec.cons;
    
    if (arr.length === 1) {
        arr[0] = '';
    } else {
        arr.splice(index, 1);
    }
    
    saveStateToStorage();
    renderList(type);
    updateNetBalanceScore();
}

function moveOutlinerItemToArea(type, index, targetAreaName) {
    const dec = getActiveDecision();
    if (!dec) return;
    
    const targetCat = state.categories.find(c => c.name === targetAreaName);
    if (!targetCat || targetCat.decisions.length === 0) {
        showToast(`Target Area "${targetAreaName}" has no active decisions.`);
        return;
    }
    
    const targetDec = targetCat.decisions[0];
    const arr = type === 'pro' ? dec.pros : dec.cons;
    const targetArr = type === 'pro' ? targetDec.pros : targetDec.cons;
    
    const item = arr.splice(index, 1)[0];
    if (arr.length === 0) arr.push('');
    
    if (targetArr.length === 1 && getItemText(targetArr[0]).trim() === '') {
        targetArr[0] = item;
    } else {
        targetArr.push(item);
    }
    
    saveStateToStorage();
    renderList(type);
    updateNetBalanceScore();
    showToast(`Moved factor to area "${targetAreaName}"`);
}

function appendEmptyOutlinerRow(type) {
    const activeDec = getActiveDecision();
    if (activeDec) {
        const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
        arr.push('');
        saveStateToStorage();
        renderList(type);
        renderFooter();
        setTimeout(() => {
            const listContainer = type === 'pro' ? advantagesList : disadvantagesList;
            const inputs = Array.from(listContainer.querySelectorAll('.item-input'));
            if (inputs.length > 0) {
                inputs[inputs.length - 1].focus();
            }
        }, 0);
    }
}

// Keyboard navigation: switch cursor focus between Advantage and Disadvantage columns
function toggleColumnFocus() {
    const activeEl = document.activeElement;
    
    if (!activeEl || !activeEl.classList.contains('item-input')) {
        focusFirstItem('pro');
        return;
    }
    
    const currentIndex = parseInt(activeEl.dataset.index) || 0;
    const isAdvantage = activeEl.closest('#advantagesList') !== null;
    
    if (isAdvantage) {
        const disInputs = Array.from(disadvantagesList.querySelectorAll('.item-input'));
        if (disInputs.length > 0) {
            const targetInput = disInputs[currentIndex] || disInputs[disInputs.length - 1];
            targetInput.focus();
            const val = targetInput.value;
            targetInput.setSelectionRange(val.length, val.length);
        }
    } else {
        const advInputs = Array.from(advantagesList.querySelectorAll('.item-input'));
        if (advInputs.length > 0) {
            const targetInput = advInputs[currentIndex] || advInputs[advInputs.length - 1];
            targetInput.focus();
            const val = targetInput.value;
            targetInput.setSelectionRange(val.length, val.length);
        }
    }
}

// Dropdown Visibility Controls
function openDropdown() {
    menuDropdown.classList.remove('hidden');
    menuOverlay.classList.add('active');
    renderDrawer();
}

function closeDropdown() {
    menuDropdown.classList.add('hidden');
    menuOverlay.classList.remove('active');
}

// Settings Visibility Controls
function openSettings() {
    settingsDropdown.classList.remove('hidden');
    menuOverlay.classList.add('active');
    updateSettingsPanelUI();
}

function closeSettings() {
    settingsDropdown.classList.add('hidden');
    menuOverlay.classList.remove('active');
}

function getActiveThemeName() {
    const savedTheme = localStorage.getItem('decision_helper_theme') || 'clean-white';
    if (savedTheme === 'zen-dark') return 'dark';
    if (savedTheme === 'warm-sepia') return 'sepia';
    return 'light';
}

function updateSettingsPanelUI() {
    const activeTheme = getActiveThemeName();
    if (themeLightBtn) themeLightBtn.classList.toggle('active', activeTheme === 'light');
    if (themeDarkBtn) themeDarkBtn.classList.toggle('active', activeTheme === 'dark');
    if (themeSepiaBtn) themeSepiaBtn.classList.toggle('active', activeTheme === 'sepia');

    if (!state.settings) {
        state.settings = {
            showPrudential: false,
            showHorizons: false,
            showProbability: false,
            showBalanceScore: true
        };
    }
    if (toggleBalanceScore) toggleBalanceScore.checked = !!state.settings.showBalanceScore;
    if (togglePrudential) togglePrudential.checked = !!state.settings.showPrudential;
    if (toggleHorizons) toggleHorizons.checked = !!state.settings.showHorizons;
    if (toggleProbability) toggleProbability.checked = !!state.settings.showProbability;
}

// Create a new Life Area category (Heading)
function handleAddArea(areaNameInput) {
    const areaName = areaNameInput.value.trim();
    if (!areaName) return;
    areaNameInput.value = '';
    
    const exists = state.categories.some(c => c.name.toLowerCase() === areaName.toLowerCase());
    if (exists) {
        alert('This area already exists!');
        return;
    }
    
    const isLockedFolder = (state.selectedFilterCategory === '🔒 Locked Vault') || 
        !!(state.categories.find(c => c.name === state.selectedFilterCategory && c.isLocked));

    const newDecId = 'dec_' + Date.now();
    state.categories.push({
        name: areaName,
        isLocked: isLockedFolder,
        decisions: [
            { id: newDecId, topic: '', pros: [''], cons: [''] }
        ]
    });
    
    if (!window.expandedCategories) {
        window.expandedCategories = {};
    }
    window.expandedCategories[areaName] = true;
    
    state.activeCategoryName = areaName;
    state.activeDecisionId = newDecId;
    state.selectedFilterCategory = areaName;
    
    saveStateToStorage();
    renderApp();
    renderDrawer();
    closeDropdown();
    renderFooter();
    topicInput.focus();
    adjustTopicFontSizeAndHeight();
}

// Add a decision (Subheading) under an area
function addDecisionToArea(categoryName) {
    const category = state.categories.find(c => c.name === categoryName);
    if (!category) return;
    
    const newId = 'dec_' + Date.now();
    const newDec = {
        id: newId,
        topic: '',
        pros: [''],
        cons: ['']
    };
    
    category.decisions.push(newDec);
    state.activeCategoryName = categoryName;
    state.activeDecisionId = newId;
    
    saveStateToStorage();
    switchView('workspace');
    renderDrawer();
    closeDropdown();
    renderFooter();
    
    topicInput.focus();
    adjustTopicFontSizeAndHeight();
}

// Select a decision topic
function selectDecision(categoryName, decisionId) {
    if (state.activeDecisionId !== decisionId) {
        window.unlockedDecisions = {};
        window.activeChatHistory = [];
        if (aiChatPanel) aiChatPanel.classList.remove('open');
    }
    
    if (!window.expandedCategories) {
        window.expandedCategories = {};
    }
    window.expandedCategories[categoryName] = true;
    
    state.activeCategoryName = categoryName;
    state.activeDecisionId = decisionId;
    saveStateToStorage();
    switchView('workspace');
    renderDrawer();
    closeDropdown();
    renderFooter();
}

// Delete a decision
function deleteDecision(categoryName, decisionId, event) {
    if (event) event.stopPropagation();
    
    const category = state.categories.find(c => c.name === categoryName);
    if (!category) return;
    
    const dec = category.decisions.find(d => d.id === decisionId);
    if (!dec) return;
    
    if (dec.passwordHash) {
        openPasswordModal('verify', 'Delete Protected Decision', 'Enter password or PIN to delete this protected decision.', async (enteredHash) => {
            const enteredRaw = passwordModalInput1.value.trim();
            const masterPin = localStorage.getItem('master_vault_pin') || '1234';
            const decoyPin = localStorage.getItem('decoy_vault_pin') || '0000';
            if (enteredHash === dec.passwordHash || enteredRaw === masterPin || enteredRaw === decoyPin) {
                category.decisions = category.decisions.filter(d => d.id !== decisionId);
                
                if (state.activeDecisionId === decisionId && state.activeCategoryName === categoryName) {
                    let foundNewActive = false;
                    for (let cat of state.categories) {
                        if (cat.decisions.length > 0) {
                            state.activeCategoryName = cat.name;
                            state.activeDecisionId = cat.decisions[0].id;
                            foundNewActive = true;
                            break;
                        }
                    }
                    if (!foundNewActive) {
                        const drafts = state.categories.find(c => c.name === 'Drafts') || state.categories[0];
                        const newId = 'dec_draft_' + Date.now();
                        drafts.decisions = [{ id: newId, topic: '', pros: [''], cons: [''] }];
                        state.activeCategoryName = drafts.name;
                        state.activeDecisionId = newId;
                    }
                }
                
                saveStateToStorage();
                renderApp();
                renderDrawer();
                renderFooter();
                showToast("Decision deleted successfully.");
                return true;
            } else {
                return false;
            }
        });
        return;
    }
    
    category.decisions = category.decisions.filter(d => d.id !== decisionId);
    
    if (state.activeDecisionId === decisionId && state.activeCategoryName === categoryName) {
        let foundNewActive = false;
        for (let cat of state.categories) {
            if (cat.decisions.length > 0) {
                state.activeCategoryName = cat.name;
                state.activeDecisionId = cat.decisions[0].id;
                foundNewActive = true;
                break;
            }
        }
        
        if (!foundNewActive) {
            const drafts = state.categories.find(c => c.name === 'Drafts') || state.categories[0];
            const newId = 'dec_draft_' + Date.now();
            drafts.decisions = [{ id: newId, topic: '', pros: [''], cons: [''] }];
            state.activeCategoryName = drafts.name;
            state.activeDecisionId = newId;
        }
    }
    
    saveStateToStorage();
    renderApp();
    renderDrawer();
    renderFooter();
}

// Delete an entire category area
function deleteCategoryArea(categoryName, event) {
    if (event) event.stopPropagation();
    
    if (categoryName === 'Drafts') {
        alert('The Drafts area cannot be deleted.');
        return;
    }
    
    state.categories = state.categories.filter(c => c.name !== categoryName);
    
    if (state.activeCategoryName === categoryName) {
        state.activeCategoryName = state.categories[0].name;
        if (state.categories[0].decisions.length > 0) {
            state.activeDecisionId = state.categories[0].decisions[0].id;
        } else {
            const newId = 'dec_' + Date.now();
            state.categories[0].decisions.push({ id: newId, topic: '', pros: [''], cons: [''] });
            state.activeDecisionId = newId;
        }
    }
    
    saveStateToStorage();
    renderApp();
    renderDrawer();
    renderFooter();
}

// Rename a category area
function renameCategoryArea(oldName, newName) {
    newName = newName.trim();
    if (!newName || newName === oldName) return;
    
    if (state.categories.some(c => c.name === newName)) {
        showToast(`Area "${newName}" already exists.`);
        renderDrawer();
        return;
    }
    
    const cat = state.categories.find(c => c.name === oldName);
    if (cat) {
        cat.name = newName;
        if (state.activeCategoryName === oldName) {
            state.activeCategoryName = newName;
        }
        saveStateToStorage();
        renderDrawer();
        renderFooter();
        showToast(`Area renamed to "${newName}"`);
    }
}

// Sort decisions inside category areas
function sortDecisions(mode, showNotification = true) {
    window.drawerSortMode = mode;
    localStorage.setItem('drawer_sort_mode', mode);
    
    document.querySelectorAll('.sort-opt-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-sort') === mode);
    });
    
    state.categories.forEach(cat => {
        if (mode === 'alpha') {
            cat.decisions.sort((a, b) => {
                const topicA = (a.topic || '').trim().toLowerCase();
                const topicB = (b.topic || '').trim().toLowerCase();
                if (!topicA) return 1;
                if (!topicB) return -1;
                return topicA.localeCompare(topicB);
            });
        } else if (mode === 'date') {
            cat.decisions.sort((a, b) => {
                const getTimestamp = (id) => {
                    const match = String(id).match(/\d+$/);
                    return match ? parseInt(match[0], 10) : 0;
                };
                return getTimestamp(b.id) - getTimestamp(a.id);
            });
        } else if (mode === 'size') {
            cat.decisions.sort((a, b) => {
                const sizeA = (a.pros.filter(p => getItemText(p).trim() !== '').length) + 
                              (a.cons.filter(c => getItemText(c).trim() !== '').length);
                const sizeB = (b.pros.filter(p => getItemText(p).trim() !== '').length) + 
                              (b.cons.filter(c => getItemText(c).trim() !== '').length);
                return sizeB - sizeA;
            });
        }
    });
    
    localStorage.setItem('pros_cons_multi_state', JSON.stringify(state));
    renderDrawer();
    if (showNotification) {
        let msg = 'Sorted topics';
        if (mode === 'alpha') msg = 'Sorted topics by A-Z (Alphabetical)';
        else if (mode === 'date') msg = 'Sorted topics by Recent';
        else if (mode === 'size') msg = 'Sorted topics by Size (Longest)';
        showToast(msg);
    }
}

// Clear current text values of active decision
function handleClearAll() {
    const dec = getActiveDecision();
    if (!dec) return;
    
    const activeCat = state.categories.find(c => c.name === state.activeCategoryName);
    const isLocked = (!window.unlockedVaultSession && activeCat && activeCat.isLocked) || 
                     (!window.unlockedVaultSession && dec.passwordHash && !window.unlockedDecisions[dec.id]);
    if (isLocked) {
        showToast("Decision is locked. Unlock to clear.");
        return;
    }
    
    dec.topic = '';
    dec.pros = [''];
    dec.cons = [''];
    saveStateToStorage();
    renderApp();
    renderDrawer();
    renderFooter();
    topicInput.focus();
    adjustTopicFontSizeAndHeight();
    updateAiSuggestBtnVisibility();
}

// Helper getters/setters for item objects / simple strings
function getItemText(item) {
    if (item && typeof item === 'object') {
        return item.text || '';
    }
    return typeof item === 'string' ? item : '';
}

// Helper getter for items to extract weight
function getItemWeight(item) {
    if (item && typeof item === 'object') {
        return typeof item.weight === 'number' ? item.weight : 1;
    }
    return 1;
}

function setItemText(arr, index, text) {
    if (arr[index] && typeof arr[index] === 'object') {
        arr[index].text = text;
    } else {
        arr[index] = { text: text, weight: 1 };
    }
}

function setItemWeight(arr, index, weight) {
    if (arr[index] && typeof arr[index] === 'object') {
        arr[index].weight = weight;
    } else {
        arr[index] = { text: '', weight: weight };
    }
}

// Check if decision is completely un-authored/empty
function isDecisionEmpty(dec) {
    if (!dec) return true;
    const hasTopic = dec.topic && dec.topic.trim() !== '';
    const hasPros = dec.pros && dec.pros.some(p => getItemText(p).trim() !== '');
    const hasCons = dec.cons && dec.cons.some(c => getItemText(c).trim() !== '');
    return !hasTopic && !hasPros && !hasCons;
}

// Helper to calculate individual item score adjusted by settings
function calculateItemScore(item) {
    if (state.settings && state.settings.showPrudential && item.cancelled) {
        return 0;
    }
    let score = getItemWeight(item);
    if (state.settings && state.settings.showProbability) {
        const prob = typeof item.probability !== 'undefined' ? item.probability : 100;
        score = score * (prob / 100.0);
    }
    return score;
}

// Calculate and render decision balance metrics
function updateNetBalanceScore() {
    const dec = getActiveDecision();
    const scoreEl = document.getElementById('netBalanceScore');
    if (!dec || !scoreEl) return;
    
    if (state.settings && state.settings.showBalanceScore === false) {
        scoreEl.classList.add('hidden');
        return;
    }
    
    const activeCat = state.categories.find(c => c.name === state.activeCategoryName);
    const isLocked = (!window.unlockedVaultSession && activeCat && activeCat.isLocked) || 
                     (!window.unlockedVaultSession && dec.passwordHash && !window.unlockedDecisions[dec.id]);
    if (isLocked) {
        scoreEl.classList.add('hidden');
        scoreEl.style.display = 'none';
        return;
    }
    
    if (isDecisionEmpty(dec)) {
        scoreEl.classList.add('hidden');
        return;
    }
    scoreEl.classList.remove('hidden');
    
    const activePros = dec.pros.filter(p => getItemText(p).trim() !== '');
    const activeCons = dec.cons.filter(c => getItemText(c).trim() !== '');
    
    const currentFilter = (state.settings && state.settings.showHorizons && horizonFilterSelect) ? horizonFilterSelect.value : 'all';
    
    const filteredPros = activePros.filter(p => {
        if (currentFilter === 'all') return true;
        const itemHorizon = p.horizon || 'none';
        return itemHorizon === currentFilter;
    });
    
    const filteredCons = activeCons.filter(c => {
        if (currentFilter === 'all') return true;
        const itemHorizon = c.horizon || 'none';
        return itemHorizon === currentFilter;
    });
    
    let weightedPros = 0;
    filteredPros.forEach(p => weightedPros += calculateItemScore(p));
    
    let weightedCons = 0;
    filteredCons.forEach(c => weightedCons += calculateItemScore(c));
    
    const net = Math.round((weightedPros - weightedCons) * 10) / 10;
    const sign = net > 0 ? '+' : '';
    
    scoreEl.classList.remove('positive', 'negative', 'balanced');
    
    if (net > 0) {
        scoreEl.innerText = `Weighted Balance: ${sign}${net} (Favorable)`;
        scoreEl.classList.add('positive');
    } else if (net < 0) {
        scoreEl.innerText = `Weighted Balance: ${net} (Unfavorable)`;
        scoreEl.classList.add('negative');
    } else {
        scoreEl.innerText = `Weighted Balance: 0 (Balanced)`;
        scoreEl.classList.add('balanced');
    }

    updateVisualScoreRatioBar(weightedPros, weightedCons);
}

function updateVisualScoreRatioBar(weightedPros, weightedCons) {
    const proLabel = document.getElementById('scoreProLabel');
    const conLabel = document.getElementById('scoreConLabel');
    const recLabel = document.getElementById('scoreRecommendation');
    const proFill = document.getElementById('scoreProFill');
    const conFill = document.getElementById('scoreConFill');
    
    if (!proLabel || !conLabel || !recLabel || !proFill || !conFill) return;
    
    const total = weightedPros + weightedCons;
    let proPct = 50;
    let conPct = 50;
    let recommendation = "Balanced Decision";
    
    if (total > 0) {
        proPct = Math.round((weightedPros / total) * 100);
        conPct = 100 - proPct;
        
        if (proPct >= 70) recommendation = "🎯 Strongly Favorable";
        else if (proPct >= 55) recommendation = "👍 Leaning Yes";
        else if (proPct <= 30) recommendation = "⚠️ High Risk / Unfavorable";
        else if (proPct <= 45) recommendation = "👎 Leaning No";
        else recommendation = "⚖️ Balanced Decision";
    }
    
    proLabel.innerText = `${proPct}% Pro`;
    conLabel.innerText = `${conPct}% Con`;
    recLabel.innerText = recommendation;
    proFill.style.width = `${proPct}%`;
    conFill.style.width = `${conPct}%`;
}

function setupExportHandlers() {
    const exportModal = document.getElementById('exportModal');
    const closeExportBtn = document.getElementById('closeExportBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportMdBtn = document.getElementById('exportMdBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const copyTextBtn = document.getElementById('copyTextBtn');

    if (closeExportBtn) {
        closeExportBtn.addEventListener('click', () => {
            if (exportModal) exportModal.classList.add('hidden');
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            if (exportModal) exportModal.classList.add('hidden');
            window.print();
        });
    }

    if (exportMdBtn) {
        exportMdBtn.addEventListener('click', () => {
            const dec = getActiveDecision();
            if (!dec) return;
            const topic = dec.topic.trim() || 'Untitled Decision';
            let md = `# Decision: ${topic} (${state.activeCategoryName})\n\n`;
            md += `## Advantages (Pros)\n`;
            (dec.pros || []).forEach(p => {
                const t = getItemText(p).trim();
                if (t) md += `- ${t}\n`;
            });
            md += `\n## Disadvantages (Cons)\n`;
            (dec.cons || []).forEach(c => {
                const t = getItemText(c).trim();
                if (t) md += `- ${t}\n`;
            });
            const blob = new Blob([md], { type: 'text/markdown' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_decision.md`;
            a.click();
            if (exportModal) exportModal.classList.add('hidden');
            showToast("Exported Markdown file!");
        });
    }

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `decision_helper_backup_${Date.now()}.json`;
            a.click();
            if (exportModal) exportModal.classList.add('hidden');
            showToast("Exported JSON backup!");
        });
    }

    if (copyTextBtn) {
        copyTextBtn.addEventListener('click', () => {
            copyToClipboard();
            if (exportModal) exportModal.classList.add('hidden');
        });
    }
}

// Theme cycling setup (Light / Dark / Sepia)
const themes = ['clean-white', 'zen-dark', 'warm-sepia'];
let currentThemeIndex = 0;

function setupTheme() {
    const savedTheme = localStorage.getItem('decision_helper_theme') || 'clean-white';
    setTheme(savedTheme);
}

function setTheme(themeName) {
    themes.forEach(t => document.body.classList.remove(t));
    document.body.classList.add(themeName);
    currentThemeIndex = themes.indexOf(themeName);
    localStorage.setItem('decision_helper_theme', themeName);
}

// Undo state transition
function handleUndo() {
    if (undoStack.length > 1) {
        const current = undoStack.pop();
        redoStack.push(current);
        
        const prevObj = JSON.parse(undoStack[undoStack.length - 1]);
        state = prevObj.state;
        
        saveStateToStorageNoHistory();
        renderApp();
        renderDrawer();
        renderFooter();
        
        setTimeout(() => {
            restoreActiveFocusState(prevObj.focus);
        }, 50);
        showToast("Undo applied!");
    } else {
        showToast("Nothing to undo");
    }
}

// Redo state transition
function handleRedo() {
    if (redoStack.length > 0) {
        const next = redoStack.pop();
        undoStack.push(next);
        
        const nextObj = JSON.parse(next);
        state = nextObj.state;
        
        saveStateToStorageNoHistory();
        renderApp();
        renderDrawer();
        renderFooter();
        
        setTimeout(() => {
            restoreActiveFocusState(nextObj.focus);
        }, 50);
        showToast("Redo applied!");
    } else {
        showToast("Nothing to redo");
    }
}

// Render active decision values to main layout
function renderApp() {
    const dec = getActiveDecision();
    if (!dec) return;
    
    const activeCat = state.categories.find(c => c.name === state.activeCategoryName);
    const isLocked = (!window.unlockedVaultSession && activeCat && activeCat.isLocked) || 
                     (!window.unlockedVaultSession && dec.passwordHash && !window.unlockedDecisions[dec.id]);
    
    const scoreEl = document.getElementById('netBalanceScore');
    const chatBtn = document.getElementById('floatingChatBtn');
    
    if (isLocked) {
        if (lockWorkspaceOverlay) { 
            lockWorkspaceOverlay.classList.remove('hidden'); 
            lockWorkspaceOverlay.style.display = 'flex'; 
        }
        if (splitColumns) { splitColumns.classList.add('hidden'); splitColumns.style.display = 'none'; }
        if (scoreEl) { scoreEl.classList.add('hidden'); scoreEl.style.display = 'none'; }
        if (aiSuggestBtn) { aiSuggestBtn.classList.remove('visible'); aiSuggestBtn.style.display = 'none'; }
        if (chatBtn) { chatBtn.classList.add('hidden'); chatBtn.style.display = 'none'; }
        if (aiChatPanel) { aiChatPanel.classList.remove('open'); }
        
        topicInput.value = '🔒 Locked Decision';
        topicInput.disabled = true;
        workspacePasswordInput.value = '';
        workspaceUnlockError.classList.add('hidden');
        if (advantagesList) advantagesList.innerHTML = '';
        if (disadvantagesList) disadvantagesList.innerHTML = '';
        renderFooter();
    } else {
        if (lockWorkspaceOverlay) { lockWorkspaceOverlay.classList.add('hidden'); lockWorkspaceOverlay.style.display = 'none'; }
        if (splitColumns) { splitColumns.classList.remove('hidden'); splitColumns.style.display = 'grid'; }
        if (scoreEl) { scoreEl.style.display = ''; }
        if (chatBtn) { chatBtn.classList.remove('hidden'); chatBtn.style.display = 'flex'; }
        if (aiSuggestBtn) { aiSuggestBtn.style.display = ''; }
        
        if (topicInput) {
            topicInput.disabled = false;
            topicInput.value = dec.topic || '';
            adjustTopicFontSizeAndHeight();
        }
        
        // Clean up empty ghost items so they don't clutter the workspace
        if (dec.pros && dec.pros.length > 1) {
            const filledPros = dec.pros.filter(item => getItemText(item).trim() !== '');
            if (filledPros.length > 0) dec.pros = filledPros;
        }
        if (dec.cons && dec.cons.length > 1) {
            const filledCons = dec.cons.filter(item => getItemText(item).trim() !== '');
            if (filledCons.length > 0) dec.cons = filledCons;
        }
        
        renderList('pro');
        renderList('con');
        updateNetBalanceScore();
        updateAiSuggestBtnVisibility();
        growAllTextareas();
        adjustFloatingChatBtnPosition();
        renderFooter();
    }
}

// Render specific column
function renderList(type) {
    const dec = getActiveDecision();
    if (!dec) return;
    
    if (!dec.pros || !Array.isArray(dec.pros) || dec.pros.length === 0) dec.pros = [{ text: '', weight: 1 }];
    if (!dec.cons || !Array.isArray(dec.cons) || dec.cons.length === 0) dec.cons = [{ text: '', weight: 1 }];
    
    const list = type === 'pro' ? dec.pros : dec.cons;
    const listContainer = type === 'pro' 
        ? (document.getElementById('advantagesList') || advantagesList) 
        : (document.getElementById('disadvantagesList') || disadvantagesList);
        
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    let visibleIndex = 1;
    list.forEach((item, index) => {
        if (typeof item === 'string') {
            item = { text: item, weight: 1 };
            list[index] = item;
        } else if (!item || typeof item !== 'object') {
            item = { text: '', weight: 1 };
            list[index] = item;
        }

        const currentFilter = (state.settings && state.settings.showHorizons && horizonFilterSelect) ? horizonFilterSelect.value : 'all';
        if (state.settings && state.settings.showHorizons && currentFilter !== 'all') {
            const itemHorizon = item.horizon || 'none';
            if (currentFilter === 'short' && itemHorizon !== 'short') return;
            if (currentFilter === 'long' && itemHorizon !== 'long') return;
        }

        const li = document.createElement('li');
        li.className = 'item-row';
        if (state.settings && state.settings.showPrudential && item.cancelled) {
            li.classList.add('cancelled');
        }

        li.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showCustomContextMenu(e, type, index);
        });
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'item-number';
        numberSpan.innerText = `${visibleIndex}.`;
        visibleIndex++;
        
        numberSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            textarea.value = '';
            const activeDec = getActiveDecision();
            if (activeDec) {
                const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
                setItemText(arr, index, '');
                saveStateToStorage();
                autoGrowTextarea(textarea);
                renderFooter();
                updateNetBalanceScore();
            }
        });

        const textarea = document.createElement('textarea');
        textarea.className = 'item-input';
        textarea.dataset.index = index;
        textarea.rows = 1;
        textarea.value = getItemText(item);
        textarea.placeholder = type === 'pro' ? 'type advantage...' : 'type disadvantage...';
        
        textarea.addEventListener('blur', (e) => {
            const activeDec = getActiveDecision();
            if (activeDec) {
                const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
                const val = e.target.value.trim();
                // Clean up empty ghost rows on blur if more than 1 row exists
                if (val === '' && arr.length > 1) {
                    arr.splice(index, 1);
                    saveStateToStorage();
                    renderList(type);
                    updateNetBalanceScore();
                }
            }
        });
        
        textarea.addEventListener('input', (e) => {
            const val = e.target.value;
            const activeDec = getActiveDecision();
            if (activeDec) {
                const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
                setItemText(arr, index, val);
                debouncedSaveStateToStorage();
                autoGrowTextarea(e.target);
                renderFooter();
                updateNetBalanceScore();
                
                const oppositeType = type === 'pro' ? 'con' : 'pro';
                const oppositeHeaderEl = oppositeType === 'pro' ? document.getElementById('advantagesHeader') : document.getElementById('disadvantagesHeader');
                const thisHeaderEl = type === 'pro' ? document.getElementById('advantagesHeader') : document.getElementById('disadvantagesHeader');
                
                if (isDecisionEmpty(activeDec)) {
                    if (thisHeaderEl) thisHeaderEl.innerText = type === 'pro' ? 'Advantages' : 'Disadvantages';
                    if (oppositeHeaderEl) oppositeHeaderEl.innerText = oppositeType === 'pro' ? 'Advantages' : 'Disadvantages';
                    if (tabAdvantagesBtn) tabAdvantagesBtn.innerText = 'Advantages (0)';
                    if (tabDisadvantagesBtn) tabDisadvantagesBtn.innerText = 'Disadvantages (0)';
                } else {
                    const thisCount = arr.filter(item => getItemText(item).trim() !== '').length;
                    if (thisHeaderEl) thisHeaderEl.innerText = type === 'pro' ? `Advantages (${thisCount})` : `Disadvantages (${thisCount})`;
                    
                    const oppositeArr = oppositeType === 'pro' ? activeDec.pros : activeDec.cons;
                    const oppositeCount = oppositeArr.filter(item => getItemText(item).trim() !== '').length;
                    if (oppositeHeaderEl) oppositeHeaderEl.innerText = oppositeType === 'pro' ? `Advantages (${oppositeCount})` : `Disadvantages (${oppositeCount})`;
                    
                    if (type === 'pro') {
                        if (tabAdvantagesBtn) tabAdvantagesBtn.innerText = `Advantages (${thisCount})`;
                        if (tabDisadvantagesBtn) tabDisadvantagesBtn.innerText = `Disadvantages (${oppositeCount})`;
                    } else {
                        if (tabAdvantagesBtn) tabAdvantagesBtn.innerText = `Advantages (${oppositeCount})`;
                        if (tabDisadvantagesBtn) tabDisadvantagesBtn.innerText = `Disadvantages (${thisCount})`;
                    }
                }
            }
        });
        
        textarea.addEventListener('keydown', (e) => {
            const listContainer = type === 'pro' ? advantagesList : disadvantagesList;
            
            if ((e.key === 'Enter' || e.keyCode === 13) && !e.shiftKey) {
                e.preventDefault();
                const activeDec = getActiveDecision();
                if (activeDec) {
                    const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
                    const currentText = e.target.value;
                    const caretPos = e.target.selectionStart;
                    
                    const textBefore = currentText.substring(0, caretPos);
                    const textAfter = currentText.substring(caretPos);
                    
                    setItemText(arr, index, textBefore);
                    arr.splice(index + 1, 0, { text: textAfter, weight: 1 });
                    
                    saveStateToStorage();
                    renderList(type);
                    renderFooter();
                    
                    setTimeout(() => {
                        const newInputs = Array.from(listContainer.querySelectorAll('.item-input'));
                        if (newInputs[index + 1]) {
                            newInputs[index + 1].focus();
                            newInputs[index + 1].setSelectionRange(0, 0);
                        }
                    }, 0);
                }
            }
            
            if (e.key === 'Backspace') {
                const activeDec = getActiveDecision();
                if (activeDec) {
                    const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
                    
                    if (e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
                        if (index > 0) {
                            e.preventDefault();
                            const curVal = e.target.value;
                            const prevValText = getItemText(arr[index - 1]);
                            setItemText(arr, index - 1, prevValText + curVal);
                            arr.splice(index, 1);
                            saveStateToStorage();
                            
                            renderList(type);
                            renderFooter();
                            
                            setTimeout(() => {
                                const newInputs = Array.from(listContainer.querySelectorAll('.item-input'));
                                if (newInputs[index - 1]) {
                                    newInputs[index - 1].focus();
                                    newInputs[index - 1].setSelectionRange(prevValText.length, prevValText.length);
                                }
                            }, 0);
                        } else if (index === 0 && arr.length > 1 && e.target.value === '') {
                            e.preventDefault();
                            arr.splice(0, 1);
                            saveStateToStorage();
                            renderList(type);
                            renderFooter();
                            setTimeout(() => {
                                const newInputs = Array.from(listContainer.querySelectorAll('.item-input'));
                                if (newInputs[0]) newInputs[0].focus();
                            }, 0);
                        } else if (index === 0 && e.target.value === '') {
                            e.preventDefault();
                            topicInput.focus();
                        }
                    }
                }
            }
            
            if (e.key === 'Delete') {
                const activeDec = getActiveDecision();
                if (activeDec) {
                    const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
                    const val = e.target.value;
                    if (e.target.selectionStart === val.length && e.target.selectionEnd === val.length) {
                        if (index < arr.length - 1) {
                            e.preventDefault();
                            const nextValText = getItemText(arr[index + 1]);
                            setItemText(arr, index, val + nextValText);
                            arr.splice(index + 1, 1);
                            saveStateToStorage();
                            
                            renderList(type);
                            renderFooter();
                            
                            setTimeout(() => {
                                const newInputs = Array.from(listContainer.querySelectorAll('.item-input'));
                                if (newInputs[index]) {
                                    newInputs[index].focus();
                                    newInputs[index].setSelectionRange(val.length, val.length);
                                }
                            }, 0);
                        }
                    }
                }
            }
            
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                const activeDec = getActiveDecision();
                if (activeDec) {
                    const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
                    const swapIndex = e.key === 'ArrowUp' ? index - 1 : index + 1;
                    if (swapIndex >= 0 && swapIndex < arr.length) {
                        const temp = arr[index];
                        arr[index] = arr[swapIndex];
                        arr[swapIndex] = temp;
                        saveStateToStorage();
                        
                        renderList(type);
                        renderFooter();
                        
                        setTimeout(() => {
                            const newInputs = Array.from(listContainer.querySelectorAll('.item-input'));
                            if (newInputs[swapIndex]) {
                                newInputs[swapIndex].focus();
                            }
                        }, 0);
                    }
                }
            }
            
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
                e.preventDefault();
                const activeDec = getActiveDecision();
                if (activeDec) {
                    const arr = type === 'pro' ? activeDec.pros : activeDec.cons;
                    const curWeight = getItemWeight(arr[index]);
                    arr.splice(index + 1, 0, { text: e.target.value, weight: curWeight });
                    saveStateToStorage();
                    
                    renderList(type);
                    renderFooter();
                    
                    setTimeout(() => {
                        const newInputs = Array.from(listContainer.querySelectorAll('.item-input'));
                        if (newInputs[index + 1]) {
                            newInputs[index + 1].focus();
                        }
                    }, 0);
                }
            }
            
            if (e.key === 'ArrowUp') {
                const newInputs = Array.from(listContainer.querySelectorAll('.item-input'));
                if (index > 0 && newInputs[index - 1]) {
                    e.preventDefault();
                    const caretPos = e.target.selectionStart;
                    newInputs[index - 1].focus();
                    const targetLen = newInputs[index - 1].value.length;
                    const targetPos = Math.min(caretPos, targetLen);
                    newInputs[index - 1].setSelectionRange(targetPos, targetPos);
                } else if (index === 0) {
                    e.preventDefault();
                    topicInput.focus();
                }
            }
            
            if (e.key === 'ArrowDown') {
                const newInputs = Array.from(listContainer.querySelectorAll('.item-input'));
                if (index < newInputs.length - 1 && newInputs[index + 1]) {
                    e.preventDefault();
                    const caretPos = e.target.selectionStart;
                    newInputs[index + 1].focus();
                    const targetLen = newInputs[index + 1].value.length;
                    const targetPos = Math.min(caretPos, targetLen);
                    newInputs[index + 1].setSelectionRange(targetPos, targetPos);
                }
            }
            
            if (e.key === 'Escape') {
                e.target.blur();
            }
            
            if (e.ctrlKey && e.code === 'KeyA') {
                e.stopPropagation();
            }
            
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const targetList = type === 'pro' ? disadvantagesList : advantagesList;
                if (targetList) {
                    const oppositeInputs = Array.from(targetList.querySelectorAll('.item-input'));
                    const targetInput = oppositeInputs[index] || oppositeInputs[oppositeInputs.length - 1];
                    if (targetInput) targetInput.focus();
                }
                return;
            }
            
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                const targetList = type === 'con' ? advantagesList : disadvantagesList;
                if (targetList) {
                    const oppositeInputs = Array.from(targetList.querySelectorAll('.item-input'));
                    const targetInput = oppositeInputs[index] || oppositeInputs[0];
                    if (targetInput) targetInput.focus();
                }
                return;
            }
        });
        
        li.appendChild(numberSpan);
        li.appendChild(textarea);
        
        if (state.settings && state.settings.showPrudential) {
            const neutBtn = document.createElement('button');
            neutBtn.className = `neutralize-btn ${item.cancelled ? 'active' : ''}`;
            neutBtn.title = item.cancelled ? 'Neutralized point (tap to restore)' : 'Neutralize point';
            neutBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
            `;
            neutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                item.cancelled = !item.cancelled;
                saveStateToStorage();
                renderList(type);
                updateNetBalanceScore();
            });
            li.appendChild(neutBtn);
        }

        if (state.settings && state.settings.showHorizons) {
            const hzBtn = document.createElement('button');
            const hzPosition = item.horizon || 'none';
            hzBtn.className = `horizon-tag-btn ${hzPosition !== 'none' ? hzPosition : ''}`;
            hzBtn.title = 'Cycle timeframe (None / Short-term / Long-term)';
            hzBtn.innerText = hzPosition === 'short' ? 'ST' : (hzPosition === 'long' ? 'LT' : '--');
            hzBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (hzPosition === 'none') {
                    item.horizon = 'short';
                } else if (hzPosition === 'short') {
                    item.horizon = 'long';
                } else {
                    item.horizon = 'none';
                }
                saveStateToStorage();
                renderList(type);
                updateNetBalanceScore();
            });
            li.appendChild(hzBtn);
        }

        if (state.settings && state.settings.showProbability) {
            const probVal = typeof item.probability !== 'undefined' ? item.probability : 100;
            
            const probContainer = document.createElement('div');
            probContainer.className = 'prob-container';
            
            const probBadge = document.createElement('div');
            probBadge.className = 'prob-badge';
            probBadge.innerText = `${probVal}%`;
            
            const probPopup = document.createElement('div');
            probPopup.className = 'prob-slider-popup hidden';
            
            const probLabel = document.createElement('span');
            probLabel.style.fontSize = '0.72rem';
            probLabel.innerText = `Certainty: ${probVal}%`;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.step = '5';
            slider.className = 'prob-range-input';
            slider.value = probVal;
            
            slider.addEventListener('input', (e) => {
                const val = e.target.value;
                probLabel.innerText = `Certainty: ${val}%`;
                probBadge.innerText = `${val}%`;
                item.probability = parseInt(val);
                debouncedSaveStateToStorage();
                updateNetBalanceScore();
            });
            
            probBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                
                document.querySelectorAll('.prob-slider-popup').forEach(pop => {
                    if (pop !== probPopup) pop.classList.add('hidden');
                });
                
                probPopup.classList.toggle('hidden');
            });
            
            document.addEventListener('click', (e) => {
                if (probPopup && !probPopup.contains(e.target) && e.target !== probBadge) {
                    probPopup.classList.add('hidden');
                }
            });
            
            probPopup.appendChild(probLabel);
            probPopup.appendChild(slider);
            probContainer.appendChild(probBadge);
            probContainer.appendChild(probPopup);
            li.appendChild(probContainer);
        }
        
        listContainer.appendChild(li);
        autoGrowTextarea(textarea);
    });

    const activeDec = getActiveDecision();
    if (activeDec) {
        const count = list.filter(item => getItemText(item).trim() !== '').length;
        const headerEl = type === 'pro' ? document.getElementById('advantagesHeader') : document.getElementById('disadvantagesHeader');
        if (headerEl) {
            headerEl.innerText = count > 0 ? `${type === 'pro' ? 'Advantages' : 'Disadvantages'} (${count})` : (type === 'pro' ? 'Advantages' : 'Disadvantages');
        }
        if (type === 'pro') {
            if (tabAdvantagesBtn) tabAdvantagesBtn.innerText = `Advantages (${count})`;
        } else {
            if (tabDisadvantagesBtn) tabDisadvantagesBtn.innerText = `Disadvantages (${count})`;
        }
    }
}

// Render areas dropdown list
function renderDrawer() {
    areasList.innerHTML = '';
    const query = (window.drawerSearchQuery || '').trim().toLowerCase();
    
    if (!window.expandedCategories) {
        window.expandedCategories = {};
    }
    
    state.categories.forEach((cat, index) => {
        if (cat.name === 'Drafts') return;
        
        const filteredDecisions = cat.decisions.filter(dec => {
            if (!query) return true;
            return dec.topic.toLowerCase().includes(query);
        });
        
        if (query && filteredDecisions.length === 0) return;
        
        const li = document.createElement('li');
        const isCatActive = state.activeCategoryName === cat.name;
        const isExpanded = !!window.expandedCategories[cat.name];
        li.className = `area-group-item ${isCatActive ? 'active-category' : ''} ${isExpanded ? 'expanded' : ''}`;
        li.style.animationDelay = `${index * 0.05}s`;
        
        const areaRow = document.createElement('div');
        areaRow.className = 'area-item-row';
        
        areaRow.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasExpanded = !!window.expandedCategories[cat.name];
            window.expandedCategories = {};
            if (!wasExpanded) {
                window.expandedCategories[cat.name] = true;
            }
            renderDrawer();
        });
        
        const areaNameSpan = document.createElement('span');
        areaNameSpan.className = 'area-name';
        areaNameSpan.innerText = cat.name;
        
        areaNameSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            
            const renameInput = document.createElement('input');
            renameInput.type = 'text';
            renameInput.className = 'rename-area-input';
            renameInput.value = cat.name;
            
            renameInput.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') {
                    ev.stopPropagation();
                    const newName = renameInput.value.trim();
                    if (newName && newName !== cat.name) {
                        renameCategoryArea(cat.name, newName);
                    } else {
                        renderDrawer();
                    }
                } else if (ev.key === 'Escape') {
                    ev.stopPropagation();
                    renderDrawer();
                }
            });
            
            renameInput.addEventListener('blur', () => {
                const newName = renameInput.value.trim();
                if (newName && newName !== cat.name) {
                    renameCategoryArea(cat.name, newName);
                } else {
                    renderDrawer();
                }
            });
            
            areaRow.replaceChild(renameInput, areaNameSpan);
            renameInput.focus();
            renameInput.select();
        });
        
        areaRow.appendChild(areaNameSpan);
        
        const delAreaBtn = document.createElement('button');
        delAreaBtn.className = 'delete-area-btn';
        delAreaBtn.title = `Delete Area "${cat.name}"`;
        delAreaBtn.innerHTML = trashSvg;
        delAreaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategoryArea(cat.name, e);
        });
        areaRow.appendChild(delAreaBtn);
        li.appendChild(areaRow);
        
        const subMenuUl = document.createElement('ul');
        subMenuUl.className = 'sub-menu';
        filteredDecisions.forEach((dec, decIndex) => {
            const decLi = document.createElement('li');
            const isActive = state.activeCategoryName === cat.name && state.activeDecisionId === dec.id;
            const isLocked = !!dec.passwordHash;
            decLi.className = `decision-item ${isActive ? 'active' : ''} ${isLocked ? 'locked-dec-item' : ''}`;
            decLi.style.animationDelay = `${(decIndex + 1) * 0.04}s`;
            
            const decSpan = document.createElement('span');
            decSpan.className = 'decision-item-text';
            decSpan.innerText = dec.topic.trim() || '';
            decLi.addEventListener('click', () => selectDecision(cat.name, dec.id));
            
            const lockBtnIndicator = document.createElement('button');
            lockBtnIndicator.className = 'area-lock-icon';
            lockBtnIndicator.title = isLocked ? 'Locked Decision' : 'Click to lock';
            lockBtnIndicator.innerHTML = isLocked ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" fill="none"></path>
                </svg>
            ` : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            `;
            
            lockBtnIndicator.addEventListener('click', (e) => {
                e.stopPropagation();
                selectDecision(cat.name, dec.id);
                setTimeout(() => {
                    handleLockBtnClick();
                }, 100);
            });
            
            const delDecBtn = document.createElement('button');
            delDecBtn.className = 'delete-decision-btn';
            delDecBtn.title = `Delete Decision "${dec.topic.trim() || 'Untitled'}"`;
            delDecBtn.innerHTML = trashSvg;
            delDecBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteDecision(cat.name, dec.id, e);
            });
            
            decLi.appendChild(decSpan);
            decLi.appendChild(lockBtnIndicator);
            decLi.appendChild(delDecBtn);
            subMenuUl.appendChild(decLi);
        });
        
        const addDecLink = document.createElement('button');
        addDecLink.className = 'add-decision-link';
        addDecLink.innerText = '+ New Decision';
        addDecLink.style.animationDelay = `${(filteredDecisions.length + 1) * 0.04}s`;
        addDecLink.addEventListener('click', (e) => {
            e.stopPropagation();
            addDecisionToArea(cat.name);
        });
        subMenuUl.appendChild(addDecLink);
        
        li.appendChild(subMenuUl);
        areasList.appendChild(li);
    });

    const addAreaLi = document.createElement('li');
    addAreaLi.className = 'add-area-item';
    addAreaLi.style.animationDelay = `${state.categories.length * 0.05}s`;
    
    const addAreaBtnLink = document.createElement('button');
    addAreaBtnLink.className = 'add-area-link';
    addAreaBtnLink.innerText = '+ Add Area';
    
    const inlineInput = document.createElement('input');
    inlineInput.type = 'text';
    inlineInput.className = 'new-area-input hidden';
    inlineInput.placeholder = 'Type & press Enter';
    
    addAreaBtnLink.addEventListener('click', (e) => {
        e.stopPropagation();
        addAreaBtnLink.classList.add('hidden');
        inlineInput.classList.remove('hidden');
        inlineInput.focus();
    });
    
    inlineInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            handleAddArea(inlineInput);
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            inlineInput.classList.add('hidden');
            addAreaBtnLink.classList.remove('hidden');
            inlineInput.value = '';
        }
    });

    inlineInput.addEventListener('blur', () => {
        setTimeout(() => {
            const val = inlineInput.value.trim();
            if (val) {
                handleAddArea(inlineInput);
            } else {
                inlineInput.classList.add('hidden');
                addAreaBtnLink.classList.remove('hidden');
                inlineInput.value = '';
            }
        }, 150);
    });
    
    addAreaLi.appendChild(addAreaBtnLink);
    addAreaLi.appendChild(inlineInput);
    areasList.appendChild(addAreaLi);
}

// Export state JSON download
function exportStateToJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "decision_helper_state.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("State JSON exported successfully!");
}

// Import state JSON parsing and saving
function handleImportJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState && Array.isArray(importedState.categories)) {
                state = importedState;
                ensureStateStructure();
                await saveStateToStorage();
                renderApp();
                renderDrawer();
                renderFooter();
                showToast("State JSON imported successfully!");
            } else {
                alert("Invalid decision state format!");
            }
        } catch (err) {
            console.error(err);
            alert("Error parsing imported JSON file!");
        }
    };
    reader.readAsText(file);
}

// Dynamically align floating chat button bottom coordinate to prevent footer actions overlapping
function adjustFloatingChatBtnPosition() {
    const chatBtn = document.getElementById('floatingChatBtn');
    const footer = document.querySelector('.footer-actions');
    if (!chatBtn || !footer) return;
    
    const footerRect = footer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const isFooterHidden = footer.classList.contains('footer-hidden');
    
    if (footerRect.top < viewportHeight && !isFooterHidden) {
        const overlap = viewportHeight - footerRect.top;
        const defaultBottom = window.innerWidth <= 600 ? 16 : 24;
        chatBtn.style.bottom = `${defaultBottom + overlap}px`;
    } else {
        const defaultBottom = window.innerWidth <= 600 ? 16 : 24;
        chatBtn.style.bottom = `${defaultBottom}px`;
    }
}

// Toggle Share Actions Dropdown Menu
function toggleShareDropdown(btnElement) {
    const dec = getActiveDecision();
    if (dec) {
        const activeCat = state.categories.find(c => c.name === state.activeCategoryName);
        const isLocked = (!window.unlockedVaultSession && activeCat && activeCat.isLocked) || 
                         (!window.unlockedVaultSession && dec.passwordHash && !window.unlockedDecisions[dec.id]);
        if (isLocked) {
            showToast("Decision is locked. Unlock to export or share.");
            return;
        }
    }
    
    let dropdown = document.getElementById('footerShareDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'footerShareDropdown';
        dropdown.className = 'footer-share-dropdown hidden';
        
        // Export backup
        const exportOpt = document.createElement('button');
        exportOpt.className = 'share-dropdown-opt';
        exportOpt.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <span>Export Backup</span>
        `;
        exportOpt.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.add('hidden');
            exportStateToJSON();
        });
        
        // Import backup
        const importOpt = document.createElement('button');
        importOpt.className = 'share-dropdown-opt';
        importOpt.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Import Backup</span>
        `;
        importOpt.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.add('hidden');
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.addEventListener('change', handleImportJSON);
            fileInput.click();
        });
        
        dropdown.appendChild(exportOpt);
        dropdown.appendChild(importOpt);
        document.body.appendChild(dropdown);
    }
    
    const isHidden = dropdown.classList.contains('hidden');
    
    // Close other dropdowns
    const allDropdowns = document.querySelectorAll('.footer-share-dropdown, .save-bubble-dropdown, .settings-dropdown, .menu-dropdown');
    allDropdowns.forEach(d => {
        if (d !== dropdown) d.classList.add('hidden');
    });
    
    if (isHidden) {
        const rect = btnElement.getBoundingClientRect();
        dropdown.style.left = `${rect.left + window.scrollX - 57}px`;
        dropdown.style.top = `${rect.top + window.scrollY - 90}px`;
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

// Render dynamic Footer actions
function renderFooter() {
    const dec = getActiveDecision();
    if (!dec) return;
    
    footerActions.innerHTML = '';
    
    const activeCat = state.categories.find(c => c.name === state.activeCategoryName);
    const isLocked = (!window.unlockedVaultSession && activeCat && activeCat.isLocked) || 
                     (!window.unlockedVaultSession && dec.passwordHash && !window.unlockedDecisions[dec.id]);
    
    // While decision is locked, suppress all toolbar actions (Copy, Clear, Share) to prevent unauthenticated data exfiltration
    if (isLocked) {
        return;
    }
    
    // 1. Clear button (Trash)
    const clearBtn = document.createElement('button');
    clearBtn.className = 'footer-icon-btn';
    clearBtn.id = 'clearAllBtn';
    clearBtn.title = 'Clear Text';
    clearBtn.setAttribute('aria-label', 'Clear Text');
    clearBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
    clearBtn.addEventListener('click', handleClearAll);
    footerActions.appendChild(clearBtn);
    
    // 2. Copy Button (Clipboard)
    const copyBtn = document.createElement('button');
    copyBtn.className = 'footer-icon-btn';
    copyBtn.id = 'copyMarkdownBtn';
    copyBtn.title = 'Copy Active Decision as Markdown';
    copyBtn.setAttribute('aria-label', 'Copy Active Decision as Markdown');
    copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    copyBtn.addEventListener('click', copyToClipboard);
    footerActions.appendChild(copyBtn);
    
    // 3. Lock Button (Padlock - dynamic for Active decisions other than Drafts)
    if (state.activeCategoryName !== 'Drafts') {
        const lockBtn = document.createElement('button');
        lockBtn.className = 'footer-icon-btn';
        lockBtn.id = 'lockDecisionBtn';
        const isDecLocked = dec.passwordHash;
        lockBtn.title = isDecLocked ? 'Unlock / Remove Password' : 'Lock Decision';
        lockBtn.setAttribute('aria-label', isDecLocked ? 'Unlock / Remove Password' : 'Lock Decision');
        if (isDecLocked) {
            // Protected state with password (shows open lock icon to remove lock)
            lockBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
        } else {
            // Unlocked state (shows closed lock icon to set lock)
            lockBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
        }
        lockBtn.addEventListener('click', handleLockBtnClick);
        footerActions.appendChild(lockBtn);
    }
    
    // 4. Share/Data Actions Button (toggles Export/Import backup dropdown)
    const shareBtn = document.createElement('button');
    shareBtn.className = 'footer-icon-btn';
    shareBtn.id = 'footerShareBtn';
    shareBtn.title = 'Share & Data Actions';
    shareBtn.setAttribute('aria-label', 'Share & Data Actions');
    shareBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`;
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShareDropdown(shareBtn);
    });
    footerActions.appendChild(shareBtn);
    
    renderSaveBubble();
    adjustFloatingChatBtnPosition();
}

// Render the Save Thought Bubble dynamically
function renderSaveBubble() {
    const dec = getActiveDecision();
    if (!dec) {
        saveBubble.classList.add('hidden');
        return;
    }
    
    const hasText = (dec.topic || '').trim() !== '' || 
                    dec.pros.some(p => getItemText(p).trim() !== '') || 
                    dec.cons.some(c => getItemText(c).trim() !== '');
                    
    const shouldShow = state.activeCategoryName === 'Drafts' && hasText;
    
    if (shouldShow) {
        saveBubble.classList.remove('hidden');
    } else {
        saveBubble.classList.add('hidden');
        saveBubbleDropdown.classList.add('hidden');
    }
}

// Render target Areas inside the Save Thought Bubble dropdown
function renderBubbleTargets() {
    saveBubbleDropdown.innerHTML = '';
    
    const targetCats = state.categories.filter(c => c.name !== 'Drafts');
    
    targetCats.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'bubble-target-btn';
        btn.innerText = cat.name;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveActiveDecisionTo(cat.name);
        });
        saveBubbleDropdown.appendChild(btn);
    });
    
    const newAreaBtn = document.createElement('button');
    newAreaBtn.className = 'bubble-target-btn';
    newAreaBtn.innerText = '+ New Area';
    
    const inlineInput = document.createElement('input');
    inlineInput.type = 'text';
    inlineInput.className = 'bubble-new-area-input hidden';
    inlineInput.placeholder = 'Type & press Enter';
    
    newAreaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        newAreaBtn.classList.add('hidden');
        inlineInput.classList.remove('hidden');
        inlineInput.focus();
    });
    
    inlineInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            const val = inlineInput.value.trim();
            if (val) {
                const exists = state.categories.some(c => c.name.toLowerCase() === val.toLowerCase());
                if (exists) {
                    alert('This area already exists!');
                    return;
                }
                
                state.categories.push({
                    name: val,
                    decisions: []
                });
                moveActiveDecisionTo(val);
            }
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            inlineInput.classList.add('hidden');
            newAreaBtn.classList.remove('hidden');
            inlineInput.value = '';
        }
    });
    
    inlineInput.addEventListener('blur', () => {
        setTimeout(() => {
            inlineInput.classList.add('hidden');
            newAreaBtn.classList.remove('hidden');
            inlineInput.value = '';
        }, 150);
    });
    
    saveBubbleDropdown.appendChild(newAreaBtn);
    saveBubbleDropdown.appendChild(inlineInput);
}

// Move active decision to chosen category
function moveActiveDecisionTo(targetCategoryName) {
    const activeDec = getActiveDecision();
    if (!activeDec) return;
    
    const targetCat = state.categories.find(c => c.name === targetCategoryName);
    const draftCat = state.categories.find(c => c.name === 'Drafts');
    if (!targetCat || !draftCat) return;
    
    targetCat.decisions.push(activeDec);
    draftCat.decisions = draftCat.decisions.filter(d => d.id !== activeDec.id);
    
    if (draftCat.decisions.length === 0) {
        draftCat.decisions.push({
            id: 'dec_draft_' + Date.now(),
            topic: '',
            pros: [''],
            cons: ['']
        });
    }
    
    state.activeCategoryName = targetCategoryName;
    state.activeDecisionId = activeDec.id;
    
    saveStateToStorage();
    renderApp();
    renderDrawer();
    
    saveBubble.classList.add('hidden');
    saveBubbleDropdown.classList.add('hidden');
    
    renderFooter();
    showToast(`Decision saved to ${targetCategoryName}!`);
}

// Adjust Topic Input font-size and auto-grow height
function adjustTopicFontSizeAndHeight() {
    const text = topicInput.value;
    const len = text.length;
    
    // Stable, prominent editorial sizing without shrinking to tiny mouse font
    let fontSize = len > 80 ? 1.6 : len > 40 ? 1.85 : 2.1;
    
    topicInput.style.fontSize = `${fontSize}rem`;
    topicInput.style.height = 'auto';
    topicInput.style.height = (topicInput.scrollHeight) + 'px';
}

// Helper: Auto-grow textarea
function autoGrowTextarea(element) {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = Math.max(element.scrollHeight, 24) + 'px';
}

// Helper: Auto-grow all textareas
function growAllTextareas() {
    setTimeout(() => {
        const inputs = document.querySelectorAll('.item-input');
        inputs.forEach(input => {
            autoGrowTextarea(input);
        });
        adjustTopicFontSizeAndHeight();
    }, 20);
}

// Toast Display
function showToast(message) {
    toast.innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

// Action: Generate Markdown and Copy to Clipboard
function copyToClipboard() {
    const dec = getActiveDecision();
    if (!dec) return;
    
    const activeCat = state.categories.find(c => c.name === state.activeCategoryName);
    const isLocked = (!window.unlockedVaultSession && activeCat && activeCat.isLocked) || 
                     (!window.unlockedVaultSession && dec.passwordHash && !window.unlockedDecisions[dec.id]);
    if (isLocked) {
        showToast("Decision is locked. Unlock to copy.");
        return;
    }
    
    const topic = dec.topic.trim() || 'Pros and Cons Analysis';
    let md = `# Decision: ${topic} (${state.activeCategoryName})\n\n`;
    
    md += `## Advantages\n`;
    const activePros = dec.pros.filter(p => getItemText(p).trim() !== '');
    if (activePros.length > 0) {
        activePros.forEach((pro, index) => {
            const txt = getItemText(pro);
            const wt = getItemWeight(pro);
            const prefix = wt > 1 ? `[${wt}x] ` : '';
            md += `${index + 1}. ${prefix}${txt}\n`;
        });
    } else {
        md += `*None listed*\n`;
    }
    
    md += `\n`;
    
    md += `## Disadvantages\n`;
    const activeCons = dec.cons.filter(c => getItemText(c).trim() !== '');
    if (activeCons.length > 0) {
        activeCons.forEach((con, index) => {
            const txt = getItemText(con);
            const wt = getItemWeight(con);
            const prefix = wt > 1 ? `[${wt}x] ` : '';
            md += `${index + 1}. ${prefix}${txt}\n`;
        });
    } else {
        md += `*None listed*\n`;
    }
    navigator.clipboard.writeText(md).then(() => {
        showToast('Markdown copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Error copying to clipboard');
    });
}
