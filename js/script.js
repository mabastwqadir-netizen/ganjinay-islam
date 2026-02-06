// PWA Install Logic - Move outside DOMContentLoaded to catch early events
let deferredPrompt;

// Helper to check if we are on the homepage
const isHomePage = () => {
    const path = window.location.pathname;
    const subfolders = ['aqidah', 'biography', 'companions', 'dhikr', 'faq', 'hadiths', 'islam-what', 'library-media', 'prayer', 'quran', 'tawheed', 'video'];
    const isSubpage = subfolders.some(folder => path.includes(`/${folder}/`));
    return !isSubpage;
};

// Function to show the custom install toast
const showInstallToast = () => {
    if (!deferredPrompt) return;
    if (!isHomePage()) return;
    
    // Check if toast already exists
    if (document.getElementById('pwa-install-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'pwa-install-toast';
    toast.className = 'pwa-install-toast';
    toast.innerHTML = `
        <div class="pwa-toast-content">
            <img src="/assets/icons/Icon192.png" alt="App Icon" style="width: 50px; height: 50px; margin-bottom: 5px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); background-color: #ffffff;">
            <h3>ئەپەکە دابەزێنە</h3>
            <p>بۆ بەکارهێنانی بەبێ ئینتەرنێت و ئەزموونێکی باشتر و خێراتر</p>
        </div>
        <div class="pwa-toast-buttons">
            <button id="pwa-dismiss-btn" class="pwa-btn-dismiss">لابردن</button>
            <button id="pwa-accept-btn" class="pwa-btn-install">دامەزراندن</button>
        </div>
    `;
    document.body.appendChild(toast);

    // Trigger reflow and show
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Handle Dismiss
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    });

    // Handle Install
    document.getElementById('pwa-accept-btn').addEventListener('click', async () => {
        toast.classList.remove('show');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
        }
        setTimeout(() => toast.remove(), 500);
    });
};

// New helper function to detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// New function to show iOS-specific instructions
const showIOSInstallInstructions = () => {
    if (!isHomePage()) return;
    // Check if toast already exists or if it was dismissed
    if (document.getElementById('pwa-install-toast') || localStorage.getItem('iosInstallDismissed') === 'true') return;

    const toast = document.createElement('div');
    toast.id = 'pwa-install-toast';
    toast.className = 'pwa-install-toast';
    toast.innerHTML = `
        <div class="pwa-toast-content">
            <img src="/assets/icons/Icon192.png" alt="App Icon" style="width: 50px; height: 50px; margin-bottom: 5px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); background-color: #ffffff;">
            <h3>ئەپەکە دابەزێنە</h3>
            <p>بۆ دامەزراندنی ئەپەکە، کرتە لە دوگمەی Share <i class="fas fa-share-alt" style="font-size: 1.1em; vertical-align: middle;"></i> بکە، پاشان 'Add to Home Screen' <i class="fas fa-plus-square" style="font-size: 1.1em; vertical-align: middle;"></i> هەڵبژێرە.</p>
        </div>
        <div class="pwa-toast-buttons">
            <button id="pwa-dismiss-btn" class="pwa-btn-dismiss">باشە، تێگەیشتم</button>
        </div>
    `;
    document.body.appendChild(toast);

    // Trigger reflow and show
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Handle Dismiss
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        toast.classList.remove('show');
        // Save dismissal so it doesn't show again
        localStorage.setItem('iosInstallDismissed', 'true');
        setTimeout(() => toast.remove(), 500);
    });
};


window.addEventListener('beforeinstallprompt', (e) => {
    // Don't show prompt on iOS, it's not supported
    if (isIOS()) return;

    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;

    // Show toast if body exists, otherwise wait for load
    if (document.body) {
        showInstallToast();
    } else {
        window.addEventListener('load', showInstallToast);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('sidebarToggle');
    const body = document.body;

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent immediate closing
            body.classList.toggle('sidebar-open');
            localStorage.setItem('sidebarOpen', body.classList.contains('sidebar-open'));
        });
    }

    // Close sidebar when clicking outside (Mobile/Tablet)
    document.addEventListener('click', (e) => {
        if (body.classList.contains('sidebar-open') && 
            !e.target.closest('nav') && 
            !e.target.closest('#sidebarToggle')) {
            body.classList.remove('sidebar-open');
            localStorage.setItem('sidebarOpen', 'false');
        }
    });

    // Close sidebar when a nav link is clicked (Mobile/Tablet)
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1200) {
                body.classList.remove('sidebar-open');
                localStorage.setItem('sidebarOpen', 'false');
            }
        });
    });

    // Initialize active tab from URL hash (optional)
    const hash = window.location.hash;
    if (hash) {
        const tabBtn = document.querySelector(`.tab-button[onclick*="${hash.replace('#', '')}"]`);
        if (tabBtn) {
            tabBtn.click();
        }
    }

    // ==========================================
    // PWA Install Logic (زیادکراو)
    // ==========================================
    
    // PWA Install Logic for iOS
    // Show instructions after a small delay to not be too intrusive
    if (isIOS() && !window.matchMedia('(display-mode: standalone)').matches) {
        setTimeout(showIOSInstallInstructions, 3000); // Show after 3 seconds
    }

    window.addEventListener('appinstalled', () => {
        const toast = document.getElementById('pwa-install-toast');
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }
        deferredPrompt = null;
    });
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        const toast = document.getElementById('pwa-install-toast');
        if (toast) toast.style.display = 'none';
    }

    // ==========================================
    // FAQ Read More Logic (زیادکراو بۆ وەڵامە درێژەکان)
    // ==========================================
    function processFaqReadMore(element) {
        if (element.dataset.processed) return;
        element.dataset.processed = 'true';

        // Check height after a short delay to ensure rendering
        setTimeout(() => {
            // If height is greater than ~100px (approx 4-5 lines)
            if (element.scrollHeight > 100) {
                element.classList.add('collapsed');
                
                const btn = document.createElement('button');
                btn.className = 'faq-see-more-btn';
                btn.innerHTML = '<i class="fas fa-chevron-down"></i> زیاتر ببینە';
                
                btn.onclick = () => {
                    const isCollapsed = element.classList.toggle('collapsed');
                    btn.innerHTML = isCollapsed ? 
                        '<i class="fas fa-chevron-down"></i> زیاتر ببینە' : 
                        '<i class="fas fa-chevron-up"></i> کەمتر ببینە';
                };
                
                element.parentNode.insertBefore(btn, element.nextSibling);
            }
        }, 100);
    }

    // 1. Process existing elements
    document.querySelectorAll('.answer-text').forEach(processFaqReadMore);

    // 2. Observe for new elements (Dynamic content)
    const faqObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.classList && node.classList.contains('answer-text')) {
                        processFaqReadMore(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('.answer-text').forEach(processFaqReadMore);
                    }
                }
            });
        });
    });

    faqObserver.observe(document.body, { childList: true, subtree: true });

    // ==========================================
    // Zikr Translation Toggle Logic (Mobile)
    // ==========================================
    function setupZikrCards() {
        // Function to add button to a card (Handles both Dhikr and Zikr styles)
        const addToggleButton = (card) => {
            // Find translation element (could be .dhikr-kurdish or .zikr-translation)
            const translation = card.querySelector('.dhikr-kurdish') || card.querySelector('.zikr-translation');
            
            // If no translation or button already exists, skip
            if (!translation || card.querySelector('.toggle-translation-btn')) return;

            const btn = document.createElement('button');
            btn.className = 'toggle-translation-btn';
            btn.innerHTML = '<i class="fas fa-chevron-down"></i> بینینی کوردی';
            
            // Try to find footer or meta section to place button inline with source
            const footer = card.querySelector('.zikr-footer') || card.querySelector('.dhikr-meta');
            
            if (footer) {
                footer.appendChild(btn);
            } else {
                // Fallback: Insert button AFTER the translation element
                translation.parentNode.insertBefore(btn, translation.nextSibling);
            }
            
            // Add click event
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const isExpanded = translation.classList.toggle('expanded');
                btn.innerHTML = isExpanded ? 
                    '<i class="fas fa-chevron-up"></i> شاردنەوەی کوردی' : 
                    '<i class="fas fa-chevron-down"></i> بینینی کوردی';
                btn.classList.toggle('expanded', isExpanded);
            });
        };

        // 1. Process existing cards on load (Targeting both class types)
        document.querySelectorAll('.dhikr-card, .zikr-card').forEach(addToggleButton);

        // 2. Use MutationObserver to process dynamically added cards
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList.contains('dhikr-card') || node.classList.contains('zikr-card')) {
                            addToggleButton(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('.dhikr-card, .zikr-card').forEach(addToggleButton);
                        }
                    }
                });
            });
        });
        
        // Observe body to catch all potential containers
        observer.observe(document.body, { childList: true, subtree: true });
    }
    setupZikrCards();

    // ==========================================
    // App Version Display (زیادکراو)
    // ==========================================
    const APP_VERSION = 'v5.9'; // دڵنیابەرەوە ئەمە لەگەڵ sw.js یەک دەگرێتەوە
    const footer = document.querySelector('footer');
    if (footer) {
        const versionEl = document.createElement('div');
        versionEl.innerHTML = `<span class="app-version"><i class="fas fa-code-branch"></i> وەشان |  ${APP_VERSION}</span>`;
        footer.appendChild(versionEl);
    }
});

// Global Tab Switcher Function (Used in Prayer page)
window.switchTab = function(tabId, btn) {
    const tabsContainer = btn.closest('.tabs');
    if (!tabsContainer) return;

    const parentContainer = tabsContainer.parentElement;

    // Update Buttons
    tabsContainer.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update Content
    parentContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) selectedContent.classList.add('active');
};

// ==========================================
// Web Share API Helper (زیادکراو)
// ==========================================
window.shareContent = async function(title, text, url) {
    // Use the book's own page URL if available, otherwise the main site URL
    const shareUrl = url || window.location.origin;
    const shareData = {
        title: title,
        text: text,
        url: shareUrl,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            console.log('Content shared successfully');
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        // Fallback for browsers that don't support Web Share API
        try {
            await navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl}`);
            alert('بڵاوکردنەوە پشتگیری نەکراوە لەم وێبگەڕە. بەڵام لینکەکە بۆت کۆپی کرا!');
        } catch (err) {
            console.error('Fallback copy to clipboard failed:', err);
            alert('بڵاوکردنەوە پشتگیری نەکراوە و کۆپی کردنیش سەرکەوتوو نەبوو.');
        }
    }
};

// ==========================================
// PWA & Caching Helpers (زیادکراو بۆ هەموو بەشەکان)
// ==========================================

// ١. تۆمارکردنی Service Worker بۆ پاشەکەوتکردنی پەڕەکان و خێراکردنی ماڵپەڕ
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered: Network First strategy active.', registration.scope);
            })
            .catch(err => {
                console.error('ServiceWorker registration failed: ', err);
            });
    });
}

// ٢. فەنکشنی گشتی بۆ هێنان و پاشەکەوتکردنی داتاکان (بۆ هەموو بەشەکان)
window.fetchAndCacheData = async function(tableName, renderCallback, supabaseClient, orderBy = 'id', ascending = true, filter = null, customContainerId = null) {
    // دیاریکردنی ئایدی کۆنتەینەر (ئەگەر دیاری نەکرابوو، ناوی خشتەکە بەکاردێت)
    const containerId = customContainerId || `${tableName}-container`;
    const container = document.getElementById(containerId);
    
    // دروستکردنی کلیلێکی تایبەت بۆ کاش (ئەگەر فیلتەر هەبوو، دەخرێتە ناو ناوەکەوە)
    const cacheKey = filter ? `${tableName}_${filter.column}_${filter.value}_data` : `${tableName}_data`;

    // هەنگاوی یەکەم: پیشاندانی داتای پاشەکەوتکراو (ئەگەر هەبێت)
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        renderCallback(JSON.parse(cachedData));
    }

    // هەنگاوی دووەم: هێنانی داتای نوێ لە ئینتەرنێتەوە
    try {
        let query = supabaseClient.from(tableName).select('*');
        
        // ئەگەر فیلتەر هەبوو، زیاد دەکرێت (بۆ نموونە section_id = 1)
        if (filter) {
            query = query.eq(filter.column, filter.value);
        }
        
        const { data, error } = await query.order(orderBy, { ascending: ascending });
        
        if (error) throw error;

        // هەنگاوی سێیەم: نوێکردنەوەی داتا و پاشەکەوتکردن
        if (data) {
            if (data.length === 0) {
                console.warn(`⚠️ ئاگاداری: خشتەی '${tableName}' هیچ داتایەکی تێدا نییە (یان RLS ڕێگری دەکات). تکایە دڵنیابەرەوە لە Supabase Dashboard سیاسەتی 'Enable read access to everyone' بۆ ئەم خشتەیە چالاک کراوە.`);
            }
            localStorage.setItem(cacheKey, JSON.stringify(data));
            renderCallback(data);
        }
    } catch (err) {
        console.error(`Error fetching ${tableName}:`, err);
        // ئەگەر کاش نەبوو و ئینتەرنێتیش نەبوو، پەیامی هەڵە پیشان بدە
        if (!cachedData && container) {
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:#ef4444;"><i class="fas fa-wifi"></i> کێشە لە پەیوەستبوون بە ئینتەرنێت هەیە.</div>';
        }
    }
};

// ==========================================
// New Item & Viewed State Helpers (لۆجیکی نوێ و بینراو)
// ==========================================
const viewedItemsKey = 'islamicTreasureViewedItems';

// فەنکشن بۆ خوێندنەوەی ئەو بابەتانەی بینراون لە localStorage
function getViewedItems() {
    try {
        const items = localStorage.getItem(viewedItemsKey);
        return items ? JSON.parse(items) : {};
    } catch (e) {
        return {};
    }
}

// فەنکشن بۆ نیشانکردنی بابەتێک وەک بینراو، بانگ دەکرێت کاتێک بەکارهێنەر کلیک دەکات
window.markItemAsViewed = function(itemId) {
    if (!itemId) return;
    const viewedItems = getViewedItems();
    viewedItems[itemId] = true;
    localStorage.setItem(viewedItemsKey, JSON.stringify(viewedItems));
};

// فەنکشنی پشکنینی نوێ: بابەتێک بە نوێ دادەنرێت ئەگەر لە ماوەی ٣ ڕۆژدا زیادکرابێت و بەکارهێنەر نەیبینیبێت
window.isNewItem = function(dateString, itemId) {
    if (!dateString || !itemId) return false;
    const viewedItems = getViewedItems();
    if (viewedItems[itemId]) return false; // User has viewed it

    const createdDate = new Date(dateString);
    const now = new Date();
    const diffTime = now - createdDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
};

// فەنکشنی نیشانەی نوێ: نیشانەکە دەگەڕێنێتەوە ئەگەر بابەتەکە نوێ بوو
window.getNewBadge = function(dateString, itemId) {
    if (window.isNewItem(dateString, itemId)) {
        return '<span class="new-badge">نوێ</span>';
    }
    return '';
};

// ==========================================
// Pagination System (زیادکراو بۆ پەڕەبەندی هەموو بەشەکان)
// ==========================================
window.initPagination = function(options) {
    const { containerId, itemsPerPage, renderItem, filterItem } = options;
    const container = document.getElementById(containerId);
    
    // State
    let state = {
        allData: [],
        filteredData: [],
        currentPage: 1
    };

    if (!container) return null;

    // Attach changePage function to container for onclick access
    container.changePage = function(page) {
        state.currentPage = page;
        render();
        
        // Scroll to top of container
        const headerOffset = 120;
        const elementPosition = container.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    };

    function render() {
        if (state.filteredData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #94a3b8; grid-column: 1/-1;">هیچ بابەتێک نەدۆزرایەوە.</p>';
            return;
        }

        const totalPages = Math.ceil(state.filteredData.length / itemsPerPage);
        
        if (state.currentPage < 1) state.currentPage = 1;
        if (state.currentPage > totalPages) state.currentPage = totalPages;

        const start = (state.currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = state.filteredData.slice(start, end);

        const itemsHTML = pageData.map((item, index) => {
            const absIndex = state.allData.indexOf(item); 
            return renderItem(item, absIndex, state.allData);
        }).join('');

        // Pagination Controls
        let paginationControls = '';
        if (totalPages > 1) {
            paginationControls = '<div class="pagination-container">';
            
            if (state.currentPage > 1) {
                paginationControls += `<button class="pagination-btn" onclick="document.getElementById('${containerId}').changePage(${state.currentPage - 1})"><i class="fas fa-chevron-right"></i></button>`;
            }

            for (let i = 1; i <= totalPages; i++) {
                if (totalPages > 7) {
                    if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                        paginationControls += `<button class="pagination-btn ${i === state.currentPage ? 'active' : ''}" onclick="document.getElementById('${containerId}').changePage(${i})">${i}</button>`;
                    } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                        paginationControls += `<span class="pagination-dots">...</span>`;
                    }
                } else {
                    paginationControls += `<button class="pagination-btn ${i === state.currentPage ? 'active' : ''}" onclick="document.getElementById('${containerId}').changePage(${i})">${i}</button>`;
                }
            }

            if (state.currentPage < totalPages) {
                paginationControls += `<button class="pagination-btn" onclick="document.getElementById('${containerId}').changePage(${state.currentPage + 1})"><i class="fas fa-chevron-left"></i></button>`;
            }

            paginationControls += '</div>';
        }

        container.innerHTML = itemsHTML + paginationControls;
    }

    return {
        init: (data) => { state.allData = data; state.filteredData = data; state.currentPage = 1; render(); },
        filter: (query) => { if (filterItem) { state.filteredData = state.allData.filter(item => filterItem(item, query)); state.currentPage = 1; render(); } }
    };
};