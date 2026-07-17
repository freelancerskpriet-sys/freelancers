/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Service Requests Logic
   File: js/admin/requests.js
========================================================= */

import {
    requireSupabaseClient
} from "../config/supabase.js";

import {
    cleanText,
    getInitials,
    setText,
    showElement,
    hideElement
} from "../utils/helpers.js";

import {
    ROUTES,
    navigateTo
} from "../utils/navigation.js";

import {
    initializeAdministratorPage
} from "./admin-guard.js";

/* =========================================================
   ADMIN REQUEST CONFIGURATION
========================================================= */

const ADMIN_REQUEST_CONFIG = Object.freeze({

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
   DOM REFERENCES
========================================================= */

const navbarUserName = document.getElementById("navbarUserName");
const navbarUserRole = document.getElementById("navbarUserRole");
const navbarUserAvatar = document.getElementById("navbarUserAvatar");

const backToAdminDashboardButton = document.getElementById("backToAdminDashboardButton");

const totalRequestsCount = document.getElementById("totalRequestsCount");
const underReviewCount = document.getElementById("underReviewCount");
const approvedRequestsCount = document.getElementById("approvedRequestsCount");
const rejectedRequestsCount = document.getElementById("rejectedRequestsCount");

const requestSearchInput = document.getElementById("requestSearchInput");
const requestStatusFilter = document.getElementById("requestStatusFilter");
const requestCategoryFilter = document.getElementById("requestCategoryFilter");
const requestSortSelect = document.getElementById("requestSortSelect");

const requestResultCount = document.getElementById("requestResultCount");

const clearRequestFiltersButton = document.getElementById("clearRequestFiltersButton");

const requestLoadingState = document.getElementById("requestLoadingState");
const adminRequestList = document.getElementById("adminRequestList");
const requestEmptyState = document.getElementById("requestEmptyState");
const requestNoResultState = document.getElementById("requestNoResultState");
const requestErrorState = document.getElementById("requestErrorState");
const requestErrorMessage = document.getElementById("requestErrorMessage");

const resetRequestFiltersButton = document.getElementById("resetRequestFiltersButton");
const retryRequestLoadButton = document.getElementById("retryRequestLoadButton");

/* =========================================================
   ADMIN REQUEST STATE
========================================================= */

let currentAdmin = null;

let serviceRequests = [];

let visibleRequests = [];

/* =========================================================
   NORMALIZE NUMBER
========================================================= */

function normalizeNumber(value) {

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : 0;

}

/* =========================================================
   NORMALIZE REQUEST STATUS
========================================================= */

function normalizeRequestStatus(status) {

    const normalizedStatus = cleanText(status)
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
   NORMALIZE SERVICE REQUEST
========================================================= */

function normalizeServiceRequest(request) {

    if (!request) {
        return null;
    }

    return {

        id: cleanText(request.id),

        title: cleanText(request.title) || "Untitled Service Request",

        category: cleanText(request.service_category) || "General Service",

        description: cleanText(request.description),

        budget: normalizeNumber(request.budget),

        deadline: request.deadline ?? null,

        status: normalizeRequestStatus(request.status),

        databaseStatus: cleanText(request.status).toLowerCase(),

        clientId: cleanText(request.client_id),

        createdAt: request.created_at ?? null

    };

}

/* =========================================================
   POPULATE ADMIN NAVBAR
========================================================= */

function populateAdminNavbar(administrator) {

    const administratorName = cleanText(administrator?.full_name) || "Platform Administrator";

    setText(navbarUserName, administratorName);
    setText(navbarUserRole, "PLATFORM ADMINISTRATOR");
    setText(navbarUserAvatar, getInitials(administratorName));

}

/* =========================================================
   GET SERVICE REQUESTS
========================================================= */

async function getServiceRequests() {

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("service_requests")
        .select(ADMIN_REQUEST_CONFIG.REQUEST_COLUMNS)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return (data ?? [])
        .map(normalizeServiceRequest)
        .filter(Boolean);

}

/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(normalizeNumber(value));

}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "Not specified";
    }

    const date = new Date(value);

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
   FORMAT REQUEST STATUS
========================================================= */

function formatRequestStatus(status) {

    const statusLabels = {
        under_review: "Under Review",
        approved: "Approved",
        matching: "Freelancer Matching",
        assigned: "Assigned",
        active: "Active",
        completed: "Completed",
        rejected: "Rejected"
    };

    return statusLabels[normalizeRequestStatus(status)] || "Under Review";

}

/* =========================================================
   RENDER REQUEST OVERVIEW
========================================================= */

function renderRequestOverview() {

    const totalRequests = serviceRequests.length;

    const underReviewRequests = serviceRequests.filter((request) => {
        return request.status === "under_review";
    }).length;

    const approvedRequests = serviceRequests.filter((request) => {
        return request.status === "approved";
    }).length;

    const rejectedRequests = serviceRequests.filter((request) => {
        return request.status === "rejected";
    }).length;

    setText(totalRequestsCount, String(totalRequests));
    setText(underReviewCount, String(underReviewRequests));
    setText(approvedRequestsCount, String(approvedRequests));
    setText(rejectedRequestsCount, String(rejectedRequests));

}

/* =========================================================
   POPULATE CATEGORY FILTER
========================================================= */

function populateCategoryFilter() {

    if (!requestCategoryFilter) {
        return;
    }

    const currentValue = requestCategoryFilter.value;

    const categories = [
        ...new Set(
            serviceRequests
                .map((request) => cleanText(request.category))
                .filter(Boolean)
        )
    ].sort((firstCategory, secondCategory) => {
        return firstCategory.localeCompare(secondCategory);
    });

    requestCategoryFilter.replaceChildren();

    const allCategoriesOption = document.createElement("option");
    allCategoriesOption.value = "all";

    setText(allCategoriesOption, "All Categories");

    requestCategoryFilter.appendChild(allCategoriesOption);

    categories.forEach((category) => {

        const option = document.createElement("option");
        option.value = category;

        setText(option, category);

        requestCategoryFilter.appendChild(option);

    });

    const optionExists = Array.from(requestCategoryFilter.options).some((option) => {
        return option.value === currentValue;
    });

    requestCategoryFilter.value = optionExists ? currentValue : "all";

}

/* =========================================================
   GET SEARCH VALUE
========================================================= */

function getSearchValue() {
    return cleanText(requestSearchInput?.value).toLowerCase();
}

/* =========================================================
   GET STATUS FILTER
========================================================= */

function getStatusFilter() {
    return requestStatusFilter?.value || "all";
}

/* =========================================================
   GET CATEGORY FILTER
========================================================= */

function getCategoryFilter() {
    return requestCategoryFilter?.value || "all";
}

/* =========================================================
   GET SORT VALUE
========================================================= */

function getSortValue() {
    return requestSortSelect?.value || "newest";
}

/* =========================================================
   FILTER REQUESTS
========================================================= */

function filterRequests(requests) {

    const searchValue = getSearchValue();

    const statusFilter = getStatusFilter();

    const categoryFilter = getCategoryFilter();

    return requests.filter((request) => {

        const searchableText = [
            request.id,
            request.title,
            request.category,
            request.description
        ].join(" ").toLowerCase();

        const matchesSearch = !searchValue || searchableText.includes(searchValue);

        const matchesStatus = statusFilter === "all" || request.status === statusFilter;

        const matchesCategory = categoryFilter === "all" || request.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;

    });

}

/* =========================================================
   GET DATE TIME
========================================================= */

function getDateTime(value, fallback) {

    if (!value) {
        return fallback;
    }

    const date = new Date(value);

    const time = date.getTime();

    return Number.isNaN(time) ? fallback : time;

}

/* =========================================================
   SORT REQUESTS
========================================================= */

function sortRequests(requests) {

    const sortValue = getSortValue();

    const sortedRequests = [...requests];

    sortedRequests.sort((firstRequest, secondRequest) => {

        switch (sortValue) {

            case "oldest":
                return getDateTime(firstRequest.createdAt, 0) - getDateTime(secondRequest.createdAt, 0);

            case "budget_high":
                return secondRequest.budget - firstRequest.budget;

            case "budget_low":
                return firstRequest.budget - secondRequest.budget;

            case "deadline":
                return (
                    getDateTime(firstRequest.deadline, Number.MAX_SAFE_INTEGER) -
                    getDateTime(secondRequest.deadline, Number.MAX_SAFE_INTEGER)
                );

            case "newest":
            default:
                return getDateTime(secondRequest.createdAt, 0) - getDateTime(firstRequest.createdAt, 0);

        }

    });

    return sortedRequests;

}

/* =========================================================
   UPDATE RESULT COUNT
========================================================= */

function updateResultCount(count) {

    const numericCount = Number(count);

    const safeCount = Number.isFinite(numericCount) ? numericCount : 0;

    setText(
        requestResultCount,
        `${safeCount} ${safeCount === 1 ? "request" : "requests"} found`
    );

}

/* =========================================================
   CREATE META ITEM
========================================================= */

function createMetaItem(labelText, valueText) {

    const item = document.createElement("div");
    item.className = "admin-request-meta-item";

    const label = document.createElement("span");
    setText(label, labelText);

    const value = document.createElement("strong");
    setText(value, valueText);

    item.append(label, value);

    return item;

}

/* =========================================================
   CREATE REQUEST CARD
========================================================= */

function createRequestCard(request) {

    const card = document.createElement("article");
    card.className = "admin-request-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open request ${request.title}`);

    const header = document.createElement("div");
    header.className = "admin-request-card-header";

    const titleContent = document.createElement("div");
    titleContent.className = "admin-request-card-title-content";

    const category = document.createElement("span");
    category.className = "admin-request-category";
    setText(category, request.category);

    const title = document.createElement("h3");
    title.className = "admin-request-title";
    setText(title, request.title);

    titleContent.append(category, title);

    const status = document.createElement("span");
    status.className = `admin-request-status ${request.status}`;
    setText(status, formatRequestStatus(request.status));

    header.append(titleContent, status);

    const description = document.createElement("p");
    description.className = "admin-request-description";
    setText(description, request.description || "No service request description was provided.");

    const meta = document.createElement("div");
    meta.className = "admin-request-meta";

    meta.append(
        createMetaItem("REQUEST ID", request.id || "Not available"),
        createMetaItem("BUDGET", formatCurrency(request.budget)),
        createMetaItem("DEADLINE", formatDate(request.deadline)),
        createMetaItem("SUBMITTED", formatDate(request.createdAt))
    );

    const action = document.createElement("span");
    action.className = "admin-request-action";

    setText(
        action,
        request.status === "under_review" ? "Review Request →" : "View Request →"
    );

    card.append(header, description, meta, action);

    const openRequest = () => {
        navigateTo(ROUTES.ADMIN_REQUEST_REVIEW, { request: request.id });
    };

    card.addEventListener("click", openRequest);

    card.addEventListener("keydown", (event) => {

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openRequest();
        }

    });

    return card;

}

/* =========================================================
   HIDE ALL REQUEST STATES
========================================================= */

function hideAllRequestStates() {

    hideElement(requestLoadingState);
    hideElement(adminRequestList);
    hideElement(requestEmptyState);
    hideElement(requestNoResultState);
    hideElement(requestErrorState);

}

/* =========================================================
   RENDER REQUEST LIST
========================================================= */

function renderRequestList(requests) {

    hideAllRequestStates();

    adminRequestList?.replaceChildren();

    updateResultCount(requests.length);

    if (serviceRequests.length === 0) {
        showElement(requestEmptyState);
        return;
    }

    if (requests.length === 0) {
        showElement(requestNoResultState);
        return;
    }

    const fragment = document.createDocumentFragment();

    requests.forEach((request) => {
        fragment.appendChild(createRequestCard(request));
    });

    adminRequestList?.appendChild(fragment);

    showElement(adminRequestList);

}

/* =========================================================
   APPLY REQUEST FILTERS
========================================================= */

function applyRequestFilters() {

    const filteredRequests = filterRequests(serviceRequests);

    visibleRequests = sortRequests(filteredRequests);

    renderRequestList(visibleRequests);

}

/* =========================================================
   RESET REQUEST FILTERS
========================================================= */

function resetRequestFilters() {

    if (requestSearchInput) {
        requestSearchInput.value = "";
    }

    if (requestStatusFilter) {
        requestStatusFilter.value = "all";
    }

    if (requestCategoryFilter) {
        requestCategoryFilter.value = "all";
    }

    if (requestSortSelect) {
        requestSortSelect.value = "newest";
    }

    applyRequestFilters();

}

/* =========================================================
   RENDER REQUEST ERROR
========================================================= */

function renderRequestError(error) {

    hideAllRequestStates();

    const message =
        cleanText(error?.message) ||
        "An unexpected error occurred while loading platform service requests.";

    setText(requestErrorMessage, message);

    updateResultCount(0);

    showElement(requestErrorState);

}

/* =========================================================
   LOAD SERVICE REQUESTS
========================================================= */

async function loadServiceRequests() {

    hideAllRequestStates();

    showElement(requestLoadingState);

    try {

        serviceRequests = await getServiceRequests();

        visibleRequests = [];

        renderRequestOverview();

        populateCategoryFilter();

        applyRequestFilters();

    } catch (error) {

        console.error("Admin service request loading error:", error);

        serviceRequests = [];
        visibleRequests = [];

        renderRequestOverview();

        populateCategoryFilter();

        renderRequestError(error);

    }

}

/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    backToAdminDashboardButton?.addEventListener("click", () => {
        navigateTo(ROUTES.ADMIN_DASHBOARD);
    });

    requestSearchInput?.addEventListener("input", applyRequestFilters);

    requestStatusFilter?.addEventListener("change", applyRequestFilters);

    requestCategoryFilter?.addEventListener("change", applyRequestFilters);

    requestSortSelect?.addEventListener("change", applyRequestFilters);

    clearRequestFiltersButton?.addEventListener("click", resetRequestFilters);

    resetRequestFiltersButton?.addEventListener("click", resetRequestFilters);

    retryRequestLoadButton?.addEventListener("click", loadServiceRequests);

}

/* =========================================================
   INITIALIZE ADMIN REQUEST PAGE
========================================================= */

async function initializeAdminRequestPage(administratorProfile) {

    try {

        currentAdmin = administratorProfile;

        populateAdminNavbar(currentAdmin);

        initializeEventListeners();

        await loadServiceRequests();

    } catch (error) {

        console.error("Admin request page initialization error:", error);

        serviceRequests = [];
        visibleRequests = [];

        renderRequestOverview();

        renderRequestError(error);

    }

}

/* =========================================================
   ADMINISTRATOR PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeAdministratorPage(initializeAdminRequestPage);
});