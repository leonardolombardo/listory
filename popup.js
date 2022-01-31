

function openListory() {
    chrome.tabs.create(
      { active: true, url: 'listory.html' },
      (tab) => {
      }
    );
}


document.addEventListener("DOMContentLoaded", openListory);