/* =========================================================
   KPRIET FREELANCER PLATFORM
   Explore Freelancers Logic
   File: js/freelancers/explore.js
========================================================= */

import {
    requireSupabaseClient
} from "../config/supabase.js";

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

import {
    initializeAuthenticatedPage
} from "../auth/auth-guard.js";

/* =========================================================
   DOM ELEMENTS
========================================================= */

/* Navbar */

const navbarUserName =
    document.getElementById("navbarUserName");

const navbarUserRole =
    document.getElementById("navbarUserRole");

const navbarUserAvatar =
    document.getElementById("navbarUserAvatar");

/* Navigation */

const backToDashboardButton =
    document.getElementById("backToDashboardButton");

/* Filters */

const freelancerSearch =
    document.getElementById("freelancerSearch");

const departmentFilter =
    document.getElementById("departmentFilter");

const availabilityFilter =
    document.getElementById("availabilityFilter");

const clearFiltersButton =
    document.getElementById("clearFiltersButton");

const emptyStateClearButton =
    document.getElementById("emptyStateClearButton");

/* Results */

const freelancerResultCount =
    document.getElementById("freelancerResultCount");

const freelancerGrid =
    document.getElementById("freelancerGrid");

const freelancerLoadingState =
    document.getElementById("freelancerLoadingState");

const freelancerEmptyState =
    document.getElementById("freelancerEmptyState");

/* =========================================================
   EXPLORE CONFIGURATION
========================================================= */

const EXPLORE_CONFIG = Object.freeze({

    MAX_VISIBLE_SKILLS: 4,

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

/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let allFreelancers = [];

let filteredFreelancers = [];

/* =========================================================
   GET CURRENT USER PROFILE
========================================================= */

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

/* =========================================================
   NORMALIZE FREELANCER DIRECTORY RECORD
========================================================= */

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

/* =========================================================
   GET FREELANCERS
   Loads approved freelancer directory records from
   freelancer_profiles, joined with their profiles row.
========================================================= */

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

/* =========================================================
   POPULATE NAVBAR
========================================================= */

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

/* =========================================================
   NAVBAR PHOTO
========================================================= */

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

/* =========================================================
   CREATE CAMPUS INFORMATION
========================================================= */

function createCampusInformation(freelancer) {

    const information = [

        cleanText(freelancer.department),

        freelancer.academic_year ? `Year ${cleanText(freelancer.academic_year)}` : "",

        freelancer.section ? `Section ${cleanText(freelancer.section)}` : ""

    ].filter(Boolean);

    return information.join(" · ") || "KPRIET Freelancer";

}

/* =========================================================
   NORMALIZE AVAILABILITY
========================================================= */

function normalizeAvailability(availabilityStatus) {

    const availability = cleanText(availabilityStatus).toLowerCase();

    if (availability === "available") {
        return "available";
    }

    return "busy";

}

/* =========================================================
   CREATE TEXT ELEMENT
========================================================= */

function createTextElement(tagName, className, text) {

    const element = document.createElement(tagName);

    element.className = className;
    element.textContent = text;

    return element;

}

/* =========================================================
   APPLY FREELANCER PHOTO
========================================================= */

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

/* =========================================================
   CREATE SKILL LIST
========================================================= */

function createSkillList(skills) {

    const skillList = document.createElement("div");
    skillList.className = "freelancer-skill-list";

    const normalizedSkills = Array.isArray(skills)
        ? skills.map((skill) => cleanText(skill)).filter(Boolean)
        : [];

    const visibleSkills = normalizedSkills.slice(0, EXPLORE_CONFIG.MAX_VISIBLE_SKILLS);

    visibleSkills.forEach((skill) => {
        const skillElement = createTextElement("span", "freelancer-skill", skill);
        skillList.appendChild(skillElement);
    });

    const remainingSkills = normalizedSkills.length - visibleSkills.length;

    if (remainingSkills > 0) {
        const moreSkillsElement = createTextElement(
            "span",
            "freelancer-skill freelancer-skill-more",
            `+${remainingSkills}`
        );
        skillList.appendChild(moreSkillsElement);
    }

    return skillList;

}

/* =========================================================
   CREATE FREELANCER CARD
========================================================= */

function createFreelancerCard(freelancer) {

    const article = document.createElement("article");
    article.className = "freelancer-card";

    const button = document.createElement("button");
    button.className = "freelancer-card-button";
    button.type = "button";

    button.setAttribute(
        "aria-label",
        `View ${cleanText(freelancer.full_name) || "freelancer"} profile`
    );

    button.addEventListener("click", () => {
        openFreelancerProfile(freelancer.id);
    });

    /* -----------------------------------------------------
       CARD HEADER
    ----------------------------------------------------- */

    const cardHeader = document.createElement("div");
    cardHeader.className = "freelancer-card-header";

    const identity = document.createElement("div");
    identity.className = "freelancer-card-identity";

    const fullName = cleanText(freelancer.full_name) || "Freelancer";

    const avatar = createTextElement("div", "freelancer-avatar", getInitials(fullName));

    applyFreelancerPhoto(avatar, freelancer.profile_photo_url);

    const nameBlock = document.createElement("div");
    nameBlock.className = "freelancer-card-name-block";

    const name = createTextElement("h2", "freelancer-card-name", fullName);

    const campus = createTextElement(
        "p",
        "freelancer-card-campus",
        createCampusInformation(freelancer)
    );

    nameBlock.append(name, campus);

    identity.append(avatar, nameBlock);

    const availability = normalizeAvailability(freelancer.availability_status);

    const availabilityBadge = createTextElement(
        "span",
        `freelancer-availability ${availability}`,
        availability === "available" ? "Available" : "Busy"
    );

    cardHeader.append(identity, availabilityBadge);

    /* -----------------------------------------------------
       CARD CONTENT
    ----------------------------------------------------- */

    const cardContent = document.createElement("div");
    cardContent.className = "freelancer-card-content";

    const professionalTitle = createTextElement(
        "h3",
        "freelancer-professional-title",
        cleanText(freelancer.professional_title) || "Campus Freelancer"
    );

    const bio = createTextElement(
        "p",
        "freelancer-card-bio",
        cleanText(freelancer.bio) ||
        "Professional services available within the KPRIET campus network."
    );

    const skillList = createSkillList(freelancer.skills);

    cardContent.append(professionalTitle, bio, skillList);

    /* -----------------------------------------------------
       CARD ACTION
    ----------------------------------------------------- */

    const cardAction = document.createElement("div");
    cardAction.className = "freelancer-card-action";

    const actionText = createTextElement(
        "span",
        "freelancer-card-action-text",
        "View profile"
    );

    const actionLine = document.createElement("span");
    actionLine.className = "freelancer-card-action-line";
    actionLine.setAttribute("aria-hidden", "true");

    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("viewBox", "0 0 24 24");
    arrow.setAttribute("aria-hidden", "true");

    const arrowLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowLine.setAttribute("d", "M5 12h14");

    const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowHead.setAttribute("d", "M13 6l6 6-6 6");

    arrow.append(arrowLine, arrowHead);

    cardAction.append(actionText, actionLine, arrow);

    button.append(cardHeader, cardContent, cardAction);

    article.appendChild(button);

    return article;

}

/* =========================================================
   RENDER FREELANCERS
========================================================= */

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

/* =========================================================
   NORMALIZE SEARCH VALUE
========================================================= */

function normalizeSearchValue(value) {
    return cleanText(value).toLowerCase();
}

/* =========================================================
   CREATE SEARCHABLE TEXT
========================================================= */

function createFreelancerSearchText(freelancer) {

    const skills = Array.isArray(freelancer.skills) ? freelancer.skills.join(" ") : "";
    const services = Array.isArray(freelancer.services) ? freelancer.services.join(" ") : "";

    return normalizeSearchValue([
        freelancer.full_name,
        freelancer.department,
        freelancer.professional_title,
        freelancer.bio,
        skills,
        services
    ].join(" "));

}

/* =========================================================
   FILTER FREELANCERS
========================================================= */

function filterFreelancers() {

    const searchValue = normalizeSearchValue(freelancerSearch?.value);

    const selectedDepartment = cleanText(departmentFilter?.value).toLowerCase();

    const selectedAvailability = cleanText(availabilityFilter?.value).toLowerCase();

    filteredFreelancers = allFreelancers.filter((freelancer) => {

        const searchableText = createFreelancerSearchText(freelancer);

        const freelancerDepartment = cleanText(freelancer.department).toLowerCase();

        const freelancerAvailability = normalizeAvailability(freelancer.availability_status);

        const matchesSearch = !searchValue || searchableText.includes(searchValue);

        const matchesDepartment =
            !selectedDepartment || freelancerDepartment === selectedDepartment;

        const matchesAvailability =
            !selectedAvailability || freelancerAvailability === selectedAvailability;

        return matchesSearch && matchesDepartment && matchesAvailability;

    });

    renderFreelancers(filteredFreelancers);

}

/* =========================================================
   CLEAR FILTERS
========================================================= */

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

/* =========================================================
   OPEN FREELANCER PROFILE
========================================================= */

function openFreelancerProfile(freelancerId) {

    const id = cleanText(freelancerId);

    if (!id) {
        console.warn("Freelancer profile identifier is unavailable.");
        return;
    }

    navigateTo(ROUTES.FREELANCER_PROFILE, { id });

}

/* =========================================================
   BACK TO DASHBOARD
========================================================= */

function returnToDashboard() {
    navigateTo(ROUTES.MAIN_DASHBOARD);
}

/* =========================================================
   SHOW LOADING STATE
========================================================= */

function showLoadingState() {
    showElement(freelancerLoadingState);
    hideElement(freelancerGrid);
    hideElement(freelancerEmptyState);
}

/* =========================================================
   HIDE LOADING STATE
========================================================= */

function hideLoadingState() {
    hideElement(freelancerLoadingState);
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    freelancerSearch?.addEventListener("input", filterFreelancers);

    departmentFilter?.addEventListener("change", filterFreelancers);

    availabilityFilter?.addEventListener("change", filterFreelancers);

    clearFiltersButton?.addEventListener("click", clearFilters);

    emptyStateClearButton?.addEventListener("click", clearFilters);

    backToDashboardButton?.addEventListener("click", returnToDashboard);

}

/* =========================================================
   INITIALIZE EXPLORE PAGE
========================================================= */

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

/* =========================================================
   AUTHENTICATED PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeAuthenticatedPage(initializeExplorePage);
});