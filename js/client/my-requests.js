/* =========================================================
   KPRIET FREELANCER PLATFORM
   Client My Requests Logic
   File: js/client/my-requests.js
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
   CONFIGURATION
========================================================= */

const MY_REQUESTS_CONFIG = Object.freeze({

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

    REQUEST_COLUMNS: `
        id,
        client_id,
        title,
        service_category,
        description,
        required_skills,
        budget,
        deadline,
        status,
        admin_review_note,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at
    `

});

/* =========================================================
   DOM ELEMENTS
========================================================= */

/* ---------------------------------------------------------
   NAVBAR
--------------------------------------------------------- */

const navbarUserName = document.getElementById("navbarUserName");
const navbarUserRole = document.getElementById("navbarUserRole");
const navbarUserAvatar = document.getElementById("navbarUserAvatar");

/* ---------------------------------------------------------
   PAGE ACTIONS
--------------------------------------------------------- */

const backToClientDashboardButton = document.getElementById("backToClientDashboardButton");
const createNewRequestButton = document.getElementById("createNewRequestButton");

/* ---------------------------------------------------------
   REQUEST SUMMARY
--------------------------------------------------------- */

const totalRequestsCount = document.getElementById("totalRequestsCount");
const underReviewRequestsCount = document.getElementById("underReviewRequestsCount");
const matchingRequestsCount = document.getElementById("matchingRequestsCount");
const activeRequestsCount = document.getElementById("activeRequestsCount");

/* ---------------------------------------------------------
   FILTERS
--------------------------------------------------------- */

const requestSearchInput = document.getElementById("requestSearchInput");
const requestStatusFilter = document.getElementById("requestStatusFilter");
const requestCategoryFilter = document.getElementById("requestCategoryFilter");

/* ---------------------------------------------------------
   REQUEST LIST
--------------------------------------------------------- */

const requestResultCount = document.getElementById("requestResultCount");
const requestsLoadingState = document.getElementById("requestsLoadingState");
const requestsList = document.getElementById("requestsList");
const noRequestResultsState = document.getElementById("noRequestResultsState");
const emptyRequestsState = document.getElementById("emptyRequestsState");
const clearRequestFiltersButton = document.getElementById("clearRequestFiltersButton");
const emptyCreateRequestButton = document.getElementById("emptyCreateRequestButton");

/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let currentRequests = [];

let filteredRequests = [];

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
        .select(MY_REQUESTS_CONFIG.PROFILE_COLUMNS)
        .eq("id", authenticatedUser.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;

}

/* =========================================================
   NORMALIZE REQUEST STATUS
========================================================= */

function normalizeRequestStatus(requestStatus) {

    const normalizedStatus = cleanText(requestStatus)
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const statusMap = {
        pending: "under_review",
        under_review: "under_review",
        approved: "approved",
        matching: "matching",
        freelancer_matching: "matching",
        assigned: "assigned",
        matched: "assigned",
        freelancer_assigned: "assigned",
        active: "active",
        active_work: "active",
        in_progress: "active",
        completed: "completed",
        rejected: "rejected"
    };

    return statusMap[normalizedStatus] || normalizedStatus || "under_review";

}

/* =========================================================
   NORMALIZE CLIENT REQUEST
========================================================= */

function normalizeClientRequest(request) {

    if (!request) {
        return null;
    }

    return {

        id: cleanText(request.id),

        clientId: cleanText(request.client_id),

        title: cleanText(request.title) || "Service Request",

        category: cleanText(request.service_category) || "Campus Service",

        description: cleanText(request.description),

        budget: Number(request.budget),

        deadline: request.deadline ?? null,

        status: normalizeRequestStatus(request.status),

        createdAt: request.created_at ?? null,

        updatedAt: request.updated_at ?? null

    };

}

/* =========================================================
   GET CLIENT REQUESTS
========================================================= */

async function getClientRequests(clientId) {

    const safeClientId = cleanText(clientId);

    if (!safeClientId) {
        return [];
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("service_requests")
        .select(MY_REQUESTS_CONFIG.REQUEST_COLUMNS)
        .eq("client_id", safeClientId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return (data ?? [])
        .map(normalizeClientRequest)
        .filter(Boolean);

}

/* =========================================================
   APPLY BACKGROUND PHOTO
========================================================= */

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

/* =========================================================
   POPULATE NAVBAR
========================================================= */

function populateNavbar(user) {

    if (!user) {
        return;
    }

    const fullName = cleanText(user.full_name) || "Campus User";

    setText(navbarUserName, fullName);
    setText(navbarUserRole, createNavbarRole(user) || "KPRIET USER");
    setText(navbarUserAvatar, getInitials(fullName));

    applyBackgroundPhoto(navbarUserAvatar, user.profile_photo_url);

}

/* =========================================================
   FORMAT REQUEST STATUS
========================================================= */

function formatRequestStatus(requestStatus) {

    const status = normalizeRequestStatus(requestStatus);

    const statusLabels = {
        under_review: "Under Review",
        approved: "Approved",
        matching: "Freelancer Matching",
        assigned: "Freelancer Assigned",
        active: "Active Work",
        completed: "Completed",
        rejected: "Rejected"
    };

    return statusLabels[status] || "Submitted";

}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "Not specified";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not specified";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);

}

/* =========================================================
   FORMAT BUDGET
========================================================= */

function formatBudget(budgetValue) {

    const numericBudget = Number(budgetValue);

    if (!Number.isFinite(numericBudget) || numericBudget < 0) {
        return "Not specified";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(numericBudget);

}

/* =========================================================
   CREATE DESCRIPTION PREVIEW
========================================================= */

function createDescriptionPreview(descriptionValue, maximumLength = 170) {

    const safeDescription = cleanText(descriptionValue);

    if (!safeDescription) {
        return "Service request description unavailable.";
    }

    if (safeDescription.length <= maximumLength) {
        return safeDescription;
    }

    return safeDescription.slice(0, maximumLength).trimEnd() + "...";

}

/* =========================================================
   GET DATE TIME
========================================================= */

function getDateTime(value) {

    if (!value) {
        return 0;
    }

    const date = new Date(value);

    const time = date.getTime();

    return Number.isNaN(time) ? 0 : time;

}

/* =========================================================
   SORT REQUESTS
========================================================= */

function sortRequestsByCreatedDate(requests) {

    const safeRequests = Array.isArray(requests) ? requests : [];

    return [...safeRequests].sort((firstRequest, secondRequest) => {
        return getDateTime(secondRequest.createdAt) - getDateTime(firstRequest.createdAt);
    });

}

/* =========================================================
   CALCULATE REQUEST SUMMARY
========================================================= */

function calculateRequestSummary() {

    return {

        total: currentRequests.length,

        underReview: currentRequests.filter((request) => {
            return request.status === "under_review";
        }).length,

        matching: currentRequests.filter((request) => {
            return request.status === "matching";
        }).length,

        active: currentRequests.filter((request) => {
            return request.status === "active";
        }).length

    };

}

/* =========================================================
   RENDER REQUEST SUMMARY
========================================================= */

function renderRequestSummary() {

    const summary = calculateRequestSummary();

    setText(totalRequestsCount, String(summary.total));
    setText(underReviewRequestsCount, String(summary.underReview));
    setText(matchingRequestsCount, String(summary.matching));
    setText(activeRequestsCount, String(summary.active));

}

/* =========================================================
   RESET CATEGORY FILTER
========================================================= */

function resetCategoryFilter() {

    if (!requestCategoryFilter) {
        return;
    }

    requestCategoryFilter.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "all";

    setText(defaultOption, "All Categories");

    requestCategoryFilter.appendChild(defaultOption);

}

/* =========================================================
   POPULATE CATEGORY FILTER
========================================================= */

function populateCategoryFilter() {

    if (!requestCategoryFilter) {
        return;
    }

    resetCategoryFilter();

    const categories = [
        ...new Set(
            currentRequests
                .map((request) => cleanText(request.category))
                .filter(Boolean)
        )
    ].sort((firstCategory, secondCategory) => {
        return firstCategory.localeCompare(secondCategory);
    });

    categories.forEach((category) => {

        const option = document.createElement("option");
        option.value = category;

        setText(option, category);

        requestCategoryFilter.appendChild(option);

    });

}

/* =========================================================
   CREATE REQUEST META ITEM
========================================================= */

function createRequestMetaItem(label, value) {

    const item = document.createElement("div");
    item.className = "client-request-meta-item";

    const labelElement = document.createElement("span");
    setText(labelElement, label);

    const valueElement = document.createElement("strong");
    setText(valueElement, value);

    item.append(labelElement, valueElement);

    return item;

}

/* =========================================================
   OPEN REQUEST DETAILS
========================================================= */

function openRequestDetails(requestId) {

    const safeRequestId = cleanText(requestId);

    if (!safeRequestId) {
        console.warn("Service request identifier is unavailable.");
        return;
    }

    navigateTo(ROUTES.REQUEST_DETAILS, { request: safeRequestId });

}

/* =========================================================
   CREATE REQUEST CARD
========================================================= */

function createRequestCard(request) {

    const card = document.createElement("article");
    card.className = "client-request-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View ${request.title}`);

    /* -----------------------------------------------------
       HEADER
    ----------------------------------------------------- */

    const header = document.createElement("div");
    header.className = "client-request-card-header";

    const headingContent = document.createElement("div");

    const category = document.createElement("span");
    category.className = "client-request-category";
    setText(category, request.category);

    const title = document.createElement("h3");
    title.className = "client-request-title";
    setText(title, request.title);

    headingContent.append(category, title);

    const status = document.createElement("span");
    status.className = `client-request-status ${request.status}`;
    setText(status, formatRequestStatus(request.status));

    header.append(headingContent, status);

    /* -----------------------------------------------------
       DESCRIPTION
    ----------------------------------------------------- */

    const descriptionElement = document.createElement("p");
    descriptionElement.className = "client-request-description";
    setText(descriptionElement, createDescriptionPreview(request.description));

    /* -----------------------------------------------------
       META
    ----------------------------------------------------- */

    const meta = document.createElement("div");
    meta.className = "client-request-meta";

    meta.append(
        createRequestMetaItem("BUDGET", formatBudget(request.budget)),
        createRequestMetaItem("DEADLINE", formatDate(request.deadline)),
        createRequestMetaItem("SUBMITTED", formatDate(request.createdAt))
    );

    /* -----------------------------------------------------
       ACTION
    ----------------------------------------------------- */

    const action = document.createElement("span");
    action.className = "client-request-action";
    setText(action, "View Request →");

    card.append(header, descriptionElement, meta, action);

    const openRequest = () => {
        openRequestDetails(request.id);
    };

    card.addEventListener("click", openRequest);

    card.addEventListener("keydown", (event) => {

        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        openRequest();

    });

    return card;

}

/* =========================================================
   GET FILTER VALUES
========================================================= */

function getFilterValues() {

    return {

        search: cleanText(requestSearchInput?.value).toLowerCase(),

        status: normalizeFilterStatus(requestStatusFilter?.value),

        category: cleanText(requestCategoryFilter?.value) || "all"

    };

}

/* =========================================================
   NORMALIZE FILTER STATUS
========================================================= */

function normalizeFilterStatus(statusValue) {

    const safeStatus = cleanText(statusValue);

    if (!safeStatus || safeStatus.toLowerCase() === "all") {
        return "all";
    }

    return normalizeRequestStatus(safeStatus);

}

/* =========================================================
   FILTER REQUESTS
========================================================= */

function filterRequests() {

    const filters = getFilterValues();

    filteredRequests = currentRequests.filter((request) => {

        const title = request.title.toLowerCase();

        const category = request.category;

        const normalizedCategory = category.toLowerCase();

        const description = request.description.toLowerCase();

        const matchesSearch =
            !filters.search ||
            title.includes(filters.search) ||
            normalizedCategory.includes(filters.search) ||
            description.includes(filters.search);

        const matchesStatus =
            filters.status === "all" ||
            request.status === filters.status;

        const matchesCategory =
            filters.category === "all" ||
            category === filters.category;

        return matchesSearch && matchesStatus && matchesCategory;

    });

    filteredRequests = sortRequestsByCreatedDate(filteredRequests);

}

/* =========================================================
   UPDATE RESULT COUNT
========================================================= */

function updateResultCount() {

    const requestCount = filteredRequests.length;

    setText(
        requestResultCount,
        `${requestCount} ${requestCount === 1 ? "request" : "requests"} found.`
    );

}

/* =========================================================
   RENDER REQUESTS
========================================================= */

function renderRequests() {

    if (!requestsList) {
        return;
    }

    hideElement(requestsLoadingState);

    requestsList.replaceChildren();

    if (currentRequests.length === 0) {

        filteredRequests = [];

        updateResultCount();

        hideElement(requestsList);
        hideElement(noRequestResultsState);
        showElement(emptyRequestsState);

        return;

    }

    hideElement(emptyRequestsState);

    filterRequests();

    updateResultCount();

    if (filteredRequests.length === 0) {
        hideElement(requestsList);
        showElement(noRequestResultsState);
        return;
    }

    hideElement(noRequestResultsState);
    showElement(requestsList);

    const fragment = document.createDocumentFragment();

    filteredRequests.forEach((request) => {
        fragment.appendChild(createRequestCard(request));
    });

    requestsList.appendChild(fragment);

}

/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearRequestFilters() {

    if (requestSearchInput) {
        requestSearchInput.value = "";
    }

    if (requestStatusFilter) {
        requestStatusFilter.value = "all";
    }

    if (requestCategoryFilter) {
        requestCategoryFilter.value = "all";
    }

    renderRequests();

}

/* =========================================================
   NAVIGATION
========================================================= */

function openClientDashboard() {
    navigateTo(ROUTES.CLIENT_DASHBOARD);
}

function openCreateRequest() {
    navigateTo(ROUTES.CREATE_REQUEST);
}

/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    backToClientDashboardButton?.addEventListener("click", openClientDashboard);

    createNewRequestButton?.addEventListener("click", openCreateRequest);

    emptyCreateRequestButton?.addEventListener("click", openCreateRequest);

    clearRequestFiltersButton?.addEventListener("click", clearRequestFilters);

    requestSearchInput?.addEventListener("input", renderRequests);

    requestStatusFilter?.addEventListener("change", renderRequests);

    requestCategoryFilter?.addEventListener("change", renderRequests);

}

/* =========================================================
   INITIALIZE MY REQUESTS PAGE
========================================================= */

async function initializeMyRequestsPage(authenticatedUser) {

    initializeEventListeners();

    try {

        currentUser = await getCurrentUserProfile(authenticatedUser);

        if (!currentUser) {
            navigateTo(ROUTES.PROFILE_SETUP);
            return;
        }

        populateNavbar(currentUser);

        currentRequests = await getClientRequests(currentUser.id);

        currentRequests = sortRequestsByCreatedDate(currentRequests);

        filteredRequests = [...currentRequests];

        renderRequestSummary();

        populateCategoryFilter();

        renderRequests();

    } catch (error) {

        console.error("My requests initialization error:", error);

        currentRequests = [];
        filteredRequests = [];

        renderRequestSummary();

        populateCategoryFilter();

        hideElement(requestsLoadingState);

        updateResultCount();

        hideElement(requestsList);
        hideElement(noRequestResultsState);
        showElement(emptyRequestsState);

    }

}

/* =========================================================
   AUTHENTICATED PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeAuthenticatedPage(initializeMyRequestsPage);
});