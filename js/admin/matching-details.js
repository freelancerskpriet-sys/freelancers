import {
    requireSupabaseClient
} from "../config/supabase.js";

import {
    cleanText,
    getInitials,
    setText,
    showElement,
    hideElement,
    formatDate
} from "../utils/helpers.js";

import {
    ROUTES,
    navigateTo
} from "../utils/navigation.js";

import {
    initializeAdministratorPage
} from "./admin-guard.js";

const ADMIN_MATCHING_DETAILS_CONFIG = Object.freeze({
    ASSIGNMENT_NOTE_MAX_LENGTH: 1000,
REQUEST_COLUMNS: `

    id,
    display_id,
    client_id,

    profiles!service_requests_client_id_fkey (
        display_id
    ),

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

const eligibleFreelancerSection = document.getElementById("eligibleFreelancerSection");
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

const assignmentDecisionSection = document.getElementById("assignmentDecisionSection");
const matchingAssignmentMessage = document.getElementById("matchingAssignmentMessage");
const matchingAssignmentNote = document.getElementById("matchingAssignmentNote");
const matchingAssignmentNoteCount = document.getElementById("matchingAssignmentNoteCount");
const assignFreelancerButton = document.getElementById("assignFreelancerButton");

const matchingAssignmentCompletedSection = document.getElementById("matchingAssignmentCompletedSection");
const returnAfterAssignmentButton = document.getElementById("returnAfterAssignmentButton");

let currentAdmin = null;
let currentRequest = null;
let eligibleFreelancers = [];
let visibleEligibleFreelancers = [];
let selectedFreelancerIds = new Set();
let assignmentCompleted = false;
let assignmentInProgress = false;

function getRelatedRecord(value) {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
}

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

function normalizeNumber(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

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

function normalizeMatchingRequest(request) {
    if (!request) {
        return null;
    }

    return {
        id: cleanText(request.id),
        displayId: cleanText(request.display_id),
        clientId:
    cleanText(
        request.client_id
    ),

clientDisplayId:
    cleanText(
        request.profiles?.display_id
    ),
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

function populateAdminNavbar(administrator) {
    const administratorName = cleanText(administrator?.full_name) || "Administrator";
    setText(navbarUserName, administratorName);
    setText(navbarUserRole, "PLATFORM ADMINISTRATOR");
    setText(navbarUserAvatar, getInitials(administratorName));
}

function getRequestIdFromUrl() {
    const searchParameters = new URLSearchParams(window.location.search);
    return cleanText(searchParameters.get("request"));
}

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

function renderTags(container, tags, emptyMessage = "None specified") {
    if (!container) return;
    container.replaceChildren();

    if (!tags || tags.length === 0) {
        const tag = document.createElement("span");
        tag.className = "admin-matching-tag";
        setText(tag, emptyMessage);
        container.appendChild(tag);
        return;
    }

    tags.forEach((tagText) => {
        const tag = document.createElement("span");
        tag.className = "admin-matching-tag";
        setText(tag, tagText);
        container.appendChild(tag);
    });
}

function renderMatchingRequest(request) {
    if (!request) return;

    setText(matchingRequestCategory, request.serviceCategory);
    setText(matchingRequestTitle, request.title);
    setText(matchingRequestId,`REQUEST ID: ${request.displayId ||"REQUEST ID UNAVAILABLE"}`
);

    const statusPill = matchingRequestStatus;
    if (statusPill) {
        statusPill.className = `status-pill status-${request.status}`;
        setText(statusPill, request.status.toUpperCase());
    }

    setText(
        matchingRequestDescription,
        request.description || "No description was provided for this service request."
    );

    setText(matchingRequestBudget, `₹${request.budget.toLocaleString("en-IN")}`);
    setText(
        matchingRequestDeadline,
        request.deadline ? formatDate(request.deadline) : "Flexible / Not specified"
    );
    setText(
        matchingRequestSubmittedDate,
        request.createdAt ? formatDate(request.createdAt) : "-"
    );
    setText(
    matchingRequestClientId,
    request.clientDisplayId ||
    "CLIENT ID UNAVAILABLE"
);

    renderTags(matchingRequiredSkills, request.requiredSkills, "No specific skills requested");
    setText(
        matchingRequirementNotes,
        request.adminReviewNote || "No administrative review notes were recorded."
    );
}

function calculateFreelancerRelevance(freelancer, request) {
    if (!freelancer || !request) return 0;
    let score = 0;

    const requestCategory = cleanText(request.serviceCategory).toLowerCase();
    const freelancerCategory = cleanText(freelancer.serviceCategory).toLowerCase();

    if (requestCategory && freelancerCategory && requestCategory === freelancerCategory) {
        score += 50;
    }

    const requiredSkills = (request.requiredSkills || []).map((s) => s.toLowerCase());
    const freelancerSkills = (freelancer.skills || []).map((s) => s.toLowerCase());

    if (requiredSkills.length > 0 && freelancerSkills.length > 0) {
        const matchingSkills = requiredSkills.filter((skill) =>
            freelancerSkills.includes(skill)
        );
        score += matchingSkills.length * 20;
    }

    const requestTitle = cleanText(request.title).toLowerCase();
    const professionalTitle = cleanText(freelancer.professionalTitle).toLowerCase();

    if (requestTitle && professionalTitle) {
        const containsTitle = requestTitle.includes(professionalTitle) || professionalTitle.includes(requestTitle);
        const containsCategory = professionalTitle.includes(requestCategory);
        if (containsTitle || containsCategory) {
            score += 10;
        }
    }

    return score;
}

function getEligibleFreelancers(freelancers, request) {
    const requestClientId = cleanText(request?.clientId);

    return freelancers
        .filter((freelancer) => {
            const approved = freelancer.approvalStatus === "approved";
            const available = freelancer.availabilityStatus === "available";
            const isSelfRequest = Boolean(
                requestClientId &&
                (freelancer.userId === requestClientId || freelancer.id === requestClientId)
            );
            return approved && available && !isSelfRequest;
        })
        .map((freelancer) => ({
            ...freelancer,
            relevanceScore: calculateFreelancerRelevance(freelancer, request)
        }));
}

function updateEligibleFreelancerResultCount(count) {
    const numericCount = Number(count);
    const safeCount = Number.isFinite(numericCount) ? numericCount : 0;
    setText(
        eligibleFreelancerResultCount,
        `${safeCount} ${safeCount === 1 ? "freelancer" : "freelancers"} found`
    );
}

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

function hideEligibleFreelancerStates() {
    hideElement(eligibleFreelancerLoadingState);
    hideElement(eligibleFreelancerList);
    hideElement(eligibleFreelancerEmptyState);
    hideElement(eligibleFreelancerNoResultState);
}

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

function getSelectedFreelancers() {
    return eligibleFreelancers.filter((freelancer) => selectedFreelancerIds.has(freelancer.id));
}

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

function clearAllSelectedFreelancers() {
    if (assignmentCompleted || assignmentInProgress) {
        return;
    }

    selectedFreelancerIds.clear();
    renderSelectedFreelancers();
    renderEligibleFreelancers();
    eligibleFreelancerSearchInput?.focus();
}

function clearAssignmentMessage() {
    if (!matchingAssignmentMessage) {
        return;
    }

    matchingAssignmentMessage.classList.remove("success", "error");
    setText(matchingAssignmentMessage, "");
    hideElement(matchingAssignmentMessage);
}

function showAssignmentMessage(message, type = "error") {
    if (!matchingAssignmentMessage) {
        return;
    }

    matchingAssignmentMessage.classList.remove("success", "error");
    matchingAssignmentMessage.classList.add(type);
    setText(matchingAssignmentMessage, message);
    showElement(matchingAssignmentMessage);
}

function updateAssignmentNoteCount() {
    const value = matchingAssignmentNote?.value || "";
    setText(
        matchingAssignmentNoteCount,
        `${value.length} / ${ADMIN_MATCHING_DETAILS_CONFIG.ASSIGNMENT_NOTE_MAX_LENGTH}`
    );
}

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

    const hasSelfAssigned = selectedFreelancers.some(
        (selectedFreelancer) =>
            currentRequest?.clientId &&
            (selectedFreelancer.userId === currentRequest.clientId ||
             selectedFreelancer.id === currentRequest.clientId)
    );

    if (hasSelfAssigned) {
        showAssignmentMessage("The client who raised this request cannot be assigned to their own task.");
        return false;
    }

    const assignmentNote = matchingAssignmentNote?.value || "";

    if (assignmentNote.length > ADMIN_MATCHING_DETAILS_CONFIG.ASSIGNMENT_NOTE_MAX_LENGTH) {
        showAssignmentMessage("The assignment note exceeds the allowed character limit.");
        return false;
    }

    return true;
}

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

function renderAssignmentCompleted() {
    assignmentCompleted = true;
    disableAssignmentControls();
    hideElement(eligibleFreelancerSection);
    hideElement(selectedFreelancerSection);
    hideElement(assignmentDecisionSection);
    showElement(matchingAssignmentCompletedSection);

    matchingAssignmentCompletedSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    loadInvitationResponses();
}

async function handleSendFreelancerInvitations() {
    if (assignmentCompleted || assignmentInProgress || !validateAssignment()) {
        return;
    }

    const freelancerIds = getSelectedFreelancers().map(
        (freelancer) => freelancer.userId
    );
    const adminNote = matchingAssignmentNote?.value || "";

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

function hideMatchingDetailsPageStates() {
    hideElement(matchingDetailsLoadingState);
    hideElement(matchingDetailsNotFoundState);
    hideElement(matchingDetailsErrorState);
    hideElement(matchingDetailsContent);
}

function showMatchingDetailsNotFound() {
    hideMatchingDetailsPageStates();
    showElement(matchingDetailsNotFoundState);
}

function showMatchingDetailsError(error) {
    hideMatchingDetailsPageStates();
    setText(
        matchingDetailsErrorMessage,
        cleanText(error?.message) || "An unexpected error occurred while loading the selected service request."
    );
    showElement(matchingDetailsErrorState);
}

function showMatchingDetailsContent() {
    hideMatchingDetailsPageStates();
    showElement(matchingDetailsContent);
}

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

    showElement(eligibleFreelancerSection);
    showElement(assignmentDecisionSection);
    hideElement(selectedFreelancerSection);
    hideElement(matchingAssignmentCompletedSection);

    clearAssignmentMessage();
    updateAssignmentNoteCount();
    updateEligibleFreelancerResultCount(0);
}

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
            hideElement(eligibleFreelancerSection);
            hideElement(selectedFreelancerSection);
            hideElement(assignmentDecisionSection);
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
    card.style.padding = "22px 24px";
    card.style.border = "1px solid #e2e8f0";
    card.style.borderRadius = "12px";
    card.style.background = "#ffffff";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "16px";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "flex-start";
    header.style.justifyContent = "space-between";
    header.style.gap = "16px";

    const identity = document.createElement("div");
    identity.style.display = "flex";
    identity.style.alignItems = "center";
    identity.style.gap = "14px";
    identity.style.minWidth = "0";

    const avatar = document.createElement("div");
    avatar.className = "user-avatar";
    avatar.style.width = "44px";
    avatar.style.height = "44px";
    avatar.style.borderRadius = "50%";
    avatar.style.backgroundColor = "#2563eb";
    avatar.style.color = "#ffffff";
    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.fontWeight = "700";
    avatar.style.fontSize = "0.95rem";
    avatar.style.flexShrink = "0";
    avatar.textContent = getInitials(freelancerName);

    const titleContent = document.createElement("div");

    const name = document.createElement("h3");
    name.style.margin = "0 0 2px";
    name.style.color = "#0f172a";
    name.style.fontSize = "0.98rem";
    name.style.fontWeight = "700";
    name.textContent = freelancerName;

    const titleEl = document.createElement("p");
    titleEl.style.margin = "0";
    titleEl.style.color = "#64748b";
    titleEl.style.fontSize = "0.8rem";
    titleEl.style.fontWeight = "500";
    titleEl.textContent = professionalTitle;

    titleContent.append(name, titleEl);
    identity.append(avatar, titleContent);

    const statusVal = assignment.status;
    const statusIndicator = document.createElement("span");
    statusIndicator.style.display = "inline-flex";
    statusIndicator.style.alignItems = "center";
    statusIndicator.style.padding = "4px 12px";
    statusIndicator.style.borderRadius = "999px";
    statusIndicator.style.fontSize = "0.75rem";
    statusIndicator.style.fontWeight = "700";
    statusIndicator.style.whiteSpace = "nowrap";

    let statusText = "⚪ Pending";
    if (statusVal === "accepted") {
        statusText = "🟢 Accepted";
        statusIndicator.style.background = "#f0fdf4";
        statusIndicator.style.color = "#166534";
        statusIndicator.style.border = "1px solid rgba(22, 101, 52, 0.2)";
    } else if (statusVal === "declined") {
        statusText = "🔴 Declined";
        statusIndicator.style.background = "#fff0f0";
        statusIndicator.style.color = "#c94b4b";
        statusIndicator.style.border = "1px solid rgba(201, 75, 75, 0.2)";
    } else if (statusVal === "completed") {
        statusText = "🔵 Completed";
        statusIndicator.style.background = "#eff6ff";
        statusIndicator.style.color = "#2563eb";
        statusIndicator.style.border = "1px solid rgba(37, 99, 235, 0.2)";
    } else if (statusVal === "in_progress") {
        statusText = "🔵 In Progress";
        statusIndicator.style.background = "#eff6ff";
        statusIndicator.style.color = "#2563eb";
        statusIndicator.style.border = "1px solid rgba(37, 99, 235, 0.2)";
    } else {
        statusText = `⚪ ${statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}`;
        statusIndicator.style.background = "#f8fafc";
        statusIndicator.style.color = "#64748b";
        statusIndicator.style.border = "1px solid #e2e8f0";
    }
    statusIndicator.textContent = statusText;

    header.append(identity, statusIndicator);
    card.appendChild(header);

    const detailsDiv = document.createElement("div");
    detailsDiv.style.display = "flex";
    detailsDiv.style.flexDirection = "column";
    detailsDiv.style.gap = "12px";
    detailsDiv.style.borderTop = "1px solid #f1f5f9";
    detailsDiv.style.paddingTop = "14px";

    const datesRow = document.createElement("div");
    datesRow.style.display = "grid";
    datesRow.style.gridTemplateColumns = "repeat(auto-fit, minmax(140px, 1fr))";
    datesRow.style.gap = "12px";

    const invDateItem = document.createElement("div");
    invDateItem.style.display = "flex";
    invDateItem.style.flexDirection = "column";
    invDateItem.style.gap = "2px";
    const invDateLabel = document.createElement("span");
    invDateLabel.style.color = "#64748b";
    invDateLabel.style.fontSize = "0.65rem";
    invDateLabel.style.fontWeight = "800";
    invDateLabel.style.letterSpacing = "0.08em";
    invDateLabel.style.textTransform = "uppercase";
    invDateLabel.textContent = "INVITATION DATE";
    const invDateValue = document.createElement("strong");
    invDateValue.style.color = "#0f172a";
    invDateValue.style.fontSize = "0.85rem";
    invDateValue.style.fontWeight = "600";
    invDateValue.textContent = formatDate(assignment.assigned_at || assignment.created_at);
    invDateItem.append(invDateLabel, invDateValue);

    const resDateItem = document.createElement("div");
    resDateItem.style.display = "flex";
    resDateItem.style.flexDirection = "column";
    resDateItem.style.gap = "2px";
    const resDateLabel = document.createElement("span");
    resDateLabel.style.color = "#64748b";
    resDateLabel.style.fontSize = "0.65rem";
    resDateLabel.style.fontWeight = "800";
    resDateLabel.style.letterSpacing = "0.08em";
    resDateLabel.style.textTransform = "uppercase";
    resDateLabel.textContent = "RESPONSE DATE";
    const resDateValue = document.createElement("strong");
    resDateValue.style.color = "#0f172a";
    resDateValue.style.fontSize = "0.85rem";
    resDateValue.style.fontWeight = "600";
    resDateValue.textContent = assignment.responded_at ? formatDate(assignment.responded_at) : "Pending";
    resDateItem.append(resDateLabel, resDateValue);

    datesRow.append(invDateItem, resDateItem);

    if (assignment.admin_note) {
        const adminNoteDiv = document.createElement("div");
        adminNoteDiv.style.fontSize = "0.85rem";
        adminNoteDiv.style.lineHeight = "1.5";
        adminNoteDiv.style.color = "#334155";
        adminNoteDiv.style.background = "#f8fafc";
        adminNoteDiv.style.padding = "10px 12px";
        adminNoteDiv.style.borderRadius = "6px";
        adminNoteDiv.style.border = "1px solid #e2e8f0";

        const label = document.createElement("strong");
        label.style.display = "block";
        label.style.fontSize = "0.65rem";
        label.style.color = "#64748b";
        label.style.marginBottom = "2px";
        label.style.textTransform = "uppercase";
        label.style.letterSpacing = "0.05em";
        label.textContent = "ADMIN NOTE";

        const text = document.createElement("p");
        text.style.margin = "0";
        text.textContent = assignment.admin_note;
        adminNoteDiv.append(label, text);
        detailsDiv.appendChild(adminNoteDiv);
    }

    if (assignment.freelancer_response_note || statusVal === "declined") {
        const respNoteDiv = document.createElement("div");
        respNoteDiv.style.fontSize = "0.85rem";
        respNoteDiv.style.lineHeight = "1.5";
        respNoteDiv.style.color = "#334155";
        respNoteDiv.style.background = "#f8fafc";
        respNoteDiv.style.padding = "10px 12px";
        respNoteDiv.style.borderRadius = "6px";
        respNoteDiv.style.border = "1px solid #e2e8f0";

        const label = document.createElement("strong");
        label.style.display = "block";
        label.style.fontSize = "0.65rem";
        label.style.color = "#64748b";
        label.style.marginBottom = "2px";
        label.style.textTransform = "uppercase";
        label.style.letterSpacing = "0.05em";
        label.textContent = "FREELANCER RESPONSE NOTE";

        const text = document.createElement("p");
        text.style.margin = "0";
        text.textContent = assignment.freelancer_response_note || "No details provided.";
        respNoteDiv.append(label, text);
        detailsDiv.appendChild(respNoteDiv);
    }

    detailsDiv.appendChild(datesRow);
    card.appendChild(detailsDiv);

    return card;
}

function navigateToMatchingPage() {
    navigateTo(ROUTES.ADMIN_MATCHING);
}

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

document.addEventListener("DOMContentLoaded", () => {
    initializeAdministratorPage(initializeAdminMatchingDetailsPage);
});
