/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Request Review Logic
   File: js/admin/request-review.js
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
   ADMIN REQUEST REVIEW CONFIGURATION
========================================================= */

const ADMIN_REQUEST_REVIEW_CONFIG = Object.freeze({

    REJECTION_REASON_MAX_LENGTH: 1000,

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
    `,

    CLIENT_COLUMNS: `
        id,
        full_name,
        email,
        department,
        year_of_study,
        register_number
    `

});

/* =========================================================
   DOM REFERENCES
========================================================= */

const navbarUserName = document.getElementById("navbarUserName");
const navbarUserRole = document.getElementById("navbarUserRole");
const navbarUserAvatar = document.getElementById("navbarUserAvatar");

const backToRequestsButton = document.getElementById("backToRequestsButton");

const requestReviewLoadingState = document.getElementById("requestReviewLoadingState");
const requestReviewNotFoundState = document.getElementById("requestReviewNotFoundState");
const requestReviewErrorState = document.getElementById("requestReviewErrorState");
const requestReviewErrorMessage = document.getElementById("requestReviewErrorMessage");

const retryRequestReviewButton = document.getElementById("retryRequestReviewButton");
const returnToRequestsButton = document.getElementById("returnToRequestsButton");

const requestReviewContent = document.getElementById("requestReviewContent");

const requestCategory = document.getElementById("requestCategory");
const requestTitle = document.getElementById("requestTitle");
const requestStatus = document.getElementById("requestStatus");
const requestDescription = document.getElementById("requestDescription");
const requestId = document.getElementById("requestId");
const requestBudget = document.getElementById("requestBudget");
const requestDeadline = document.getElementById("requestDeadline");
const requestSubmittedDate = document.getElementById("requestSubmittedDate");

const requestAdditionalNotesSection = document.getElementById("requestAdditionalNotesSection");
const requestAdditionalNotes = document.getElementById("requestAdditionalNotes");

const clientAvatar = document.getElementById("clientAvatar");
const clientName = document.getElementById("clientName");
const clientIdentity = document.getElementById("clientIdentity");
const clientEmail = document.getElementById("clientEmail");

const requirementCheck = document.getElementById("requirementCheck");
const scopeCheck = document.getElementById("scopeCheck");
const budgetCheck = document.getElementById("budgetCheck");
const deadlineCheck = document.getElementById("deadlineCheck");

const requestDecisionMessage = document.getElementById("requestDecisionMessage");

const rejectionReason = document.getElementById("rejectionReason");
const rejectionReasonCount = document.getElementById("rejectionReasonCount");
const rejectionReasonError = document.getElementById("rejectionReasonError");

const rejectRequestButton = document.getElementById("rejectRequestButton");
const approveRequestButton = document.getElementById("approveRequestButton");

const requestDecisionCompletedSection = document.getElementById("requestDecisionCompletedSection");
const completedDecisionLabel = document.getElementById("completedDecisionLabel");
const completedDecisionTitle = document.getElementById("completedDecisionTitle");
const completedDecisionDescription = document.getElementById("completedDecisionDescription");
const reviewNextRequestButton = document.getElementById("reviewNextRequestButton");

/* =========================================================
   PAGE STATE
========================================================= */

let currentAdmin = null;

let currentRequest = null;

let currentClient = null;

let requestReviewCompleted = false;

let requestDecisionInProgress = false;

/* =========================================================
   NORMALIZE NUMBER
========================================================= */

function normalizeNumber(value) {

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : 0;

}

/* =========================================================
   NORMALIZE STRING ARRAY
========================================================= */

function normalizeStringArray(value) {

    if (Array.isArray(value)) {
        return value.map((item) => cleanText(item)).filter(Boolean);
    }

    if (typeof value === "string") {
        return value.split(",").map((item) => cleanText(item)).filter(Boolean);
    }

    return [];

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

        clientId: cleanText(request.client_id),

        title: cleanText(request.title) || "Untitled Service Request",

        category: cleanText(request.service_category) || "General Service",

        description: cleanText(request.description),

        requiredSkills: normalizeStringArray(request.required_skills),

        budget: normalizeNumber(request.budget),

        deadline: request.deadline ?? null,

        status: normalizeRequestStatus(request.status),

        databaseStatus: cleanText(request.status).toLowerCase(),

        adminReviewNote: cleanText(request.admin_review_note),

        reviewedBy: cleanText(request.reviewed_by),

        reviewedAt: request.reviewed_at ?? null,

        createdAt: request.created_at ?? null

    };

}

/* =========================================================
   NORMALIZE CLIENT
========================================================= */

function normalizeClient(client) {

    if (!client) {
        return null;
    }

    return {

        id: cleanText(client.id),

        fullName: cleanText(client.full_name) || "Campus Client",

        email: cleanText(client.email),

        department: cleanText(client.department),

        year: cleanText(client.year_of_study),

        registerNumber: cleanText(client.register_number)

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
   GET REQUEST ID FROM URL
========================================================= */

function getRequestIdFromUrl() {

    const searchParameters = new URLSearchParams(window.location.search);

    return cleanText(searchParameters.get("request"));

}

/* =========================================================
   GET SERVICE REQUEST
========================================================= */

async function getServiceRequest(requestIdentifier) {

    if (!requestIdentifier) {
        return null;
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("service_requests")
        .select(ADMIN_REQUEST_REVIEW_CONFIG.REQUEST_COLUMNS)
        .eq("id", requestIdentifier)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return normalizeServiceRequest(data);

}

/* =========================================================
   GET CLIENT PROFILE
========================================================= */

async function getClientProfile(clientIdentifier) {

    if (!clientIdentifier) {
        return null;
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("profiles")
        .select(ADMIN_REQUEST_REVIEW_CONFIG.CLIENT_COLUMNS)
        .eq("id", clientIdentifier)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return normalizeClient(data);

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
   BUILD CLIENT IDENTITY
========================================================= */

function buildClientIdentity(client) {

    if (!client) {
        return "Campus profile information unavailable";
    }

    const identityParts = [];

    if (client.department) {
        identityParts.push(client.department);
    }

    if (client.year) {
        identityParts.push(`Year ${client.year}`);
    }

    if (client.registerNumber) {
        identityParts.push(client.registerNumber);
    }

    return identityParts.join(" · ") || "Campus profile information";

}

/* =========================================================
   RENDER SERVICE REQUEST
========================================================= */

function renderServiceRequest(request) {

    setText(requestCategory, request.category);

    setText(requestTitle, request.title);

    if (requestStatus) {
        requestStatus.className = `admin-request-status ${request.status}`;
    }

    setText(requestStatus, formatRequestStatus(request.status));

    setText(requestDescription, request.description || "No service request description was provided.");

    setText(requestId, request.id || "Not available");

    setText(requestBudget, formatCurrency(request.budget));

    setText(requestDeadline, formatDate(request.deadline));

    setText(requestSubmittedDate, formatDate(request.createdAt));

    setText(requestAdditionalNotes, "");

    hideElement(requestAdditionalNotesSection);

}

/* =========================================================
   RENDER CLIENT PROFILE
========================================================= */

function renderClientProfile(client) {

    const safeClient = client || {};

    const fullName = safeClient.fullName || "Campus Client";

    setText(clientName, fullName);

    setText(clientAvatar, getInitials(fullName));

    setText(clientIdentity, buildClientIdentity(client));

    setText(clientEmail, safeClient.email || "Email unavailable");

}

/* =========================================================
   HIDE REVIEW PAGE STATES
========================================================= */

function hideReviewPageStates() {

    hideElement(requestReviewLoadingState);
    hideElement(requestReviewNotFoundState);
    hideElement(requestReviewErrorState);
    hideElement(requestReviewContent);

}

/* =========================================================
   SHOW REQUEST NOT FOUND
========================================================= */

function showRequestNotFound() {

    hideReviewPageStates();

    showElement(requestReviewNotFoundState);

}

/* =========================================================
   SHOW REQUEST ERROR
========================================================= */

function showRequestError(error) {

    hideReviewPageStates();

    const message =
        cleanText(error?.message) ||
        "An unexpected error occurred while loading the service request.";

    setText(requestReviewErrorMessage, message);

    showElement(requestReviewErrorState);

}

/* =========================================================
   SHOW REQUEST CONTENT
========================================================= */

function showRequestContent() {

    hideReviewPageStates();

    showElement(requestReviewContent);

}

/* =========================================================
   GET REVIEW CHECKBOXES
========================================================= */

function getReviewCheckboxes() {

    return [requirementCheck, scopeCheck, budgetCheck, deadlineCheck];

}

/* =========================================================
   CHECK REVIEW CHECKLIST
========================================================= */

function isReviewChecklistComplete() {

    return getReviewCheckboxes().every((checkbox) => {
        return Boolean(checkbox?.checked);
    });

}

/* =========================================================
   CLEAR DECISION MESSAGE
========================================================= */

function clearDecisionMessage() {

    if (!requestDecisionMessage) {
        return;
    }

    requestDecisionMessage.classList.remove("success", "error");

    setText(requestDecisionMessage, "");

    hideElement(requestDecisionMessage);

}

/* =========================================================
   SHOW DECISION MESSAGE
========================================================= */

function showDecisionMessage(message, type = "error") {

    if (!requestDecisionMessage) {
        return;
    }

    requestDecisionMessage.classList.remove("success", "error");
    requestDecisionMessage.classList.add(type);

    setText(requestDecisionMessage, message);

    showElement(requestDecisionMessage);

}

/* =========================================================
   CLEAR REJECTION REASON ERROR
========================================================= */

function clearRejectionReasonError() {

    setText(rejectionReasonError, "");

    rejectionReason?.classList.remove("input-error");

}

/* =========================================================
   SHOW REJECTION REASON ERROR
========================================================= */

function showRejectionReasonError(message) {

    setText(rejectionReasonError, message);

    rejectionReason?.classList.add("input-error");

}

/* =========================================================
   UPDATE REJECTION CHARACTER COUNT
========================================================= */

function updateRejectionCharacterCount() {

    const value = rejectionReason?.value || "";

    setText(
        rejectionReasonCount,
        `${value.length} / ${ADMIN_REQUEST_REVIEW_CONFIG.REJECTION_REASON_MAX_LENGTH}`
    );

}

/* =========================================================
   VALIDATE APPROVAL
========================================================= */

function validateApproval() {

    clearDecisionMessage();

    clearRejectionReasonError();

    if (!currentRequest) {
        showDecisionMessage("The service request is not available for review.");
        return false;
    }

    if (currentRequest.status !== "under_review") {
        showDecisionMessage("Only service requests under review can be approved.");
        return false;
    }

    if (!isReviewChecklistComplete()) {
        showDecisionMessage("Complete all review checklist items before approving this request.");
        return false;
    }

    return true;

}

/* =========================================================
   VALIDATE REJECTION
========================================================= */

function validateRejection() {

    clearDecisionMessage();

    clearRejectionReasonError();

    if (!currentRequest) {
        showDecisionMessage("The service request is not available for review.");
        return false;
    }

    if (currentRequest.status !== "under_review") {
        showDecisionMessage("Only service requests under review can be rejected.");
        return false;
    }

    const reason = cleanText(rejectionReason?.value);

    if (!reason) {
        showRejectionReasonError("Enter a rejection reason before rejecting this request.");
        rejectionReason?.focus();
        return false;
    }

    if (reason.length > ADMIN_REQUEST_REVIEW_CONFIG.REJECTION_REASON_MAX_LENGTH) {
        showRejectionReasonError("The rejection reason exceeds the allowed character limit.");
        rejectionReason?.focus();
        return false;
    }

    return true;

}

/* =========================================================
   SET DECISION BUTTON LOADING STATE
========================================================= */

function setDecisionButtonsLoading(isLoading, action = "") {

    requestDecisionInProgress = Boolean(isLoading);

    if (approveRequestButton) {

        approveRequestButton.disabled = requestDecisionInProgress;

        setText(
            approveRequestButton,
            requestDecisionInProgress && action === "approve" ? "Approving..." : "Approve Request"
        );

    }

    if (rejectRequestButton) {

        rejectRequestButton.disabled = requestDecisionInProgress;

        setText(
            rejectRequestButton,
            requestDecisionInProgress && action === "reject" ? "Rejecting..." : "Reject Request"
        );

    }

}

/* =========================================================
   SAVE REQUEST DECISION
   Rejection reasons are stored in admin_review_note — the
   service_requests table has no rejection_reason column.
========================================================= */

async function saveRequestDecision(decision, rejectionReasonValue = "") {

    if (!currentRequest?.id) {
        throw new Error("A valid service request is required.");
    }

    if (!currentAdmin?.id) {
        throw new Error("A valid administrator profile is required.");
    }

    const nextStatus = decision === "approve" ? "approved" : "rejected";

    const updatePayload = {

        status: nextStatus,

        admin_review_note:
            decision === "reject" ? cleanText(rejectionReasonValue) : null,

        reviewed_by: currentAdmin.id,

        reviewed_at: new Date().toISOString()

    };

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("service_requests")
        .update(updatePayload)
        .eq("id", currentRequest.id)
        .eq("status", currentRequest.databaseStatus)
        .select(ADMIN_REQUEST_REVIEW_CONFIG.REQUEST_COLUMNS)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error("The service request is no longer available for review.");
    }

    return normalizeServiceRequest(data);

}

/* =========================================================
   DISABLE REVIEW CONTROLS
========================================================= */

function disableReviewControls() {

    getReviewCheckboxes().forEach((checkbox) => {
        if (checkbox) {
            checkbox.disabled = true;
        }
    });

    if (rejectionReason) {
        rejectionReason.disabled = true;
    }

    if (approveRequestButton) {
        approveRequestButton.disabled = true;
    }

    if (rejectRequestButton) {
        rejectRequestButton.disabled = true;
    }

}

/* =========================================================
   RENDER COMPLETED DECISION
========================================================= */

function renderCompletedDecision(decision) {

    requestReviewCompleted = true;

    disableReviewControls();

    clearDecisionMessage();

    if (decision === "approve") {

        setText(completedDecisionLabel, "REQUEST APPROVED");

        setText(completedDecisionTitle, "Service request approved.");

        setText(
            completedDecisionDescription,
            "The request has been approved and can now proceed to freelancer matching."
        );

    } else {

        setText(completedDecisionLabel, "REQUEST REJECTED");

        setText(completedDecisionTitle, "Service request rejected.");

        setText(
            completedDecisionDescription,
            "The request has been rejected and the administrative decision has been recorded."
        );

    }

    showElement(requestDecisionCompletedSection);

    requestDecisionCompletedSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}

/* =========================================================
   HANDLE APPROVE REQUEST
========================================================= */

async function handleApproveRequest() {

    if (requestReviewCompleted || requestDecisionInProgress || !validateApproval()) {
        return;
    }

    setDecisionButtonsLoading(true, "approve");

    try {

        const updatedRequest = await saveRequestDecision("approve");

        currentRequest = updatedRequest;

        renderServiceRequest(currentRequest);

        renderCompletedDecision("approve");

    } catch (error) {

        console.error("Request approval error:", error);

        showDecisionMessage(
            cleanText(error?.message) || "The service request could not be approved."
        );

    } finally {

        setDecisionButtonsLoading(false);

        if (requestReviewCompleted) {
            disableReviewControls();
        }

    }

}

/* =========================================================
   HANDLE REJECT REQUEST
========================================================= */

async function handleRejectRequest() {

    if (requestReviewCompleted || requestDecisionInProgress || !validateRejection()) {
        return;
    }

    const reason = cleanText(rejectionReason?.value);

    setDecisionButtonsLoading(true, "reject");

    try {

        const updatedRequest = await saveRequestDecision("reject", reason);

        currentRequest = updatedRequest;

        renderServiceRequest(currentRequest);

        renderCompletedDecision("reject");

    } catch (error) {

        console.error("Request rejection error:", error);

        showDecisionMessage(
            cleanText(error?.message) || "The service request could not be rejected."
        );

    } finally {

        setDecisionButtonsLoading(false);

        if (requestReviewCompleted) {
            disableReviewControls();
        }

    }

}

/* =========================================================
   RESET REVIEW CONTROLS
========================================================= */

function resetReviewControls() {

    requestReviewCompleted = false;

    requestDecisionInProgress = false;

    getReviewCheckboxes().forEach((checkbox) => {
        if (checkbox) {
            checkbox.checked = false;
            checkbox.disabled = false;
        }
    });

    if (rejectionReason) {
        rejectionReason.value = "";
        rejectionReason.disabled = false;
    }

    if (approveRequestButton) {
        approveRequestButton.disabled = false;
        setText(approveRequestButton, "Approve Request");
    }

    if (rejectRequestButton) {
        rejectRequestButton.disabled = false;
        setText(rejectRequestButton, "Reject Request");
    }

    hideElement(requestDecisionCompletedSection);

    clearDecisionMessage();

    clearRejectionReasonError();

    updateRejectionCharacterCount();

}

/* =========================================================
   APPLY EXISTING REVIEW STATE
========================================================= */

function applyExistingReviewState() {

    if (!currentRequest) {
        return;
    }

    if (currentRequest.status === "under_review") {
        return;
    }

    disableReviewControls();

    if (currentRequest.status === "rejected") {

        setText(completedDecisionLabel, "REQUEST REJECTED");

        setText(completedDecisionTitle, "Service request already reviewed.");

        setText(
            completedDecisionDescription,
            currentRequest.adminReviewNote
                ? `Rejection reason: ${currentRequest.adminReviewNote}`
                : "The request has already been rejected by the platform administrator."
        );

    } else {

        setText(completedDecisionLabel, "REQUEST REVIEWED");

        setText(completedDecisionTitle, "Service request already reviewed.");

        setText(
            completedDecisionDescription,
            "This service request has already completed administrative review and cannot be reviewed again."
        );

    }

    requestReviewCompleted = true;

    showElement(requestDecisionCompletedSection);

}

/* =========================================================
   LOAD REQUEST REVIEW
========================================================= */

async function loadRequestReview() {

    hideReviewPageStates();

    showElement(requestReviewLoadingState);

    resetReviewControls();

    currentRequest = null;

    currentClient = null;

    try {

        const requestIdentifier = getRequestIdFromUrl();

        if (!requestIdentifier) {
            showRequestNotFound();
            return;
        }

        currentRequest = await getServiceRequest(requestIdentifier);

        if (!currentRequest) {
            showRequestNotFound();
            return;
        }

        currentClient = await getClientProfile(currentRequest.clientId);

        renderServiceRequest(currentRequest);

        renderClientProfile(currentClient);

        showRequestContent();

        applyExistingReviewState();

    } catch (error) {

        console.error("Request review loading error:", error);

        currentRequest = null;
        currentClient = null;

        showRequestError(error);

    }

}

/* =========================================================
   NAVIGATE TO REQUEST LIST
========================================================= */

function navigateToRequestList() {
    navigateTo(ROUTES.ADMIN_REQUESTS);
}

/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    backToRequestsButton?.addEventListener("click", navigateToRequestList);

    returnToRequestsButton?.addEventListener("click", navigateToRequestList);

    reviewNextRequestButton?.addEventListener("click", navigateToRequestList);

    retryRequestReviewButton?.addEventListener("click", loadRequestReview);

    rejectionReason?.addEventListener("input", () => {
        clearRejectionReasonError();
        updateRejectionCharacterCount();
    });

    approveRequestButton?.addEventListener("click", handleApproveRequest);

    rejectRequestButton?.addEventListener("click", handleRejectRequest);

}

/* =========================================================
   INITIALIZE ADMIN REQUEST REVIEW PAGE
========================================================= */

async function initializeAdminRequestReviewPage(administratorProfile) {

    try {

        currentAdmin = administratorProfile;

        populateAdminNavbar(currentAdmin);

        initializeEventListeners();

        updateRejectionCharacterCount();

        await loadRequestReview();

    } catch (error) {

        console.error("Admin request review initialization error:", error);

        showRequestError(error);

    }

}

/* =========================================================
   ADMINISTRATOR PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeAdministratorPage(initializeAdminRequestReviewPage);
});