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

const PROFILE_CONFIG = Object.freeze({
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
    FREELANCER_COLUMNS: `
        id,
        user_id,
        professional_title,
        bio,
        skills,
        services,
        availability_status,
        approval_status,
        rejection_reason,
        created_at,
        updated_at,
        profiles!freelancer_profiles_user_id_fkey (
            id,
            full_name,
            campus_role,
            department,
            programme,
            academic_year,
            section,
            profile_photo_url
        )
    `
});

const navbarUserName = document.getElementById("navbarUserName");
const navbarUserRole = document.getElementById("navbarUserRole");
const navbarUserAvatar = document.getElementById("navbarUserAvatar");

const errorBackToExploreButton = document.getElementById("errorBackToExploreButton");

const profileLoadingState = document.getElementById("profileLoadingState");
const freelancerProfileContent = document.getElementById("freelancerProfileContent");
const profileErrorState = document.getElementById("profileErrorState");
const profileErrorMessage = document.getElementById("profileErrorMessage");

const freelancerProfileAvatar = document.getElementById("freelancerProfileAvatar");
const freelancerAvailability = document.getElementById("freelancerAvailability");
const freelancerFullName = document.getElementById("freelancerFullName");
const freelancerProfessionalTitle = document.getElementById("freelancerProfessionalTitle");
const freelancerCampusInformation = document.getElementById("freelancerCampusInformation");

const freelancerBio = document.getElementById("freelancerBio");
const freelancerSkills = document.getElementById("freelancerSkills");
const freelancerServices = document.getElementById("freelancerServices");

const freelancerDepartment = document.getElementById("freelancerDepartment");
const freelancerAcademicYear = document.getElementById("freelancerAcademicYear");
const freelancerSection = document.getElementById("freelancerSection");
const freelancerAvailabilityValue = document.getElementById("freelancerAvailabilityValue");

let currentUser = null;
let currentFreelancer = null;
let currentFreelancerId = "";
let eventListenersInitialized = false;

function getFreelancerIdFromUrl() {
    const urlParameters = new URLSearchParams(window.location.search);
    return cleanText(urlParameters.get("id"));
}

async function getCurrentUserProfile(authenticatedUser) {
    if (!authenticatedUser?.id) {
        return null;
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("profiles")
        .select(PROFILE_CONFIG.PROFILE_COLUMNS)
        .eq("id", authenticatedUser.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;
}

function normalizeStringArray(values) {
    if (!Array.isArray(values)) {
        return [];
    }

    return [
        ...new Set(
            values
                .map((value) => cleanText(value))
                .filter(Boolean)
        )
    ];
}

function normalizeFreelancerProfile(freelancerProfile) {
    if (!freelancerProfile) {
        return null;
    }

    const relatedProfile = Array.isArray(freelancerProfile.profiles)
        ? freelancerProfile.profiles[0]
        : freelancerProfile.profiles;

    const campusProfile = relatedProfile ?? {};

    return {
        id: cleanText(freelancerProfile.id),
        user_id: cleanText(freelancerProfile.user_id),
        full_name: cleanText(campusProfile.full_name),
        campus_role: cleanText(campusProfile.campus_role),
        department: cleanText(campusProfile.department),
        programme: cleanText(campusProfile.programme),
        academic_year: cleanText(campusProfile.academic_year),
        section: cleanText(campusProfile.section),
        profile_photo_url: cleanText(campusProfile.profile_photo_url),
        professional_title: cleanText(freelancerProfile.professional_title),
        bio: cleanText(freelancerProfile.bio),
        skills: normalizeStringArray(freelancerProfile.skills),
        services: Array.isArray(freelancerProfile.services) ? freelancerProfile.services : [],
        availability_status: cleanText(freelancerProfile.availability_status).toLowerCase(),
        approval_status: cleanText(freelancerProfile.approval_status).toLowerCase(),
        rejection_reason: cleanText(freelancerProfile.rejection_reason),
        created_at: freelancerProfile.created_at ?? null,
        updated_at: freelancerProfile.updated_at ?? null
    };
}

async function getFreelancerProfile(freelancerId) {
    const safeFreelancerId = cleanText(freelancerId);

    if (!safeFreelancerId) {
        return null;
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("freelancer_profiles")
        .select(PROFILE_CONFIG.FREELANCER_COLUMNS)
        .eq("id", safeFreelancerId)
        .eq("approval_status", "approved")
        .maybeSingle();

    if (error) {
        throw error;
    }

    return normalizeFreelancerProfile(data);
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

    applyBackgroundPhoto(navbarUserAvatar, user.profile_photo_url);
}

function applyBackgroundPhoto(element, profilePhotoUrl) {
    if (!element) {
        return;
    }

    const photoUrl = cleanText(profilePhotoUrl);

    element.style.backgroundImage = "";
    element.style.backgroundSize = "";
    element.style.backgroundPosition = "";
    element.style.backgroundRepeat = "";

    if (!photoUrl) {
        return;
    }

    try {
        const parsedUrl = new URL(photoUrl);

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return;
        }

        element.style.backgroundImage = `url("${parsedUrl.href}")`;
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
        element.style.backgroundRepeat = "no-repeat";
        element.textContent = "";
    } catch (error) {
        console.warn("Invalid profile photo URL:", error);
    }
}

function normalizeAvailability(availabilityStatus) {
    const availability = cleanText(availabilityStatus).toLowerCase();

    if (availability === "available") {
        return "available";
    }

    return "busy";
}

function formatAvailability(availabilityStatus) {
    return normalizeAvailability(availabilityStatus) === "available"
        ? "Available"
        : "Busy";
}

function createCampusInformation(freelancer) {
    if (!freelancer) {
        return "KPRIET Freelancer";
    }

    const information = [
        cleanText(freelancer.department),
        freelancer.academic_year ? `Year ${cleanText(freelancer.academic_year)}` : "",
        freelancer.section ? `Section ${cleanText(freelancer.section)}` : ""
    ].filter(Boolean);

    return information.join(" · ") || "KPRIET Freelancer";
}

function createTextElement(tagName, className, text) {
    const safeTagName = cleanText(tagName) || "span";
    const element = document.createElement(safeTagName);
    element.className = cleanText(className);
    element.textContent = cleanText(text);
    return element;
}

function renderSkills(skillValues) {
    if (!freelancerSkills) {
        return;
    }

    freelancerSkills.replaceChildren();

    const normalizedSkills = normalizeStringArray(skillValues);

    if (normalizedSkills.length === 0) {
        const emptySkill = createTextElement("span", "freelancer-profile-skill", "Skills not listed");
        freelancerSkills.appendChild(emptySkill);
        return;
    }

    const fragment = document.createDocumentFragment();

    normalizedSkills.forEach((skill) => {
        const skillElement = createTextElement("span", "freelancer-profile-skill", skill);
        fragment.appendChild(skillElement);
    });

    freelancerSkills.appendChild(fragment);
}

function normalizeService(service) {
    if (typeof service === "string") {
        return {
            title: cleanText(service),
            description: "Professional service available through the KPRIET Freelancer Platform."
        };
    }

    if (service && typeof service === "object" && !Array.isArray(service)) {
        return {
            title: cleanText(service.title),
            description: cleanText(service.description)
        };
    }

    return {
        title: "",
        description: ""
    };
}

function normalizeServices(serviceValues) {
    if (!Array.isArray(serviceValues)) {
        return [];
    }

    const normalizedServices = serviceValues
        .map(normalizeService)
        .filter((service) => Boolean(service.title));

    const uniqueServices = new Map();

    normalizedServices.forEach((service) => {
        const serviceKey = service.title.toLowerCase();

        if (uniqueServices.has(serviceKey)) {
            return;
        }

        uniqueServices.set(serviceKey, service);
    });

    return Array.from(uniqueServices.values());
}

function createServiceItem(service) {
    const serviceItem = document.createElement("div");
    serviceItem.className = "freelancer-service-item";

    const serviceTitle = createTextElement("h3", "freelancer-service-title", service.title);
    const serviceDescription = createTextElement(
        "p",
        "freelancer-service-description",
        service.description || "Professional service available through the KPRIET Freelancer Platform."
    );

    serviceItem.append(serviceTitle, serviceDescription);
    return serviceItem;
}

function renderServices(serviceValues) {
    if (!freelancerServices) {
        return;
    }

    freelancerServices.replaceChildren();

    const normalizedServices = normalizeServices(serviceValues);

    if (normalizedServices.length === 0) {
        const serviceItem = createServiceItem({
            title: "Services not listed",
            description: "This freelancer has not listed professional services yet."
        });
        freelancerServices.appendChild(serviceItem);
        return;
    }

    const fragment = document.createDocumentFragment();

    normalizedServices.forEach((service) => {
        fragment.appendChild(createServiceItem(service));
    });

    freelancerServices.appendChild(fragment);
}

function updateAvailabilityBadge(availabilityStatus) {
    if (!freelancerAvailability) {
        return;
    }

    const availability = normalizeAvailability(availabilityStatus);

    freelancerAvailability.classList.remove("available", "busy");
    freelancerAvailability.classList.add(availability);
    setText(freelancerAvailability, formatAvailability(availability));
}

function populateFreelancerProfile(freelancer) {
    if (!freelancer) {
        return;
    }

    const fullName = cleanText(freelancer.full_name) || "Freelancer";
    const professionalTitle = cleanText(freelancer.professional_title) || "Campus Freelancer";
    const bio = cleanText(freelancer.bio) || "Professional profile information is not available.";
    const availabilityText = formatAvailability(freelancer.availability_status);

    setText(freelancerProfileAvatar, getInitials(fullName));
    applyBackgroundPhoto(freelancerProfileAvatar, freelancer.profile_photo_url);
    updateAvailabilityBadge(freelancer.availability_status);

    setText(freelancerFullName, fullName);
    setText(freelancerProfessionalTitle, professionalTitle);
    setText(freelancerCampusInformation, createCampusInformation(freelancer));

    setText(freelancerBio, bio);

    setText(freelancerDepartment, cleanText(freelancer.department) || "—");
    setText(freelancerAcademicYear, cleanText(freelancer.academic_year) || "—");
    setText(freelancerSection, cleanText(freelancer.section) || "—");
    setText(freelancerAvailabilityValue, availabilityText);

    renderSkills(freelancer.skills);
    renderServices(freelancer.services);
}

function showLoadingState() {
    showElement(profileLoadingState);
    hideElement(freelancerProfileContent);
    hideElement(profileErrorState);
}

function showProfileContent() {
    hideElement(profileLoadingState);
    hideElement(profileErrorState);
    showElement(freelancerProfileContent);
}

function showProfileError(message) {
    hideElement(profileLoadingState);
    hideElement(freelancerProfileContent);
    showElement(profileErrorState);
    setText(
        profileErrorMessage,
        cleanText(message) || "The requested freelancer profile could not be found."
    );
}

function returnToExplore() {
    if (typeof ROUTES !== "undefined" && ROUTES.ADMIN_EXPLORE) {
        navigateTo(ROUTES.ADMIN_EXPLORE);
    } else {
        window.location.href = "http://127.0.0.1:5500/pages/admin/explore.html";
    }
}

function initializeEventListeners() {
    if (eventListenersInitialized) {
        return;
    }

    errorBackToExploreButton?.addEventListener("click", returnToExplore);
    eventListenersInitialized = true;
}

function resetProfileState() {
    currentUser = null;
    currentFreelancer = null;
    currentFreelancerId = "";
}

async function initializeFreelancerProfilePage(authenticatedUser) {
    initializeEventListeners();
    showLoadingState();
    resetProfileState();

    currentFreelancerId = getFreelancerIdFromUrl();

    if (!currentFreelancerId) {
        showProfileError("No freelancer profile was selected.");
        return false;
    }

    try {
        currentUser = await getCurrentUserProfile(authenticatedUser);

        if (currentUser) {
            populateNavbar(currentUser);
        }

        currentFreelancer = await getFreelancerProfile(currentFreelancerId);

        if (!currentFreelancer) {
            showProfileError("The requested freelancer profile could not be found or is not currently approved.");
            return false;
        }

        populateFreelancerProfile(currentFreelancer);
        showProfileContent();
        return true;
    } catch (error) {
        console.error("Freelancer profile initialization error:", error);
        currentFreelancer = null;
        showProfileError("Unable to load the freelancer profile. Please refresh the page and try again.");
        return false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializeAuthenticatedPage(initializeFreelancerProfilePage);
});
