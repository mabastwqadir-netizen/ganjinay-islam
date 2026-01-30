// PWA Install Logic - Move outside DOMContentLoaded to catch early events
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI if element exists (or wait for DOMContentLoaded)
    const btn = document.getElementById('pwa-install-btn');
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
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    
    const handleInstall = async () => {
        console.log('Install button clicked');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
        } else {
            alert('بۆ دابەزاندنی ئەپەکە:\n١. لە ئایفۆن: دوگمەی Share دابگرە و Add to Home Screen هەڵبژێرە.\n٢. لە ئەندرۆید/کۆمپیوتەر: لە مینیۆی وێبگەڕەکە Install App هەڵبژێرە.');
        }
    };

    if (pwaInstallBtn) {
        pwaInstallBtn.addEventListener('click', handleInstall);
    }
    
    window.addEventListener('appinstalled', () => {
        if (pwaInstallBtn) pwaInstallBtn.style.display = 'none';
        deferredPrompt = null;
    });
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        if (pwaInstallBtn) pwaInstallBtn.style.display = 'none';
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
    const APP_VERSION = 'v5'; // دڵنیابەرەوە ئەمە لەگەڵ sw.js یەک دەگرێتەوە
    const footer = document.querySelector('footer');
    if (footer) {
        const versionEl = document.createElement('div');
        versionEl.innerHTML = `<span class="app-version"><i class="fas fa-code-branch"></i> وەشان: ${APP_VERSION}</span>`;
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