const urlParams = new URLSearchParams(window.location.search);
const integrationId = urlParams.get('id');
const readmeContentDiv = document.getElementById('readme-content');
const sidebarContentDiv = document.getElementById('sidebar-content');
const mainReadmeArea = document.getElementById('main-readme-area');
const searchToggleButton = document.getElementById('searchToggleButton');
const searchContainer = document.getElementById('searchContainer');
const searchInput = document.getElementById('searchInput');
const loadingBar = document.querySelector('.loading-bar'); // Get the loading bar element
const loadingMessage = readmeContentDiv.querySelector('p'); // Get the initial loading message

let headingElements = [];
let sidebarLinks = [];

/**
 * Attempts to fetch a markdown file from a given URL.
 * @param {string} url The URL of the markdown file.
 * @returns {Promise<string|null>} A promise that resolves with the markdown content as a string, or null if fetching fails.
 */
async function fetchMarkdown(url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            return await response.text();
        } else {
            console.warn(`Failed to fetch markdown from ${url}: Status ${response.status}`);
            return null; // Return null on non-OK responses (including 404)
        }
    } catch (error) {
        console.error(`Error during fetch for ${url}:`, error);
        return null; // Return null on network errors
    }
}

async function fetchReadme() {
    // Show loading bar and message
    if (loadingBar) loadingBar.classList.add('active');
    if (loadingMessage) loadingMessage.style.display = 'block'; // Ensure message is visible

    const baseUrl = `https://raw.githubusercontent.com/zopdev/helm-charts/main/charts/${integrationId}/`;
    const readmeUrlsToTry = [`${baseUrl}README.md`, `${baseUrl}Readme.md`];

    let readmeMarkdown = null;

    // Try fetching README.md first
    readmeMarkdown = await fetchMarkdown(readmeUrlsToTry[0]);

    // If README.md failed, try Readme.md
    if (readmeMarkdown === null) {
        readmeMarkdown = await fetchMarkdown(readmeUrlsToTry[1]);
    }

    if (readmeMarkdown !== null) {
        const readmeHtml = marked.parse(readmeMarkdown);
        processAndDisplayReadme(readmeHtml);
    } else {
        readmeContentDiv.innerHTML = `<p style="color: #ef4444;">Error loading README content. Neither README.md nor Readme.md could be found or loaded.</p>`;
    }

    // Hide loading bar after content is rendered or an error occurs
    if (loadingBar) loadingBar.classList.remove('active');
    if (loadingMessage) loadingMessage.style.display = 'none'; // Hide the loading message once content is loaded or error shown
}

function processAndDisplayReadme(htmlContent) {
    readmeContentDiv.innerHTML = htmlContent; // This will overwrite the loading message and bar initially
    sidebarContentDiv.innerHTML = '';
    headingElements = [];
    sidebarLinks = [];

    const showAllLink = document.createElement('a');
    showAllLink.href = '#';
    showAllLink.textContent = 'Show All';
    showAllLink.classList.add('sidebar-show-all');
    showAllLink.addEventListener('click', (event) => {
        event.preventDefault();
        mainReadmeArea.scrollTo({ top: 0, behavior: 'smooth' });
        updateSidebarActiveLink('');
        searchInput.value = '';
        filterSidebarLinks('');
        searchContainer.classList.remove('active');
    });
    sidebarContentDiv.appendChild(showAllLink);
    sidebarLinks.push(showAllLink);

    const headings = readmeContentDiv.querySelectorAll('h1, h2');

    headings.forEach((heading, index) => {
        let id = heading.id || `section-${index}`;
        heading.id = id;
        headingElements.push(heading);

        const sidebarLink = document.createElement('a');
        sidebarLink.href = `#${id}`;
        sidebarLink.textContent = heading.textContent;
        sidebarLink.classList.add('block');
        if (heading.tagName === 'H2') {
            sidebarLink.classList.add('level-2');
        }
        sidebarLink.addEventListener('click', (event) => {
            event.preventDefault();
            scrollToSection(id);
        });
        sidebarContentDiv.appendChild(sidebarLink);
        sidebarLinks.push(sidebarLink);
    });

    mainReadmeArea.addEventListener('scroll', highlightActiveSection);
    window.addEventListener('resize', highlightActiveSection);
    setTimeout(highlightActiveSection, 100);
}

function scrollToSection(sectionId) {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        updateSidebarActiveLink(sectionId); 
        setTimeout(highlightActiveSection, 300);
    }
}

function highlightActiveSection() {
    const currentScrollPos = mainReadmeArea.scrollTop;
    const offset = 80;

    let activeSectionId = '';

    for (let i = headingElements.length - 1; i >= 0; i--) {
        const heading = headingElements[i];
        if (currentScrollPos + offset >= heading.offsetTop) {
            activeSectionId = heading.id;
            break;
        }
    }
    // updateSidebarActiveLink(activeSectionId);
}

function updateSidebarActiveLink(activeSectionId) {
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
    });

    if (activeSectionId) {
        const activeLinked = sidebarContentDiv.querySelector(`a[href="#${activeSectionId}"]`);
        // console.log(activeLinked);
        if (activeLinked) {
            activeLinked.classList.add('active');
        }
    }
}

function toggleSearchBar() {
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
        searchInput.focus();
    } else {
        searchInput.value = '';
        filterSidebarLinks('');
    }
}

function filterSidebarLinks(query) {
    const lowerCaseQuery = query.toLowerCase().trim();
    const showAllLink = sidebarContentDiv.querySelector('.sidebar-show-all');

    sidebarLinks.forEach(link => {
        if (link === showAllLink) {
            return;
        }

        const linkText = link.textContent.toLowerCase();
        if (lowerCaseQuery === '' || linkText.includes(lowerCaseQuery)) {
            link.style.display = 'block';
        } else {
            link.style.display = 'none';
        }
    });

    if (showAllLink) {
        if (lowerCaseQuery !== '') {
            showAllLink.style.display = 'none';
        } else {
            showAllLink.style.display = 'block';
        }
    }
}

searchToggleButton.addEventListener('click', toggleSearchBar);
searchInput.addEventListener('input', (event) => {
    filterSidebarLinks(event.target.value);
});

document.addEventListener('DOMContentLoaded', fetchReadme);