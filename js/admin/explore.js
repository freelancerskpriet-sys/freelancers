import { requireSupabaseClient } from "../config/supabase.js";

import {
    cleanText,
    getInitials,
    createNavbarRole,
    setText,
    showElement,
    hideElement
} from "../utils/helpers.js";

import {
    ROUTES,
    navigateTo
} from "../utils/navigation.js";

import { initializeAuthenticatedPage } from "../auth/auth-guard.js";

const navbarUserName = document.getElementById("navbarUserName");
const navbarUserRole = document.getElementById("navbarUserRole");
const navbarUserAvatar = document.getElementById("navbarUserAvatar");

const backToDashboardButton = document.getElementById("backToDashboardButton");

const freelancerSearch = document.getElementById("freelancerSearch");
const departmentFilter = document.getElementById("departmentFilter");
const availabilityFilter = document.getElementById("availabilityFilter");
const clearFiltersButton = document.getElementById("clearFiltersButton");
const emptyStateClearButton = document.getElementById("emptyStateClearButton");

const freelancerResultCount = document.getElementById("freelancerResultCount");
const freelancerGrid = document.getElementById("freelancerGrid");
const freelancerLoadingState = document.getElementById("freelancerLoadingState");
const freelancerEmptyState = document.getElementById("freelancerEmptyState");

const EXPLORE_CONFIG = Object.freeze({
    MAX_VISIBLE_SERVICES: 3,
    PROFILE_COLUMNS: `
        id,
        full_name,
        email,
        campus_role,
        department,
        programme,
        academic_year,
        section,
        profile_photo_url
    `,
    FREELANCER_DIRECTORY_COLUMNS: `
        id,
        user_id,
        professional_title,
        bio,
        skills,
        services,
        availability_status,
        approval_status,
        created_at,
        profiles!freelancer_profiles_user_id_fkey (
            full_name,
            department,
            academic_year,
            section,
            profile_photo_url
        )
    `
});

let currentUser = null;
let allFreelancers = [];
let filteredFreelancers = [];

async function getCurrentUserProfile(authenticatedUser) {
    if (!authenticatedUser?.id) {
        return null;
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("profiles")
        .select(EXPLORE_CONFIG.PROFILE_COLUMNS)
        .eq("id", authenticatedUser.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;
}

function normalizeFreelancerRecord(record) {
    if (!record) {
        return null;
    }

    const linkedProfile = record.profiles ?? {};

    return {
        id: cleanText(record.id),
        user_id: cleanText(record.user_id),
        full_name: cleanText(linkedProfile.full_name),
        department: cleanText(linkedProfile.department),
        academic_year: cleanText(linkedProfile.academic_year),
        section: cleanText(linkedProfile.section),
        profile_photo_url: cleanText(linkedProfile.profile_photo_url),
        professional_title: cleanText(record.professional_title),
        bio: cleanText(record.bio),
        skills: Array.isArray(record.skills) ? record.skills : [],
        services: Array.isArray(record.services) ? record.services : [],
        availability_status: cleanText(record.availability_status) || "busy"
    };
}

async function getFreelancers() {
    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("freelancer_profiles")
        .select(EXPLORE_CONFIG.FREELANCER_DIRECTORY_COLUMNS)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return (data ?? [])
        .map(normalizeFreelancerRecord)
        .filter(Boolean);
}

function populateNavbar(user) {
    if (!user) {
        return;
    }

    const fullName = cleanText(user.full_name) || "User";
    const initials = getInitials(fullName);
    const navbarRole = createNavbarRole(user);

    setText(navbarUserName, fullName);
    setText(navbarUserRole, navbarRole || "KPRIET USER");
    setText(navbarUserAvatar, initials);

    applyNavbarPhoto(user.profile_photo_url);
}

function applyNavbarPhoto(profilePhotoUrl) {
    const photoUrl = cleanText(profilePhotoUrl);

    if (!navbarUserAvatar || !photoUrl) {
        return;
    }

    try {
        const parsedUrl = new URL(photoUrl);

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return;
        }

        navbarUserAvatar.style.backgroundImage = `url("${parsedUrl.href}")`;
        navbarUserAvatar.style.backgroundSize = "cover";
        navbarUserAvatar.style.backgroundPosition = "center";
        navbarUserAvatar.textContent = "";
    } catch (error) {
        console.warn("Invalid navbar profile photo URL:", error);
    }
}

function createClassInformation(freelancer) {
    const classParts = [
        freelancer.academic_year ? `Year ${cleanText(freelancer.academic_year)}` : "",
        cleanText(freelancer.department),
        freelancer.section ? `Section ${cleanText(freelancer.section)}` : ""
    ].filter(Boolean);

    return classParts.join(" · ") || "N/A";
}

function normalizeAvailability(availabilityStatus) {
    const availability = cleanText(availabilityStatus).toLowerCase();

    if (availability === "available") {
        return "available";
    }

    return "busy";
}

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    return element;
}

function applyFreelancerPhoto(avatar, profilePhotoUrl) {
    const photoUrl = cleanText(profilePhotoUrl);

    if (!avatar || !photoUrl) {
        return;
    }

    try {
        const parsedUrl = new URL(photoUrl);

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return;
        }

        avatar.style.backgroundImage = `url("${parsedUrl.href}")`;
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        avatar.textContent = "";
    } catch (error) {
        console.warn("Invalid freelancer photo URL:", error);
    }
}

function getPrimaryService(freelancer) {
    if (freelancer.professional_title) {
        return cleanText(freelancer.professional_title);
    }

    if (Array.isArray(freelancer.services) && freelancer.services.length > 0) {
        const first = freelancer.services[0];
        return cleanText(typeof first === "string" ? first : first.title || "") || "Student Freelancer";
    }

    if (Array.isArray(freelancer.skills) && freelancer.skills.length > 0) {
        return cleanText(freelancer.skills[0]) || "Student Freelancer";
    }

    return "Student Freelancer";
}

function getServicesList(freelancer) {
    let rawList = [];

    if (Array.isArray(freelancer.services) && freelancer.services.length > 0) {
        rawList = freelancer.services.map((item) => typeof item === "string" ? item : item.title || "");
    } else if (Array.isArray(freelancer.skills) && freelancer.skills.length > 0) {
        rawList = freelancer.skills;
    }

    return rawList
        .map((item) => cleanText(item))
        .filter(Boolean);
}

function createMoreServiceTags(freelancer) {
    const tagContainer = document.createElement("div");
    tagContainer.className = "service-tags";

    const items = getServicesList(freelancer);

    if (items.length === 0) {
        tagContainer.appendChild(createTextElement("span", "detail-value", "No services listed"));
        return tagContainer;
    }

    const visibleItems = items.slice(0, EXPLORE_CONFIG.MAX_VISIBLE_SERVICES);

    visibleItems.forEach((serviceText) => {
        tagContainer.appendChild(createTextElement("span", "service-tag", serviceText));
    });

    const remaining = items.length - visibleItems.length;

    if (remaining > 0) {
        tagContainer.appendChild(createTextElement("span", "service-tag", `+${remaining} more`));
    }

    return tagContainer;
}

const ICON_CATEGORY =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="3" y="7" width="18" height="13" rx="2"/>' +
    '<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
    '<path d="M3 13h18"/></svg>';

const ICON_CLASS =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M22 10L12 5 2 10l10 5 10-5z"/>' +
    '<path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/></svg>';

function createInfoCard(iconMarkup, text) {
    const card = document.createElement("div");
    card.className = "fc-info-card";
    card.title = text;

    const icon = document.createElement("span");
    icon.className = "fc-info-icon";
    icon.innerHTML = iconMarkup; // static markup only, never user data

    card.append(icon, createTextElement("span", "fc-info-value", text));
    return card;
}

function createFreelancerCard(freelancer) {
    const article = document.createElement("article");
    article.className = "fc-card";

    const availability = normalizeAvailability(freelancer.availability_status);
    const fullName = cleanText(freelancer.full_name) || "Campus Freelancer";
    const category = getPrimaryService(freelancer);
    const classInfo = createClassInformation(freelancer);

    /* ---------- Header: status + avatar + name ---------- */
    const header = document.createElement("div");
    header.className = "fc-header";

    const status = document.createElement("span");
    status.className = `fc-status ${availability}`;
    status.append(
        createTextElement("span", "fc-status-dot", ""),
        availability === "available" ? "Available" : "Busy"
    );

    const avatar = document.createElement("div");
    avatar.className = "fc-avatar";
    avatar.textContent = getInitials(fullName);
    applyFreelancerPhoto(avatar, freelancer.profile_photo_url);

    const nameEl = createTextElement("h3", "fc-name", fullName);
    nameEl.title = fullName;

    header.append(status, avatar, nameEl);

    /* ---------- Body: category + class side by side, then button ---------- */
    const body = document.createElement("div");
    body.className = "fc-body";

    const infoRow = document.createElement("div");
    infoRow.className = "fc-info";
    infoRow.append(
        createInfoCard(ICON_CATEGORY, category),
        createInfoCard(ICON_CLASS, classInfo)
    );

    const viewBtn = createTextElement("a", "fc-button", "View Profile");
    viewBtn.href = "#";
    viewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openFreelancerProfile(freelancer.id);
    });

    body.append(infoRow, viewBtn);
    article.append(header, body);
    return article;
}

function renderFreelancers(freelancers) {
    if (!freelancerGrid) {
        return;
    }

    const safeFreelancers = Array.isArray(freelancers) ? freelancers : [];

    freelancerGrid.replaceChildren();
    setText(freelancerResultCount, String(safeFreelancers.length));

    if (safeFreelancers.length === 0) {
        hideElement(freelancerGrid);
        showElement(freelancerEmptyState);
        return;
    }

    hideElement(freelancerEmptyState);
    showElement(freelancerGrid);

    const fragment = document.createDocumentFragment();

    safeFreelancers.forEach((freelancer) => {
        fragment.appendChild(createFreelancerCard(freelancer));
    });

    freelancerGrid.appendChild(fragment);
}

function normalizeSearchValue(value) {
    return cleanText(value).toLowerCase();
}

function createFreelancerSearchText(freelancer) {
    const skills = Array.isArray(freelancer.skills) ? freelancer.skills.join(" ") : "";
    const services = Array.isArray(freelancer.services) ? freelancer.services.join(" ") : "";

    return normalizeSearchValue([
        freelancer.full_name,
        freelancer.department,
        freelancer.academic_year,
        freelancer.section,
        freelancer.professional_title,
        freelancer.bio,
        skills,
        services
    ].join(" "));
}

function filterFreelancers() {
    const searchValue = normalizeSearchValue(freelancerSearch?.value);
    const selectedDepartment = cleanText(departmentFilter?.value).toLowerCase();
    const selectedAvailability = cleanText(availabilityFilter?.value).toLowerCase();

    filteredFreelancers = allFreelancers.filter((freelancer) => {
        const searchableText = createFreelancerSearchText(freelancer);
        const freelancerDepartment = cleanText(freelancer.department).toLowerCase();
        const freelancerAvailability = normalizeAvailability(freelancer.availability_status);

        const matchesSearch = !searchValue || searchableText.includes(searchValue);
        const matchesDepartment = !selectedDepartment || freelancerDepartment === selectedDepartment;
        const matchesAvailability = !selectedAvailability || freelancerAvailability === selectedAvailability;

        return matchesSearch && matchesDepartment && matchesAvailability;
    });

    renderFreelancers(filteredFreelancers);
}

function clearFilters() {
    if (freelancerSearch) {
        freelancerSearch.value = "";
    }

    if (departmentFilter) {
        departmentFilter.value = "";
    }

    if (availabilityFilter) {
        availabilityFilter.value = "";
    }

    filteredFreelancers = [...allFreelancers];
    renderFreelancers(filteredFreelancers);

    freelancerSearch?.focus();
}

function openFreelancerProfile(freelancerId) {
    const id = cleanText(freelancerId);

    if (!id) {
        console.warn("Freelancer profile identifier is unavailable.");
        return;
    }

    if (typeof ROUTES !== "undefined" && ROUTES.ADMIN_FREELANCER_PROFILE) {
        navigateTo(ROUTES.ADMIN_FREELANCER_PROFILE, { id });
    } else {
        window.location.href = `http://127.0.0.1:5500/pages/admin/profile.html?id=${id}`;
    }
}

function returnToDashboard() {
    if (typeof ROUTES !== "undefined" && ROUTES.ADMIN_DASHBOARD) {
        navigateTo(ROUTES.ADMIN_DASHBOARD);
    } else {
        window.location.href = "http://127.0.0.1:5500/pages/admin/dashboard.html";
    }
}

function showLoadingState() {
    showElement(freelancerLoadingState);
    hideElement(freelancerGrid);
    hideElement(freelancerEmptyState);
}

function hideLoadingState() {
    hideElement(freelancerLoadingState);
}

function initializeEventListeners() {
    freelancerSearch?.addEventListener("input", filterFreelancers);
    departmentFilter?.addEventListener("change", filterFreelancers);
    availabilityFilter?.addEventListener("change", filterFreelancers);
    clearFiltersButton?.addEventListener("click", clearFilters);
    emptyStateClearButton?.addEventListener("click", clearFilters);
    backToDashboardButton?.addEventListener("click", returnToDashboard);
}

async function initializeExplorePage(authenticatedUser) {
    initializeEventListeners();
    showLoadingState();

    try {
        currentUser = await getCurrentUserProfile(authenticatedUser);

        if (currentUser) {
            populateNavbar(currentUser);
        }

        const freelancerRecords = await getFreelancers();
        allFreelancers = Array.isArray(freelancerRecords) ? freelancerRecords : [];
        filteredFreelancers = [...allFreelancers];

        hideLoadingState();
        renderFreelancers(filteredFreelancers);
    } catch (error) {
        console.error("Explore freelancers initialization error:", error);
        hideLoadingState();

        allFreelancers = [];
        filteredFreelancers = [];
        renderFreelancers(filteredFreelancers);
    }
}

/* Use the same blue as the "FREELANCER" text in the navbar */
function syncBrandColour() {
    const brand = document.querySelector(".navbar-brand .brand-name strong");

    if (!brand) {
        return;
    }

    const colour = getComputedStyle(brand).color;

    if (colour) {
        document.documentElement.style.setProperty("--fc-blue", colour);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializeAuthenticatedPage(initializeExplorePage);
});
