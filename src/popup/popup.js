/**
 * Popup Logic for SuperCleaner - Redesigned UI
 */

const UI = {
   elements: {
      // Tabs
      tabBtns: document.querySelectorAll(".tab-btn"),
      tabPanes: document.querySelectorAll(".tab-pane"),

      // Header
      totalCleaned: document.getElementById("total-cleaned"),

      // Current Site Tab
      currentDomain: document.getElementById("current-domain"),
      statusBadge: document.getElementById("status-badge"),
      cleaningToggle: document.getElementById("cleaning-toggle"),
      adblockToggle: document.getElementById("adblock-toggle"),
      btnEditMode: document.getElementById("btn-edit-mode"),
      btnEnlargeMode: document.getElementById("btn-enlarge-mode"),
      maskedCount: document.getElementById("masked-count"),
      enlargedCount: document.getElementById("enlarged-count"),
      btnRefresh: document.getElementById("btn-refresh"),
      btnReset: document.getElementById("btn-reset"),

      // All Sites Tab
      totalSitesBadge: document.getElementById("total-sites-badge"),
      searchInput: document.getElementById("search-input"),
      sitesList: document.getElementById("sites-list"),

      // Specs Tab
      overviewDomain: document.getElementById("overview-domain"),
      overviewStatus: document.getElementById("overview-status"),
      specMasked: document.getElementById("spec-masked"),
      specEnlarged: document.getElementById("spec-enlarged"),
      specRules: document.getElementById("spec-rules"),
      resetAllBtn: document.querySelector(".reset-all-btn"),
      pauseBtns: document.querySelectorAll(".pause-btn"),
      pauseCancel: document.getElementById("pause-cancel"),
      pauseTimer: document.getElementById("pause-timer"),
   },

   state: {
      currentTab: null,
      domain: "",
      isEditMode: false,
      isEnlargeMode: false,
      isSiteDisabled: false,
      sortBy: "name-asc",
      filterBy: "all",
   },

   init: async () => {
      try {
         // Get current tab
         const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
         });
         UI.state.currentTab = tab;

         if (tab && tab.url && tab.url.startsWith("http")) {
            const url = new URL(tab.url);
            UI.state.domain = url.hostname;
            UI.elements.currentDomain.textContent = UI.state.domain;
            UI.elements.overviewDomain.textContent = UI.state.domain;

            await UI.loadSiteData();
         } else {
            UI.elements.currentDomain.textContent = "Page restreinte";
            UI.elements.overviewDomain.textContent = "Page restreinte";
            UI.elements.btnEditMode.disabled = true;
            UI.elements.cleaningToggle.disabled = true;
         }

         await UI.loadGlobalStats();
         await UI.loadAllSites();
         await UI.loadEditModeState();
         await UI.loadEnlargeModeState();
         await UI.loadPresetRulesState();
         await UI.updatePauseTimer();
         UI.bindEvents();
      } catch (e) {
         Logger.error("Popup init error:", e);
      }
   },

   bindEvents: () => {
      // Tab switching
      UI.elements.tabBtns.forEach((btn) => {
         btn.addEventListener("click", () => UI.switchTab(btn.dataset.tab));
      });

      // Current Site actions
      UI.elements.btnEditMode.addEventListener("click", UI.toggleEditMode);
      UI.elements.btnEnlargeMode.addEventListener(
         "click",
         UI.toggleEnlargeMode
      );
      UI.elements.cleaningToggle.addEventListener("change", UI.toggleCleaning);
      UI.elements.adblockToggle.addEventListener("change", UI.toggleAdBlocker);
      UI.elements.btnRefresh.addEventListener("click", UI.refreshSite);
      UI.elements.btnReset.addEventListener("click", UI.resetSite);

      // Search
      UI.elements.searchInput.addEventListener("input", UI.handleSearch);

      // Preset Rules buttons
      document.querySelectorAll(".rule-btn").forEach((btn) => {
         btn.addEventListener("click", (e) => UI.handlePresetRule(e.target));
      });

      // Reset all button
      if (UI.elements.resetAllBtn) {
         UI.elements.resetAllBtn.addEventListener("click", UI.resetAllSites);
      }

      // Pause buttons
      UI.elements.pauseBtns.forEach((btn) => {
         btn.addEventListener("click", () =>
            UI.pauseCleaning(parseInt(btn.dataset.minutes))
         );
      });
      if (UI.elements.pauseCancel) {
         UI.elements.pauseCancel.addEventListener("click", UI.resumeCleaning);
      }

      // Sort and Filter buttons
      const searchBtns = document.querySelectorAll(".search-btn");
      if (searchBtns[0]) {
         searchBtns[0].addEventListener("click", UI.toggleSort);
      }
      if (searchBtns[1]) {
         searchBtns[1].addEventListener("click", UI.toggleFilter);
      }
   },

   switchTab: (tabId) => {
      // Update buttons
      UI.elements.tabBtns.forEach((btn) => {
         btn.classList.toggle("active", btn.dataset.tab === tabId);
      });

      // Update panes
      UI.elements.tabPanes.forEach((pane) => {
         pane.classList.toggle("active", pane.id === `tab-${tabId}`);
      });
   },

   loadSiteData: async () => {
      if (!UI.state.domain) return;

      try {
         // Get rules (blurred elements)
         const rules = await StorageManager.get(UI.state.domain);
         UI.elements.maskedCount.textContent = rules.length;
         UI.elements.specMasked.textContent = rules.length;
         UI.elements.specRules.textContent = rules.length;

         // Get enlarged elements
         const enlargedElements = await StorageManager.getEnlargedElements(UI.state.domain);
         if (UI.elements.enlargedCount) {
            UI.elements.enlargedCount.textContent = enlargedElements.length;
         }
         if (UI.elements.specEnlarged) {
            UI.elements.specEnlarged.textContent = enlargedElements.length;
         }

         // Get disabled status
         const disabled = await StorageManager.isSiteDisabled(UI.state.domain);
         UI.state.isSiteDisabled = disabled;
         UI.elements.cleaningToggle.checked = !disabled;

         // Update status badge
         if (disabled) {
            UI.elements.statusBadge.textContent = "Inactif";
            UI.elements.statusBadge.classList.remove("active");
         } else {
            UI.elements.statusBadge.textContent = "Actif";
            UI.elements.statusBadge.classList.add("active");
         }

         // Update overview status in specs tab
         if (UI.elements.overviewStatus) {
            if (disabled) {
               UI.elements.overviewStatus.textContent = "Nettoyage désactivé";
               UI.elements.overviewStatus.classList.add("disabled");
            } else {
               UI.elements.overviewStatus.textContent = "Nettoyage activé";
               UI.elements.overviewStatus.classList.remove("disabled");
            }
         }

         // Enable/disable preset rule buttons based on cleaning status
         const ruleButtons = document.querySelectorAll(".rule-btn");
         ruleButtons.forEach(btn => {
            btn.disabled = disabled;
            if (disabled) {
               btn.classList.add("disabled");
            } else {
               btn.classList.remove("disabled");
            }
         });

         // Get ad blocker status
         const settings = await StorageManager.getSettings();
         UI.elements.adblockToggle.checked =
            settings.adBlockerEnabled !== false;
      } catch (e) {
         Logger.error("Error loading site data:", e);
      }
   },

   loadGlobalStats: async () => {
      try {
         const stats = await StorageManager.getStats();
         const totalElements = stats.totalBlurred + stats.totalEnlarged;
         UI.elements.totalCleaned.textContent = `${totalElements} éléments nettoyés`;

         Logger.log('Global stats:', stats);
      } catch (e) {
         Logger.error("Error loading global stats:", e);
      }
   },

   loadEditModeState: async () => {
      if (!UI.state.domain) return;

      try {
         const isEditModeActive = await StorageManager.getEditModeState(
            UI.state.domain
         );
         UI.state.isEditMode = isEditModeActive;

         if (isEditModeActive) {
            UI.elements.btnEditMode.innerHTML =
               '<span class="btn-icon">❌</span> Désactiver le mode édition';
            UI.elements.btnEditMode.classList.add("active");
         } else {
            UI.elements.btnEditMode.innerHTML =
               '<span class="btn-icon">✨</span> Activer le mode édition';
            UI.elements.btnEditMode.classList.remove("active");
         }
      } catch (e) {
         Logger.error("Error loading edit mode state:", e);
      }
   },

   loadEnlargeModeState: async () => {
      if (!UI.state.domain) return;

      try {
         const isEnlargeModeActive = await StorageManager.getEnlargeModeState(
            UI.state.domain
         );
         UI.state.isEnlargeMode = isEnlargeModeActive;

         if (isEnlargeModeActive) {
            UI.elements.btnEnlargeMode.innerHTML =
               '<span class="btn-icon">❌</span> Désactiver';
            UI.elements.btnEnlargeMode.classList.add("active");
         } else {
            UI.elements.btnEnlargeMode.innerHTML =
               '<span class="btn-icon">🔍</span>Mode agrandissement';
            UI.elements.btnEnlargeMode.classList.remove("active");
         }
      } catch (e) {
         Logger.error("Error loading enlarge mode state:", e);
      }
   },

   loadAllSites: async () => {
      try {
         const allData = await new Promise((resolve) =>
            chrome.storage.local.get(null, resolve)
         );
         const domains = Object.keys(allData).filter(
            (k) =>
               !k.startsWith("settings_") &&
               !k.startsWith("stats_") &&
               !k.startsWith("editmode_") &&
               !k.startsWith("preset_") &&
               k !== "settings" &&
               Array.isArray(allData[k])
         );

         UI.elements.totalSitesBadge.textContent = `Total: ${domains.length}`;

         if (domains.length === 0) {
            UI.elements.sitesList.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">🌐</span>
            <p class="empty-title">Aucun site modifié pour le moment</p>
            <p class="empty-subtitle">Personnalisez une page pour qu'elle apparaisse ici.</p>
          </div>
        `;
            return;
         }

         UI.elements.sitesList.innerHTML = "";

         domains.forEach((domain) => {
            const rules = allData[domain] || [];
            const initial = domain.charAt(0).toUpperCase();

            const item = document.createElement("div");
            item.className = "site-list-item";
            item.innerHTML = `
          <div class="site-list-header">
            <div class="site-avatar">${initial}</div>
            <div class="site-list-info">
              <div class="site-list-name">${domain}</div>
              <div class="site-list-url">https://${domain}</div>
            </div>
            <div class="site-list-actions">
              <button class="site-action-btn refresh" data-domain="${domain}" data-action="refresh">🔄</button>
              <button class="site-action-btn delete" data-domain="${domain}" data-action="delete">🗑️</button>
            </div>
          </div>
          <div class="site-list-tags">
            <span class="site-tag cached">🔴 ${rules.length} cachés</span>
            <span class="site-tag cleaning">✨ Nettoyage</span>
          </div>
        `;

            // Bind action buttons
            item
               .querySelector('[data-action="refresh"]')
               .addEventListener("click", () => UI.refreshSiteDomain(domain));
            item
               .querySelector('[data-action="delete"]')
               .addEventListener("click", () => UI.deleteSiteDomain(domain));

            UI.elements.sitesList.appendChild(item);
         });
      } catch (e) {
         Logger.error("Error loading sites:", e);
      }
   },

   toggleEditMode: async () => {
      if (!UI.state.currentTab) return;

      UI.state.isEditMode = !UI.state.isEditMode;

      if (UI.state.isEditMode) {
         // Activating edit mode
         UI.elements.btnEditMode.innerHTML =
            '<span class="btn-icon">❌</span> Désactiver le mode édition';
         UI.elements.btnEditMode.classList.add("active");

         // Save state
         await StorageManager.setEditModeState(UI.state.domain, true);

         try {
            await Messaging.sendToTab(
               UI.state.currentTab.id,
               "TOGGLE_EDIT_MODE",
               {
                  enable: true,
               }
            );
            window.close(); // Close popup when activating
         } catch (e) {
            Logger.error("Error toggling edit mode:", e);
         }
      } else {
         // Deactivating edit mode
         UI.elements.btnEditMode.innerHTML =
            '<span class="btn-icon">✨</span> Activer le mode édition';
         UI.elements.btnEditMode.classList.remove("active");

         // Save state
         await StorageManager.setEditModeState(UI.state.domain, false);

         try {
            await Messaging.sendToTab(
               UI.state.currentTab.id,
               "TOGGLE_EDIT_MODE",
               {
                  enable: false,
               }
            );
            // Don't close popup when deactivating - let user continue browsing
         } catch (e) {
            Logger.error("Error toggling edit mode:", e);
         }
      }
   },

   toggleEnlargeMode: async () => {
      console.log("🔘 Toggle enlarge mode button clicked");

      if (!UI.state.currentTab) {
         console.error("❌ No current tab");
         return;
      }

      // Disable edit mode if active (mutual exclusion)
      if (UI.state.isEditMode) {
         await UI.toggleEditMode();
      }

      UI.state.isEnlargeMode = !UI.state.isEnlargeMode;
      console.log("📊 Enlarge mode state:", UI.state.isEnlargeMode);

      if (UI.state.isEnlargeMode) {
         // Activating enlarge mode
         UI.elements.btnEnlargeMode.innerHTML =
            '<span class="btn-icon">❌</span>Désactiver';
         UI.elements.btnEnlargeMode.classList.add("active");

         // Save state
         await StorageManager.setEnlargeModeState(UI.state.domain, true);

         console.log("📤 Sending TOGGLE_ENLARGE_MODE message with enable=true");
         try {
            const response = await Messaging.sendToTab(
               UI.state.currentTab.id,
               "TOGGLE_ENLARGE_MODE",
               {
                  enable: true,
               }
            );
            console.log("✅ Message sent successfully:", response);
            window.close(); // Close popup when activating
         } catch (e) {
            console.error("❌ Error sending message:", e);
            Logger.error("Error toggling enlarge mode:", e);
         }
      } else {
         // Deactivating enlarge mode
         UI.elements.btnEnlargeMode.innerHTML =
            '<span class="btn-icon">🔍</span>Mode agrandissement';
         UI.elements.btnEnlargeMode.classList.remove("active");

         // Save state
         await StorageManager.setEnlargeModeState(UI.state.domain, false);

         try {
            await Messaging.sendToTab(
               UI.state.currentTab.id,
               "TOGGLE_ENLARGE_MODE",
               {
                  enable: false,
               }
            );
         } catch (e) {
            Logger.error("Error toggling enlarge mode:", e);
         }
      }
   },

   toggleCleaning: async (e) => {
      const isEnabled = e.target.checked;
      UI.state.isSiteDisabled = !isEnabled;

      await StorageManager.setSiteDisabled(UI.state.domain, !isEnabled);

      // Update badge in current site tab
      if (isEnabled) {
         UI.elements.statusBadge.textContent = "Actif";
         UI.elements.statusBadge.classList.add("active");
      } else {
         UI.elements.statusBadge.textContent = "Inactif";
         UI.elements.statusBadge.classList.remove("active");
      }

      // Update status in specs tab
      if (UI.elements.overviewStatus) {
         if (isEnabled) {
            UI.elements.overviewStatus.textContent = "Nettoyage activé";
            UI.elements.overviewStatus.classList.remove("disabled");
         } else {
            UI.elements.overviewStatus.textContent = "Nettoyage désactivé";
            UI.elements.overviewStatus.classList.add("disabled");
         }
      }

      // Enable/disable preset rule buttons
      const ruleButtons = document.querySelectorAll(".rule-btn");
      ruleButtons.forEach(btn => {
         btn.disabled = !isEnabled;
         if (!isEnabled) {
            btn.classList.add("disabled");
         } else {
            btn.classList.remove("disabled");
         }
      });

      // Notify content script
      if (UI.state.currentTab) {
         await Messaging.sendToTab(UI.state.currentTab.id, "TOGGLE_SITE");
      }
   },

   toggleAdBlocker: async (e) => {
      const isEnabled = e.target.checked;

      // Update settings
      const settings = await StorageManager.getSettings();
      settings.adBlockerEnabled = isEnabled;
      await StorageManager.updateSettings(settings);

      // Notify all tabs
      try {
         const tabs = await chrome.tabs.query({});
         for (const tab of tabs) {
            if (tab.url && tab.url.startsWith("http")) {
               await Messaging.sendToTab(tab.id, "TOGGLE_ADBLOCKER", {
                  enabled: isEnabled,
               }).catch(() => { });
            }
         }
      } catch (e) {
         Logger.error("Error toggling ad blocker:", e);
      }

      // Reload current tab
      if (UI.state.currentTab) {
         setTimeout(() => {
            chrome.tabs.reload(UI.state.currentTab.id);
         }, 100);
      }
   },

   refreshSite: async () => {
      if (!UI.state.currentTab || !UI.state.currentTab.id) return;
      // Simply reload the current tab
      chrome.tabs.reload(UI.state.currentTab.id);
      window.close();
   },

   resetSite: async () => {
      if (!UI.state.domain) return;
      if (
         confirm(
            `↩️ Réinitialiser ${UI.state.domain}?\n\nCeci supprimera toutes les modifications de CE SITE uniquement:\n- Tous les éléments masqués\n- Tous les éléments agrandis\n- Toutes les règles personnalisées\n- Les règles prédéfinies actives\n- Les paramètres de nettoyage\n\n✅ Les autres sites ne seront PAS affectés.\n\nConfirmer?`
         )
      ) {
         // Reset hidden elements
         await StorageManager.reset(UI.state.domain);

         // Reset enlarged elements
         await StorageManager.resetEnlargedElements(UI.state.domain);

         // Reset mode states
         await StorageManager.setEditModeState(UI.state.domain, false);
         await StorageManager.setEnlargeModeState(UI.state.domain, false);

         // Notify content script
         await Messaging.sendToTab(UI.state.currentTab.id, "RESET_SITE");

         // Reload UI
         UI.loadSiteData();
         UI.loadAllSites();
         UI.loadGlobalStats();
         UI.loadEditModeState();
         UI.loadEnlargeModeState();
      }
   },

   refreshSiteDomain: async (domain) => {
      if (confirm(`Réinitialiser ${domain}?`)) {
         await StorageManager.reset(domain);
         UI.loadAllSites();
         if (domain === UI.state.domain) {
            UI.loadSiteData();
            await Messaging.sendToTab(UI.state.currentTab.id, "RESET_SITE");
         }
      }
   },

   deleteSiteDomain: async (domain) => {
      if (confirm(`Supprimer ${domain}?`)) {
         await StorageManager.reset(domain);
         UI.loadAllSites();
         if (domain === UI.state.domain) {
            UI.loadSiteData();
            await Messaging.sendToTab(UI.state.currentTab.id, "RESET_SITE");
         }
      }
   },

   handlePresetRule: async (button) => {
      if (!UI.state.currentTab || !UI.state.domain) return;

      const ruleItem = button.closest(".rule-item");
      const ruleTitle = ruleItem.querySelector(".rule-title").textContent;

      // Map rule titles to rule names
      const ruleMap = {
         "Mode adulte": "adultMode",
         "Mode éducation": "educationMode",
         "Supprimer toutes les images": "removeImages",
         "Supprimer tous les liens": "removeLinks",
         "Supprimer toutes les icônes": "removeIcons",
         "Supprimer les vidéos intégrées": "removeVideos",
      };

      const ruleName = ruleMap[ruleTitle];
      if (!ruleName) return;

      // Toggle state
      const isActive = button.textContent.trim() === "Désactiver";
      const newState = !isActive;

      // Update storage
      await StorageManager.setPresetRule(UI.state.domain, ruleName, newState);

      // Update button
      if (newState) {
         button.textContent = "Désactiver";
         button.classList.remove("secondary");
      } else {
         button.textContent = "Activer";
         button.classList.add("secondary");
      }

      // Notify content script
      await Messaging.sendToTab(UI.state.currentTab.id, "APPLY_PRESET_RULE", {
         ruleName,
         enabled: newState,
      });
   },

   toggleSort: () => {
      // Cycle through sort options
      const sortOptions = [
         { value: "name-asc", label: "Nom (A-Z)" },
         { value: "name-desc", label: "Nom (Z-A)" },
         { value: "rules-desc", label: "Plus de règles" },
         { value: "rules-asc", label: "Moins de règles" },
      ];

      const currentIndex = sortOptions.findIndex(
         (opt) => opt.value === UI.state.sortBy
      );
      const nextIndex = (currentIndex + 1) % sortOptions.length;
      UI.state.sortBy = sortOptions[nextIndex].value;

      // Update button text
      const btn = document.querySelectorAll(".search-btn")[0];
      if (btn) {
         btn.textContent = sortOptions[nextIndex].label;
      }

      UI.applySortAndFilter();
   },

   toggleFilter: () => {
      // Cycle through filter options
      const filterOptions = [
         { value: "all", label: "Tout" },
         { value: "active", label: "Actifs" },
         { value: "many-rules", label: "Beaucoup de règles (5+)" },
      ];

      const currentIndex = filterOptions.findIndex(
         (opt) => opt.value === UI.state.filterBy
      );
      const nextIndex = (currentIndex + 1) % filterOptions.length;
      UI.state.filterBy = filterOptions[nextIndex].value;

      // Update button text
      const btn = document.querySelectorAll(".search-btn")[1];
      if (btn) {
         btn.textContent = filterOptions[nextIndex].label;
      }

      UI.applySortAndFilter();
   },

   applySortAndFilter: () => {
      const items = Array.from(
         UI.elements.sitesList.querySelectorAll(".site-list-item")
      );
      if (items.length === 0) return;

      // Sort items
      items.sort((a, b) => {
         const domainA = a
            .querySelector(".site-list-name")
            .textContent.toLowerCase();
         const domainB = b
            .querySelector(".site-list-name")
            .textContent.toLowerCase();
         const rulesA = parseInt(
            a.querySelector(".site-tag.cached").textContent.match(/\d+/)[0]
         );
         const rulesB = parseInt(
            b.querySelector(".site-tag.cached").textContent.match(/\d+/)[0]
         );

         switch (UI.state.sortBy) {
            case "name-asc":
               return domainA.localeCompare(domainB);
            case "name-desc":
               return domainB.localeCompare(domainA);
            case "rules-desc":
               return rulesB - rulesA;
            case "rules-asc":
               return rulesA - rulesB;
            default:
               return 0;
         }
      });

      // Apply filter and re-append in sorted order
      let visibleCount = 0;
      items.forEach((item) => {
         const rulesCount = parseInt(
            item.querySelector(".site-tag.cached").textContent.match(/\d+/)[0]
         );
         let shouldShow = true;

         switch (UI.state.filterBy) {
            case "active":
               shouldShow = rulesCount > 0;
               break;
            case "many-rules":
               shouldShow = rulesCount >= 5;
               break;
            case "all":
            default:
               shouldShow = true;
         }

         if (shouldShow) {
            item.style.display = "";
            visibleCount++;
         } else {
            item.style.display = "none";
         }

         UI.elements.sitesList.appendChild(item);
      });

      // Update badge
      UI.elements.totalSitesBadge.textContent = `Total: ${visibleCount} / ${items.length}`;
   },

   handleSearch: (e) => {
      const query = e.target.value.toLowerCase().trim();
      const items = UI.elements.sitesList.querySelectorAll(".site-list-item");

      if (items.length === 0) return;

      let visibleCount = 0;

      items.forEach((item) => {
         const nameElement = item.querySelector(".site-list-name");
         const urlElement = item.querySelector(".site-list-url");

         if (!nameElement) return;

         const domain = nameElement.textContent.toLowerCase();
         const url = urlElement ? urlElement.textContent.toLowerCase() : "";

         // Search in both domain name and URL
         if (domain.includes(query) || url.includes(query)) {
            item.style.display = "";
            visibleCount++;
         } else {
            item.style.display = "none";
         }
      });

      // Show empty state if no results
      if (visibleCount === 0 && query !== "") {
         const existingEmptyState = UI.elements.sitesList.querySelector(
            ".search-empty-state"
         );
         if (!existingEmptyState) {
            const emptyState = document.createElement("div");
            emptyState.className = "search-empty-state";
            emptyState.innerHTML = `
               <div class="empty-state">
                  <span class="empty-icon">🔍</span>
                  <p class="empty-title">Aucun résultat pour "${query}"</p>
                  <p class="empty-subtitle">Essayez un autre terme de recherche.</p>
               </div>
            `;
            UI.elements.sitesList.appendChild(emptyState);
         }
      } else {
         const existingEmptyState = UI.elements.sitesList.querySelector(
            ".search-empty-state"
         );
         if (existingEmptyState) {
            existingEmptyState.remove();
         }
      }
   },

   pauseCleaning: async (minutes) => {
      if (!UI.state.domain) return;

      const endTime = Date.now() + minutes * 60 * 1000;

      // Store pause info
      await chrome.storage.local.set({
         [`pause_${UI.state.domain}`]: endTime,
      });

      // Disable cleaning
      await StorageManager.setSiteDisabled(UI.state.domain, true);

      // Update UI
      UI.elements.cleaningToggle.checked = false;
      UI.elements.pauseTimer.style.display = "block";
      UI.elements.pauseCancel.style.display = "block";
      UI.elements.pauseBtns.forEach((btn) => btn.classList.remove("active"));

      // Start timer
      UI.updatePauseTimer();

      // Reload page to apply
      if (UI.state.currentTab) {
         chrome.tabs.reload(UI.state.currentTab.id);
      }
   },

   resumeCleaning: async () => {
      if (!UI.state.domain) return;

      // Remove pause
      await chrome.storage.local.remove([`pause_${UI.state.domain}`]);

      // Enable cleaning
      await StorageManager.setSiteDisabled(UI.state.domain, false);

      // Update UI
      UI.elements.cleaningToggle.checked = true;
      UI.elements.pauseTimer.style.display = "none";
      UI.elements.pauseCancel.style.display = "none";

      // Reload page
      if (UI.state.currentTab) {
         chrome.tabs.reload(UI.state.currentTab.id);
      }
   },

   updatePauseTimer: async () => {
      if (!UI.state.domain) return;

      const result = await chrome.storage.local.get([
         `pause_${UI.state.domain}`,
      ]);
      const endTime = result[`pause_${UI.state.domain}`];

      if (!endTime) {
         UI.elements.pauseTimer.style.display = "none";
         UI.elements.pauseCancel.style.display = "none";
         return;
      }

      const remaining = endTime - Date.now();

      if (remaining <= 0) {
         // Time's up, resume cleaning
         await UI.resumeCleaning();
         return;
      }

      // Display time remaining
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      UI.elements.pauseTimer.textContent = `${minutes}:${seconds
         .toString()
         .padStart(2, "0")}`;
      UI.elements.pauseTimer.style.display = "block";
      UI.elements.pauseCancel.style.display = "block";

      // Update every second
      setTimeout(() => UI.updatePauseTimer(), 1000);
   },

   resetAllSites: async () => {
      if (
         confirm(
            "Réinitialiser TOUTES les personnalisations? Cette action est irréversible."
         )
      ) {
         await StorageManager.resetAll();
         if (UI.state.currentTab) {
            await Messaging.sendToTab(UI.state.currentTab.id, "RESET_SITE");
         }
         UI.loadSiteData();
         UI.loadAllSites();
         UI.loadGlobalStats();
      }
   },

   loadPresetRulesState: async () => {
      if (!UI.state.domain) return;

      try {
         const presetRules = await StorageManager.getPresetRules(
            UI.state.domain
         );

         // Update all rule buttons based on state
         document.querySelectorAll(".rule-btn").forEach((btn) => {
            const ruleItem = btn.closest(".rule-item");
            const ruleTitle = ruleItem.querySelector(".rule-title").textContent;

            const ruleMap = {
               "Mode adulte": "adultMode",
               "Mode éducation": "educationMode",
               "Supprimer toutes les images": "removeImages",
               "Supprimer tous les liens": "removeLinks",
               "Supprimer toutes les icônes": "removeIcons",
               "Supprimer les vidéos intégrées": "removeVideos",
            };

            const ruleName = ruleMap[ruleTitle];
            if (ruleName && presetRules[ruleName]) {
               btn.textContent = "Désactiver";
               btn.classList.remove("secondary");
            } else {
               btn.textContent = "Activer";
               btn.classList.add("secondary");
            }
         });
      } catch (e) {
         Logger.error("Error loading preset rules state:", e);
      }
   },
};

document.addEventListener("DOMContentLoaded", UI.init);
