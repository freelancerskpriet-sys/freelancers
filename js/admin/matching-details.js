/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Freelancer Matching Details Logic
   File: js/admin/matching-details.js
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
   ADMIN MATCHING DETAILS CONFIGURATION
========================================================= */

const ADMIN_MATCHING_DETAILS_CONFIG = Object.freeze({

    ASSIGNMENT_NOTE_MAX_LENGTH: 1000,

    // service_requests schema
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

    // freelancer_profiles schema
    FREELANCER_COLUMNS: `
        id,
        user_id,
        professional_title,
        bio,
        service_category,
        skills,
        portfolio_url,
        github_url,
        linkedin_url,
        availability_status,
        approval_status,
        admin_review_note,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,

        profiles!freelancer_profiles_user_id_fkey (
            full_name
        )
    `,

    // service_assignments schema (subset needed here)
    ASSIGNMENT_COLUMNS: `
        id,
        request_id,
        freelancer_id,
        assigned_by,
        status,
        admin_note,
        assigned_at
    `

});

/* =========================================================
   DOM REFERENCES
========================================================= */

const navbarUserName = document.getElementById("navbarUserName");
const navbarUserRole = document.getElementById("navbarUserRole");
const navbarUserAvatar = document.getElementById("navbarUserAvatar");

const backToMatchingButton = document.getElementById("backToMatchingButton");

const matchingDetailsLoadingState = document.getElementById("matchingDetailsLoadingState");
const matchingDetailsNotFoundState = document.getElementById("matchingDetailsNotFoundState");
const matchingDetailsErrorState = document.getElementById("matchingDetailsErrorState");
const matchingDetailsErrorMessage = document.getElementById("matchingDetailsErrorMessage");
const retryMatchingDetailsButton = document.getElementById("retryMatchingDetailsButton");
const returnToMatchingButton = document.getElementById("returnToMatchingButton");
const matchingDetailsContent = document.getElementById("matchingDetailsContent");

const matchingRequestCategory = document.getElementById("matchingRequestCategory");
const matchingRequestTitle = document.getElementById("matchingRequestTitle");
const matchingRequestId = document.getElementById("matchingRequestId");
const matchingRequestStatus = document.getElementById("matchingRequestStatus");
const matchingRequestDescription = document.getElementById("matchingRequestDescription");
const matchingRequestBudget = document.getElementById("matchingRequestBudget");
const matchingRequestDeadline = document.getElementById("matchingRequestDeadline");
const matchingRequestSubmittedDate = document.getElementById("matchingRequestSubmittedDate");
const matchingRequestClientId = document.getElementById("matchingRequestClientId");
const matchingRequiredSkills = document.getElementById("matchingRequiredSkills");
const matchingRequirementNotes = document.getElementById("matchingRequirementNotes");

const eligibleFreelancerSearchInput = document.getElementById("eligibleFreelancerSearchInput");
const eligibleFreelancerSortSelect = document.getElementById("eligibleFreelancerSortSelect");
const eligibleFreelancerResultCount = document.getElementById("eligibleFreelancerResultCount");
const eligibleFreelancerLoadingState = document.getElementById("eligibleFreelancerLoadingState");
const eligibleFreelancerList = document.getElementById("eligibleFreelancerList");
const eligibleFreelancerEmptyState = document.getElementById("eligibleFreelancerEmptyState");
const eligibleFreelancerNoResultState = document.getElementById("eligibleFreelancerNoResultState");
const clearEligibleFreelancerSearchButton = document.getElementById("clearEligibleFreelancerSearchButton");

const selectedFreelancerSection = document.getElementById("selectedFreelancerSection");
const selectedFreelancerList = document.getElementById("selectedFreelancerList");
const changeSelectedFreelancerButton = document.getElementById("changeSelectedFreelancerButton");

const matchingAssignmentMessage = document.getElementById("matchingAssignmentMessage");
const matchingAssignmentNote = document.getElementById("matchingAssignmentNote");
const matchingAssignmentNoteCount = document.getElementById("matchingAssignmentNoteCount");
const assignFreelancerButton = document.getElementById("assignFreelancerButton");

const matchingAssignmentCompletedSection = document.getElementById("matchingAssignmentCompletedSection");
const returnAfterAssignmentButton = document.getElementById("returnAfterAssignmentButton");

/* =========================================================
   PAGE STATE
========================================================= */

let currentAdmin = null;
let currentRequest = null;
let eligibleFreelancers = [];
let visibleEligibleFreelancers = [];
let selectedFreelancerIds = new Set();
let assignmentCompleted = false;
let assignmentInProgress = false;

/* =========================================================
   GET RELATED RECORD
========================================================= */

function getRelatedRecord(value) {

    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;

}

/* =========================================================
   NORMALIZE STRING ARRAY
========================================================= */

function normalizeStringArray(value) {

    if (Array.isArray(value)) {
        return [
            ...new Set(
                value
                    .map((item) => cleanText(item))
                    .filter(Boolean)
            )
        ];
    }

    if (typeof value === "string") {
        return [
            ...new Set(
                value
                    .split(",")
                    .map((item) => cleanText(item))
                    .filter(Boolean)
            )
        ];
    }

    return [];

}

/* =========================================================
   NORMALIZE NUMBER
========================================================= */

function normalizeNumber(value) {

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : 0;

}

/* =========================================================
   NORMALIZE MATCHING STATUS
========================================================= */

function normalizeMatchingStatus(status) {

    const normalizedStatus = cleanText(status)
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const statusMap = {
        approved: "waiting",
        assigned: "matched",
        matched: "matched",
        active: "active",
        in_progress: "active",
        completed: "completed"
    };

    return statusMap[normalizedStatus] || normalizedStatus || "waiting";

}

/* =========================================================
   NORMALIZE REQUEST
========================================================= */

function normalizeMatchingRequest(request) {

    if (!request) {
        return null;
    }

    return {

        id: cleanText(request.id),
        clientId: cleanText(request.client_id),
        title: cleanText(request.title) || "Untitled Service Request",
        serviceCategory: cleanText(request.service_category) || "Uncategorized",
        description: cleanText(request.description),
        budget: normalizeNumber(request.budget),
        deadline: request.deadline ?? null,
        requiredSkills: normalizeStringArray(request.required_skills),
        adminReviewNote: cleanText(request.admin_review_note),
        status: normalizeMatchingStatus(request.status),
        databaseStatus: cleanText(request.status).toLowerCase(),
        reviewedBy: cleanText(request.reviewed_by),
        reviewedAt: request.reviewed_at ?? null,
        createdAt: request.created_at ?? null,
        updatedAt: request.updated_at ?? null

    };

}

/* =========================================================
   NORMALIZE FREELANCER
========================================================= */

function normalizeFreelancer(freelancer) {

    if (!freelancer) {
        return null;
    }

    const profile = getRelatedRecord(freelancer.profiles) || {};

    return {

        id: cleanText(freelancer.id),
        userId: cleanText(freelancer.user_id),
        fullName: cleanText(profile.full_name) || "Campus Freelancer",
        professionalTitle: cleanText(freelancer.professional_title) || "Campus Freelancer",
        bio: cleanText(freelancer.bio),
        serviceCategory: cleanText(freelancer.service_category) || "Uncategorized",
        skills: normalizeStringArray(freelancer.skills),
        portfolioUrl: cleanText(freelancer.portfolio_url),
        githubUrl: cleanText(freelancer.github_url),
        linkedinUrl: cleanText(freelancer.linkedin_url),
        approvalStatus: cleanText(freelancer.approval_status).toLowerCase(),
        availabilityStatus: cleanText(freelancer.availability_status).toLowerCase()

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
   GET EXISTING ASSIGNMENTS
========================================================= */

async function getExistingAssignments(requestIdentifier) {

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("service_assignments")
        .select(ADMIN_MATCHING_DETAILS_CONFIG.ASSIGNMENT_COLUMNS)
        .eq("request_id", requestIdentifier);

    if (error) {
        throw error;
    }

    return data ?? [];

}

/* =========================================================
   GET MATCHING DETAILS DATA
========================================================= */

async function getMatchingDetailsData(requestIdentifier) {

    if (!requestIdentifier) {
        return {
            request: null,
            freelancers: [],
            existingAssignments: []
        };
    }

    const client = requireSupabaseClient();

    const [
        requestResult,
        freelancerResult,
        existingAssignments
    ] = await Promise.all([

        client
            .from("service_requests")
            .select(ADMIN_MATCHING_DETAILS_CONFIG.REQUEST_COLUMNS)
            .eq("id", requestIdentifier)
            .maybeSingle(),

        client
            .from("freelancer_profiles")
            .select(ADMIN_MATCHING_DETAILS_CONFIG.FREELANCER_COLUMNS)
            .eq("approval_status", "approved"),

        getExistingAssignments(requestIdentifier)

    ]);

    if (requestResult.error) {
        throw requestResult.error;
    }

    if (freelancerResult.error) {
        throw freelancerResult.error;
    }

    return {

        request: normalizeMatchingRequest(requestResult.data),

        freelancers: (freelancerResult.data ?? [])
            .map(normalizeFreelancer)
            .filter(Boolean),

        existingAssignments

    };

}

/* =========================================================
   FORMAT STATUS
========================================================= */

function formatMatchingStatus(status) {

    const labels = {
        waiting: "Waiting for Match",
        matched: "Matched",
        active: "Active Work",
        completed: "Completed"
    };

    return labels[normalizeMatchingStatus(status)] || "Waiting for Match";

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
   CREATE TAG
========================================================= */

function createTag(value) {

    const tag = document.createElement("span");

    tag.className = "admin-matching-tag";

    setText(tag, value);

    return tag;

}

/* =========================================================
   RENDER TAGS
========================================================= */

function renderTags(container, values, emptyText) {

    if (!container) {
        return;
    }

    container.replaceChildren();

    const safeValues = Array.isArray(values) ? values : [];

    if (safeValues.length === 0) {

        const emptyTag = document.createElement("span");

        emptyTag.className = "admin-freelancer-empty-tag";

        setText(emptyTag, emptyText);

        container.appendChild(emptyTag);

        return;

    }

    safeValues.forEach((value) => {
        container.appendChild(createTag(value));
    });

}

/* =========================================================
   RENDER REQUEST
========================================================= */

function renderMatchingRequest(request) {

    setText(matchingRequestCategory, request.serviceCategory);
    setText(matchingRequestTitle, request.title);

    setText(
        matchingRequestId,
        request.id
            ? `REQUEST ID · ${request.id}`
            : "REQUEST ID UNAVAILABLE"
    );

    if (matchingRequestStatus) {
        matchingRequestStatus.className = `admin-matching-status ${request.status}`;
    }

    setText(matchingRequestStatus, formatMatchingStatus(request.status));

    setText(
        matchingRequestDescription,
        request.description || "No project description was provided."
    );

    setText(matchingRequestBudget, formatCurrency(request.budget));
    setText(matchingRequestDeadline, formatDate(request.deadline));
    setText(matchingRequestSubmittedDate, formatDate(request.createdAt));
    setText(matchingRequestClientId, request.clientId || "Not available");

    renderTags(matchingRequiredSkills, request.requiredSkills, "No required skills provided");

    setText(
        matchingRequirementNotes,
        request.adminReviewNote || "No additional requirements were provided."
    );

}

/* =========================================================
   CALCULATE FREELANCER RELEVANCE
========================================================= */

function calculateFreelancerRelevance(freelancer, request) {

    if (!freelancer || !request) {
        return 0;
    }

    let score = 0;

    const requestCategory = cleanText(request.serviceCategory).toLowerCase();
    const freelancerCategory = cleanText(freelancer.serviceCategory).toLowerCase();

    const requiredSkills = request.requiredSkills.map((skill) => cleanText(skill).toLowerCase());
    const freelancerSkills = freelancer.skills.map((skill) => cleanText(skill).toLowerCase());

    if (requestCategory && freelancerCategory && requestCategory === freelancerCategory) {
        score += 100;
    }

    requiredSkills.forEach((requiredSkill) => {
        if (freelancerSkills.includes(requiredSkill)) {
            score += 20;
        }
    });

    const professionalTitle = cleanText(freelancer.professionalTitle).toLowerCase();
    const requestTitle = cleanText(request.title).toLowerCase();

    if (professionalTitle) {
        const containsTitle = requestTitle && professionalTitle.includes(requestTitle);
        const containsCategory = requestCategory && professionalTitle.includes(requestCategory);
        if (containsTitle || containsCategory) {
            score += 10;
        }
    }

    return score;

}

/* =========================================================
   GET ELIGIBLE FREELANCERS
========================================================= */

function getEligibleFreelancers(freelancers, request) {

    return freelancers
        .filter((freelancer) => {

            const approved = freelancer.approvalStatus === "approved";
            const available = freelancer.availabilityStatus === "available";

            return approved && available;

        })
        .map((freelancer) => ({
            ...freelancer,
            relevanceScore: calculateFreelancerRelevance(freelancer, request)
        }));

}

/* =========================================================
   UPDATE FREELANCER RESULT COUNT
========================================================= */

function updateEligibleFreelancerResultCount(count) {

    const numericCount = Number(count);
    const safeCount = Number.isFinite(numericCount) ? numericCount : 0;

    setText(
        eligibleFreelancerResultCount,
        `${safeCount} ${safeCount === 1 ? "freelancer" : "freelancers"} found`
    );

}

/* =========================================================
   CREATE FREELANCER CARD
========================================================= */

function createEligibleFreelancerCard(freelancer) {

    const card = document.createElement("article");

    card.className = "admin-eligible-freelancer-card";

    const isSelected = selectedFreelancerIds.has(freelancer.id);

    if (isSelected) {
        card.classList.add("selected");
    }

    const header = document.createElement("div");
    header.className = "admin-eligible-freelancer-header";

    const identity = document.createElement("div");
    identity.className = "admin-eligible-freelancer-identity";

    const avatar = document.createElement("div");
    avatar.className = "admin-freelancer-avatar";
    setText(avatar, getInitials(freelancer.fullName));

    const titleContent = document.createElement("div");

    const name = document.createElement("h3");
    setText(name, freelancer.fullName);

    const professionalTitle = document.createElement("p");
    setText(professionalTitle, freelancer.professionalTitle);

    titleContent.append(name, professionalTitle);
    identity.append(avatar, titleContent);

    const relevance = document.createElement("span");
    relevance.className = "admin-freelancer-match-score";

    if (freelancer.relevanceScore > 0) {
        card.classList.add("best-match");
        setText(relevance, `⭐ BEST MATCH · ${freelancer.relevanceScore}`);
    } else {
        setText(relevance, `MATCH SCORE · ${freelancer.relevanceScore}`);
    }

    header.append(identity, relevance);

    const skillList = document.createElement("div");
    skillList.className = "admin-matching-tag-list";
    renderTags(skillList, freelancer.skills, "No skills provided");

    const action = document.createElement("label");
    action.className = "admin-eligible-freelancer-select";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isSelected;
    checkbox.disabled = assignmentCompleted;

    checkbox.addEventListener("change", () => {
        toggleFreelancerSelection(freelancer, checkbox.checked);
    });

    const checkboxLabel = document.createElement("span");
    setText(checkboxLabel, isSelected ? "Selected" : "Select Freelancer");

    action.append(checkbox, checkboxLabel);

    card.append(header, skillList, action);

    return card;

}

/* =========================================================
   HIDE ELIGIBLE FREELANCER STATES
========================================================= */

function hideEligibleFreelancerStates() {

    hideElement(eligibleFreelancerLoadingState);
    hideElement(eligibleFreelancerList);
    hideElement(eligibleFreelancerEmptyState);
    hideElement(eligibleFreelancerNoResultState);

}

/* =========================================================
   FILTER ELIGIBLE FREELANCERS
========================================================= */

function filterEligibleFreelancers() {

    const searchValue = cleanText(eligibleFreelancerSearchInput?.value).toLowerCase();

    return eligibleFreelancers.filter((freelancer) => {

        if (!searchValue) {
            return true;
        }

        const searchableText = [
            freelancer.fullName,
            freelancer.professionalTitle,
            freelancer.serviceCategory,
            ...freelancer.skills
        ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(searchValue);

    });

}

/* =========================================================
   SORT ELIGIBLE FREELANCERS
========================================================= */

function sortEligibleFreelancers(freelancers) {

    const sortValue = eligibleFreelancerSortSelect?.value || "relevance";

    const sortedFreelancers = [...freelancers];

    sortedFreelancers.sort((firstFreelancer, secondFreelancer) => {

        if (sortValue === "name_asc") {
            return firstFreelancer.fullName.localeCompare(secondFreelancer.fullName);
        }

        if (sortValue === "name_desc") {
            return secondFreelancer.fullName.localeCompare(firstFreelancer.fullName);
        }

        return secondFreelancer.relevanceScore - firstFreelancer.relevanceScore;

    });

    return sortedFreelancers;

}

/* =========================================================
   RENDER ELIGIBLE FREELANCERS
========================================================= */

function renderEligibleFreelancers() {

    hideEligibleFreelancerStates();

    eligibleFreelancerList?.replaceChildren();

    const filteredFreelancers = filterEligibleFreelancers();

    visibleEligibleFreelancers = sortEligibleFreelancers(filteredFreelancers);

    updateEligibleFreelancerResultCount(visibleEligibleFreelancers.length);

    if (eligibleFreelancers.length === 0) {
        showElement(eligibleFreelancerEmptyState);
        return;
    }

    if (visibleEligibleFreelancers.length === 0) {
        showElement(eligibleFreelancerNoResultState);
        return;
    }

    const fragment = document.createDocumentFragment();

    visibleEligibleFreelancers.forEach((freelancer) => {
        fragment.appendChild(createEligibleFreelancerCard(freelancer));
    });

    eligibleFreelancerList?.appendChild(fragment);

    showElement(eligibleFreelancerList);

}

/* =========================================================
   GET SELECTED FREELANCERS
========================================================= */

function getSelectedFreelancers() {

    return eligibleFreelancers.filter((freelancer) => selectedFreelancerIds.has(freelancer.id));

}

/* =========================================================
   RENDER SELECTED FREELANCERS
========================================================= */

function renderSelectedFreelancers() {

    const selectedFreelancers = getSelectedFreelancers();

    if (selectedFreelancers.length === 0) {

        hideElement(selectedFreelancerSection);

        if (assignFreelancerButton) {
            assignFreelancerButton.disabled = true;
        }

        return;

    }

    selectedFreelancerList?.replaceChildren();

    selectedFreelancers.forEach((freelancer) => {

        const item = document.createElement("div");
        item.className = "admin-selected-freelancer-identity";

        const avatar = document.createElement("div");
        avatar.className = "admin-freelancer-avatar";
        setText(avatar, getInitials(freelancer.fullName));

        const titleContent = document.createElement("div");

        const name = document.createElement("h3");
        setText(name, freelancer.fullName);

        const professionalTitle = document.createElement("p");
        setText(professionalTitle, freelancer.professionalTitle);

        titleContent.append(name, professionalTitle);

        item.append(avatar, titleContent);

        selectedFreelancerList?.appendChild(item);

    });

    showElement(selectedFreelancerSection);

    if (assignFreelancerButton && !assignmentCompleted && !assignmentInProgress) {
        assignFreelancerButton.disabled = false;
    }

}

/* =========================================================
   TOGGLE FREELANCER SELECTION
========================================================= */

function toggleFreelancerSelection(freelancer, isSelected) {

    if (assignmentCompleted || assignmentInProgress) {
        return;
    }

    if (isSelected) {
        selectedFreelancerIds.add(freelancer.id);
    } else {
        selectedFreelancerIds.delete(freelancer.id);
    }

    clearAssignmentMessage();

    renderSelectedFreelancers();
    renderEligibleFreelancers();

    if (isSelected) {

        selectedFreelancerSection?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}

/* =========================================================
   CLEAR ALL SELECTED FREELANCERS
========================================================= */

function clearAllSelectedFreelancers() {

    if (assignmentCompleted || assignmentInProgress) {
        return;
    }

    selectedFreelancerIds.clear();

    renderSelectedFreelancers();
    renderEligibleFreelancers();

    eligibleFreelancerSearchInput?.focus();

}

/* =========================================================
   CLEAR ASSIGNMENT MESSAGE
========================================================= */

function clearAssignmentMessage() {

    if (!matchingAssignmentMessage) {
        return;
    }

    matchingAssignmentMessage.classList.remove("success", "error");
    setText(matchingAssignmentMessage, "");
    hideElement(matchingAssignmentMessage);

}

/* =========================================================
   SHOW ASSIGNMENT MESSAGE
========================================================= */

function showAssignmentMessage(message, type = "error") {

    if (!matchingAssignmentMessage) {
        return;
    }

    matchingAssignmentMessage.classList.remove("success", "error");
    matchingAssignmentMessage.classList.add(type);

    setText(matchingAssignmentMessage, message);

    showElement(matchingAssignmentMessage);

}

/* =========================================================
   UPDATE ASSIGNMENT NOTE COUNT
========================================================= */

function updateAssignmentNoteCount() {

    const value = matchingAssignmentNote?.value || "";

    setText(
        matchingAssignmentNoteCount,
        `${value.length} / ${ADMIN_MATCHING_DETAILS_CONFIG.ASSIGNMENT_NOTE_MAX_LENGTH}`
    );

}

/* =========================================================
   VALIDATE ASSIGNMENT
========================================================= */

function validateAssignment() {

    clearAssignmentMessage();

    if (!currentRequest) {
        showAssignmentMessage("The service request is not available for sending invitations.");
        return false;
    }

    if (currentRequest.status !== "waiting") {
        showAssignmentMessage("Only service requests waiting for matching can receive freelancer invitations.");
        return false;
    }

    const selectedFreelancers = getSelectedFreelancers();

    if (selectedFreelancers.length === 0) {
        showAssignmentMessage("Select at least one eligible freelancer before sending invitations.");
        return false;
    }

    const allSelectedStillEligible = selectedFreelancers.every((selectedFreelancer) =>
        eligibleFreelancers.some((freelancer) => freelancer.id === selectedFreelancer.id)
    );

    if (!allSelectedStillEligible) {
        showAssignmentMessage("One or more selected freelancers are no longer eligible for this service request.");
        return false;
    }

    const assignmentNote = matchingAssignmentNote?.value || "";

    if (assignmentNote.length > ADMIN_MATCHING_DETAILS_CONFIG.ASSIGNMENT_NOTE_MAX_LENGTH) {
        showAssignmentMessage("The assignment note exceeds the allowed character limit.");
        return false;
    }

    return true;

}

/* =========================================================
   SEND FREELANCER INVITATIONS
========================================================= */

async function sendFreelancerInvitations(freelancerIds, adminNote) {

    if (!currentRequest?.id || !Array.isArray(freelancerIds) || freelancerIds.length === 0) {
        throw new Error("A valid request and at least one freelancer are required.");
    }

    const client = requireSupabaseClient();

    const existingAssignments = await getExistingAssignments(currentRequest.id);

    if (existingAssignments.length > 0) {
        throw new Error("Service request invitations have already been sent for this service request.");
    }

    const assignmentRows = freelancerIds.map((freelancerId) => ({
        request_id: currentRequest.id,
        freelancer_id: freelancerId,
        assigned_by: cleanText(currentAdmin?.id) || null,
        status: "pending",
        admin_note: adminNote || null,
        assigned_at: new Date().toISOString()
    }));

    const {
        data: assignmentData,
        error: assignmentError
    } = await client
        .from("service_assignments")
        .insert(assignmentRows)
        .select(ADMIN_MATCHING_DETAILS_CONFIG.ASSIGNMENT_COLUMNS);

    if (assignmentError) {
        throw assignmentError;
    }

    const {
        data: requestData,
        error: requestError
    } = await client
        .from("service_requests")
        .update({ status: "assigned" })
        .eq("id", currentRequest.id)
        .eq("status", currentRequest.databaseStatus)
        .select(ADMIN_MATCHING_DETAILS_CONFIG.REQUEST_COLUMNS)
        .maybeSingle();

    if (requestError) {

        await client
            .from("service_assignments")
            .delete()
            .in("id", (assignmentData ?? []).map((assignment) => assignment.id));

        throw requestError;

    }

    if (!requestData) {

        await client
            .from("service_assignments")
            .delete()
            .in("id", (assignmentData ?? []).map((assignment) => assignment.id));

        throw new Error("The service request is no longer available for sending invitations.");

    }

    return {
        request: normalizeMatchingRequest(requestData),
        assignments: assignmentData ?? []
    };

}

/* =========================================================
   SET ASSIGNMENT LOADING
========================================================= */

function setAssignmentLoading(isLoading) {

    assignmentInProgress = Boolean(isLoading);

    if (!assignFreelancerButton) {
        return;
    }

    assignFreelancerButton.disabled = assignmentInProgress;

    setText(
        assignFreelancerButton,
        assignmentInProgress ? "Sending Requests..." : "Send Requests"
    );

}

/* =========================================================
   DISABLE ASSIGNMENT CONTROLS
========================================================= */

function disableAssignmentControls() {

    if (eligibleFreelancerSearchInput) {
        eligibleFreelancerSearchInput.disabled = true;
    }

    if (eligibleFreelancerSortSelect) {
        eligibleFreelancerSortSelect.disabled = true;
    }

    if (clearEligibleFreelancerSearchButton) {
        clearEligibleFreelancerSearchButton.disabled = true;
    }

    if (changeSelectedFreelancerButton) {
        changeSelectedFreelancerButton.disabled = true;
    }

    if (matchingAssignmentNote) {
        matchingAssignmentNote.disabled = true;
    }

    if (assignFreelancerButton) {
        assignFreelancerButton.disabled = true;
    }

}

/* =========================================================
   RENDER ASSIGNMENT COMPLETED
========================================================= */

function renderAssignmentCompleted() {

    assignmentCompleted = true;

    disableAssignmentControls();

    renderEligibleFreelancers();

    showElement(matchingAssignmentCompletedSection);

    matchingAssignmentCompletedSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    loadInvitationResponses();

}

/* =========================================================
   HANDLE SEND FREELANCER INVITATIONS
========================================================= */

async function handleSendFreelancerInvitations() {

    if (assignmentCompleted || assignmentInProgress || !validateAssignment()) {
        return;
    }

    const freelancerIds = getSelectedFreelancers().map(
        (freelancer) => freelancer.userId
    );    const adminNote = matchingAssignmentNote?.value || "";

    setAssignmentLoading(true);

    try {

        const invitationResult = await sendFreelancerInvitations(freelancerIds, adminNote);

        currentRequest = invitationResult.request;

        renderMatchingRequest(currentRequest);

        renderAssignmentCompleted();

        showAssignmentMessage("Service request invitations sent successfully.", "success");

    } catch (error) {

        console.error("Freelancer invitation error:", error);

        showAssignmentMessage(
            cleanText(error?.message) || "The service request invitations could not be sent."
        );

    } finally {

        setAssignmentLoading(false);

        if (assignmentCompleted) {
            disableAssignmentControls();
        } else if (assignFreelancerButton) {
            assignFreelancerButton.disabled = selectedFreelancerIds.size === 0;
        }

    }

}

/* =========================================================
   HIDE PAGE STATES
========================================================= */

function hideMatchingDetailsPageStates() {

    hideElement(matchingDetailsLoadingState);
    hideElement(matchingDetailsNotFoundState);
    hideElement(matchingDetailsErrorState);
    hideElement(matchingDetailsContent);

}

/* =========================================================
   SHOW NOT FOUND
========================================================= */

function showMatchingDetailsNotFound() {

    hideMatchingDetailsPageStates();

    showElement(matchingDetailsNotFoundState);

}

/* =========================================================
   SHOW ERROR
========================================================= */

function showMatchingDetailsError(error) {

    hideMatchingDetailsPageStates();

    setText(
        matchingDetailsErrorMessage,
        cleanText(error?.message) || "An unexpected error occurred while loading the selected service request."
    );

    showElement(matchingDetailsErrorState);

}

/* =========================================================
   SHOW CONTENT
========================================================= */

function showMatchingDetailsContent() {

    hideMatchingDetailsPageStates();

    showElement(matchingDetailsContent);

}

/* =========================================================
   RESET MATCHING DETAILS
========================================================= */

function resetMatchingDetails() {

    currentRequest = null;
    eligibleFreelancers = [];
    visibleEligibleFreelancers = [];
    selectedFreelancerIds = new Set();
    assignmentCompleted = false;
    assignmentInProgress = false;

    if (eligibleFreelancerSearchInput) {
        eligibleFreelancerSearchInput.value = "";
        eligibleFreelancerSearchInput.disabled = false;
    }

    if (eligibleFreelancerSortSelect) {
        eligibleFreelancerSortSelect.value = "relevance";
        eligibleFreelancerSortSelect.disabled = false;
    }

    if (clearEligibleFreelancerSearchButton) {
        clearEligibleFreelancerSearchButton.disabled = false;
    }

    if (matchingAssignmentNote) {
        matchingAssignmentNote.value = "";
        matchingAssignmentNote.disabled = false;
    }

    if (changeSelectedFreelancerButton) {
        changeSelectedFreelancerButton.disabled = false;
    }

    if (assignFreelancerButton) {
        assignFreelancerButton.disabled = true;
        setText(assignFreelancerButton, "Send Requests");
    }

    selectedFreelancerList?.replaceChildren();

    hideElement(selectedFreelancerSection);
    hideElement(matchingAssignmentCompletedSection);

    clearAssignmentMessage();

    updateAssignmentNoteCount();
    updateEligibleFreelancerResultCount(0);

}

/* =========================================================
   LOAD MATCHING DETAILS
========================================================= */

async function loadMatchingDetails() {

    hideMatchingDetailsPageStates();

    showElement(matchingDetailsLoadingState);

    resetMatchingDetails();

    try {

        const requestIdentifier = getRequestIdFromUrl();

        if (!requestIdentifier) {
            showMatchingDetailsNotFound();
            return;
        }

        const matchingData = await getMatchingDetailsData(requestIdentifier);

        currentRequest = matchingData.request;

        if (!currentRequest) {
            showMatchingDetailsNotFound();
            return;
        }

        renderMatchingRequest(currentRequest);

        showMatchingDetailsContent();

        if (matchingData.existingAssignments.length > 0) {

            assignmentCompleted = true;

            disableAssignmentControls();

            showAssignmentMessage(
                "Service request invitations have already been sent for this service request.",
                "success"
            );

            showElement(matchingAssignmentCompletedSection);

            await loadInvitationResponses();

            return;

        }

        eligibleFreelancers = getEligibleFreelancers(matchingData.freelancers, currentRequest);

        renderEligibleFreelancers();

        await loadInvitationResponses();

    } catch (error) {

        console.error("Matching details loading error:", error);

        currentRequest = null;
        eligibleFreelancers = [];
        visibleEligibleFreelancers = [];

        showMatchingDetailsError(error);

    }

}

/* =========================================================
   INVITATION RESPONSES (SECTION 07)
========================================================= */

async function loadInvitationResponses() {
    const client = requireSupabaseClient();
    const container = document.getElementById("invitationResponseList");
    const emptyState = document.getElementById("invitationResponseEmptyState");

    if (!container || !emptyState) return;

    container.replaceChildren();
    hideElement(container);
    hideElement(emptyState);

    if (!currentRequest?.id) {
        showElement(emptyState);
        return;
    }

    try {
        const { data: assignments, error: assignmentsError } = await client
            .from("service_assignments")
            .select(`
                id,
                request_id,
                freelancer_id,
                status,
                admin_note,
                freelancer_response_note,
                assigned_at,
                responded_at,
                started_at,
                completed_at
            `)
            .eq("request_id", currentRequest.id);

        if (assignmentsError) throw assignmentsError;

        if (!assignments || assignments.length === 0) {
            showElement(emptyState);
            return;
        }

        // Fetch freelancer names and professional titles
        const freelancerIds = assignments.map(a => a.freelancer_id).filter(Boolean);
        const freelancerProfilesMap = {};
        const freelancerNamesMap = {};

        if (freelancerIds.length > 0) {
            const [profilesRes, freelancerProfilesRes] = await Promise.all([
                client
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", freelancerIds),
                client
                    .from("freelancer_profiles")
                    .select("user_id, professional_title")
                    .in("user_id", freelancerIds)
            ]);

            if (!profilesRes.error && profilesRes.data) {
                profilesRes.data.forEach(p => {
                    freelancerNamesMap[p.id] = p.full_name;
                });
            }

            if (!freelancerProfilesRes.error && freelancerProfilesRes.data) {
                freelancerProfilesRes.data.forEach(fp => {
                    freelancerProfilesMap[fp.user_id] = fp.professional_title;
                });
            }
        }

        const fragment = document.createDocumentFragment();
        assignments.forEach((assignment) => {
            const freelancerName = freelancerNamesMap[assignment.freelancer_id] || "Campus Freelancer";
            const professionalTitle = freelancerProfilesMap[assignment.freelancer_id] || "Campus Freelancer";
            const card = createInvitationResponseCard(assignment, freelancerName, professionalTitle);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);
        showElement(container);
    } catch (error) {
        console.error("Error loading invitation responses:", error);
        showElement(emptyState);
    }
}

function createInvitationResponseCard(assignment, freelancerName, professionalTitle) {
    const card = document.createElement("article");
    card.className = "admin-eligible-freelancer-card";

    // Header container
    const header = document.createElement("div");
    header.className = "admin-eligible-freelancer-header";

    // Identity container
    const identity = document.createElement("div");
    identity.className = "admin-eligible-freelancer-identity";

    // Avatar
    const avatar = document.createElement("div");
    avatar.className = "admin-freelancer-avatar";
    avatar.textContent = getInitials(freelancerName);

    // Title text content
    const titleContent = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = freelancerName;

    const titleEl = document.createElement("p");
    titleEl.textContent = professionalTitle;

    titleContent.append(name, titleEl);
    identity.append(avatar, titleContent);

    // Status label/indicator
    const statusVal = assignment.status;
    const statusIndicator = document.createElement("span");
    statusIndicator.className = "admin-freelancer-match-score";
    statusIndicator.style.fontWeight = "bold";

    let statusText = "🟡 Pending Response";
    if (statusVal === "accepted") statusText = "🟢 Accepted";
    else if (statusVal === "declined") statusText = "🔴 Declined";
    else if (statusVal === "completed") statusText = "🔵 Completed";
    else if (statusVal === "in_progress") statusText = "🔵 In Progress";
    else {
        statusText = `⚪ ${statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}`;
    }
    statusIndicator.textContent = statusText;

    header.append(identity, statusIndicator);
    card.appendChild(header);

    // Details Grid / Notes Section
    const detailsDiv = document.createElement("div");
    detailsDiv.className = "admin-matching-details-section";
    detailsDiv.style.marginTop = "1rem";
    detailsDiv.style.display = "flex";
    detailsDiv.style.flexDirection = "column";
    detailsDiv.style.gap = "0.75rem";

    // Invitation Date & Response Date
    const datesRow = document.createElement("div");
    datesRow.className = "admin-matching-details-meta-grid";
    datesRow.style.gridTemplateColumns = "repeat(auto-fit, minmax(150px, 1fr))";
    datesRow.style.gap = "1rem";
    datesRow.style.borderTop = "1px solid rgba(0, 0, 0, 0.05)";
    datesRow.style.paddingTop = "0.75rem";

    const invDateItem = document.createElement("div");
    invDateItem.className = "admin-matching-details-meta-item";
    const invDateLabel = document.createElement("span");
    invDateLabel.textContent = "INVITATION DATE";
    const invDateValue = document.createElement("strong");
    invDateValue.textContent = formatDate(assignment.assigned_at || assignment.created_at);
    invDateItem.append(invDateLabel, invDateValue);

    const resDateItem = document.createElement("div");
    resDateItem.className = "admin-matching-details-meta-item";
    const resDateLabel = document.createElement("span");
    resDateLabel.textContent = "RESPONSE DATE";
    const resDateValue = document.createElement("strong");
    resDateValue.textContent = assignment.responded_at ? formatDate(assignment.responded_at) : "Pending";
    resDateItem.append(resDateLabel, resDateValue);

    datesRow.append(invDateItem, resDateItem);

    // Admin Note
    if (assignment.admin_note) {
        const adminNoteDiv = document.createElement("div");
        adminNoteDiv.style.fontSize = "0.9rem";
        adminNoteDiv.style.lineHeight = "1.4";
        const label = document.createElement("strong");
        label.style.display = "block";
        label.style.fontSize = "0.75rem";
        label.style.color = "var(--color-text-muted, #718096)";
        label.style.marginBottom = "0.25rem";
        label.textContent = "ADMIN NOTE";
        const text = document.createElement("p");
        text.textContent = assignment.admin_note;
        adminNoteDiv.append(label, text);
        detailsDiv.appendChild(adminNoteDiv);
    }

    // Freelancer Response Note (mandatory for declined, show for accepted too if available)
    if (assignment.freelancer_response_note || statusVal === "declined") {
        const respNoteDiv = document.createElement("div");
        respNoteDiv.style.fontSize = "0.9rem";
        respNoteDiv.style.lineHeight = "1.4";
        const label = document.createElement("strong");
        label.style.display = "block";
        label.style.fontSize = "0.75rem";
        label.style.color = "var(--color-text-muted, #718096)";
        label.style.marginBottom = "0.25rem";
        label.textContent = "FREELANCER RESPONSE NOTE";
        const text = document.createElement("p");
        text.textContent = assignment.freelancer_response_note || "No details provided.";
        respNoteDiv.append(label, text);
        detailsDiv.appendChild(respNoteDiv);
    }

    detailsDiv.appendChild(datesRow);
    card.appendChild(detailsDiv);

    return card;
}

async function handleStartWork(assignmentId) {
    const client = requireSupabaseClient();
    try {
        const { error } = await client
            .from("service_assignments")
            .update({
                status: "in_progress",
                started_at: new Date().toISOString()
            })
            .eq("id", assignmentId);

        if (error) throw error;

        // Refresh the page
        await loadMatchingDetails();
    } catch (error) {
        console.error("Error starting work:", error);
        showAssignmentMessage(
            cleanText(error?.message) || "Failed to start work. Please try again."
        );
    }
}

/* =========================================================
   NAVIGATE TO MATCHING
========================================================= */

function navigateToMatchingPage() {

    navigateTo(ROUTES.ADMIN_MATCHING);

}

/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    backToMatchingButton?.addEventListener("click", navigateToMatchingPage);
    returnToMatchingButton?.addEventListener("click", navigateToMatchingPage);
    returnAfterAssignmentButton?.addEventListener("click", navigateToMatchingPage);
    retryMatchingDetailsButton?.addEventListener("click", loadMatchingDetails);

    eligibleFreelancerSearchInput?.addEventListener("input", renderEligibleFreelancers);
    eligibleFreelancerSortSelect?.addEventListener("change", renderEligibleFreelancers);

    clearEligibleFreelancerSearchButton?.addEventListener("click", () => {

        if (eligibleFreelancerSearchInput) {
            eligibleFreelancerSearchInput.value = "";
        }

        renderEligibleFreelancers();

        eligibleFreelancerSearchInput?.focus();

    });

    changeSelectedFreelancerButton?.addEventListener("click", clearAllSelectedFreelancers);

    matchingAssignmentNote?.addEventListener("input", updateAssignmentNoteCount);

    assignFreelancerButton?.addEventListener("click", handleSendFreelancerInvitations);

}

/* =========================================================
   INITIALIZE ADMIN MATCHING DETAILS PAGE
========================================================= */

async function initializeAdminMatchingDetailsPage(administratorProfile) {

    try {

        currentAdmin = administratorProfile;

        populateAdminNavbar(currentAdmin);

        initializeEventListeners();

        updateAssignmentNoteCount();

        await loadMatchingDetails();

    } catch (error) {

        console.error("Admin matching details initialization error:", error);

        showMatchingDetailsError(error);

    }

}

/* =========================================================
   ADMINISTRATOR PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeAdministratorPage(initializeAdminMatchingDetailsPage);
});
