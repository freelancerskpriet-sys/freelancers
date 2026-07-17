/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Freelancer Review Logic
   File: js/admin/freelancer-review.js
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
   ADMIN FREELANCER REVIEW CONFIGURATION
========================================================= */

const ADMIN_FREELANCER_REVIEW_CONFIG =
    Object.freeze({

        REJECTION_REASON_MAX_LENGTH:
            1000,


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
            approval_status,
            rejection_reason,
            reviewed_by,
            reviewed_at,
            created_at,

            profiles!freelancer_profiles_user_id_fkey (
                full_name,
                email,
                department,
                year_of_study,
                register_number
            )

        `

    });


/* =========================================================
   DOM REFERENCES
========================================================= */

const navbarUserName =
    document.getElementById(
        "navbarUserName"
    );


const navbarUserRole =
    document.getElementById(
        "navbarUserRole"
    );


const navbarUserAvatar =
    document.getElementById(
        "navbarUserAvatar"
    );


const backToFreelancersButton =
    document.getElementById(
        "backToFreelancersButton"
    );


const freelancerReviewLoadingState =
    document.getElementById(
        "freelancerReviewLoadingState"
    );


const freelancerReviewNotFoundState =
    document.getElementById(
        "freelancerReviewNotFoundState"
    );


const freelancerReviewErrorState =
    document.getElementById(
        "freelancerReviewErrorState"
    );


const freelancerReviewErrorMessage =
    document.getElementById(
        "freelancerReviewErrorMessage"
    );


const retryFreelancerReviewButton =
    document.getElementById(
        "retryFreelancerReviewButton"
    );


const returnToFreelancersButton =
    document.getElementById(
        "returnToFreelancersButton"
    );


const freelancerReviewContent =
    document.getElementById(
        "freelancerReviewContent"
    );


const freelancerAvatar =
    document.getElementById(
        "freelancerAvatar"
    );


const freelancerName =
    document.getElementById(
        "freelancerName"
    );


const freelancerProfessionalTitle =
    document.getElementById(
        "freelancerProfessionalTitle"
    );


const freelancerApprovalStatus =
    document.getElementById(
        "freelancerApprovalStatus"
    );


const freelancerId =
    document.getElementById(
        "freelancerId"
    );


const freelancerRegisterNumber =
    document.getElementById(
        "freelancerRegisterNumber"
    );


const freelancerDepartment =
    document.getElementById(
        "freelancerDepartment"
    );


const freelancerYear =
    document.getElementById(
        "freelancerYear"
    );


const freelancerEmail =
    document.getElementById(
        "freelancerEmail"
    );


const freelancerSubmittedDate =
    document.getElementById(
        "freelancerSubmittedDate"
    );


const freelancerBio =
    document.getElementById(
        "freelancerBio"
    );


const freelancerServiceCategories =
    document.getElementById(
        "freelancerServiceCategories"
    );


const freelancerSkills =
    document.getElementById(
        "freelancerSkills"
    );


const freelancerPortfolioList =
    document.getElementById(
        "freelancerPortfolioList"
    );


const freelancerPortfolioEmptyState =
    document.getElementById(
        "freelancerPortfolioEmptyState"
    );


const campusIdentityCheck =
    document.getElementById(
        "campusIdentityCheck"
    );


const professionalProfileCheck =
    document.getElementById(
        "professionalProfileCheck"
    );


const skillsCheck =
    document.getElementById(
        "skillsCheck"
    );


const portfolioCheck =
    document.getElementById(
        "portfolioCheck"
    );


const freelancerDecisionMessage =
    document.getElementById(
        "freelancerDecisionMessage"
    );


const freelancerRejectionReason =
    document.getElementById(
        "freelancerRejectionReason"
    );


const freelancerRejectionReasonCount =
    document.getElementById(
        "freelancerRejectionReasonCount"
    );


const freelancerRejectionReasonError =
    document.getElementById(
        "freelancerRejectionReasonError"
    );


const rejectFreelancerButton =
    document.getElementById(
        "rejectFreelancerButton"
    );


const approveFreelancerButton =
    document.getElementById(
        "approveFreelancerButton"
    );


const freelancerDecisionCompletedSection =
    document.getElementById(
        "freelancerDecisionCompletedSection"
    );


const completedFreelancerDecisionLabel =
    document.getElementById(
        "completedFreelancerDecisionLabel"
    );


const completedFreelancerDecisionTitle =
    document.getElementById(
        "completedFreelancerDecisionTitle"
    );


const completedFreelancerDecisionDescription =
    document.getElementById(
        "completedFreelancerDecisionDescription"
    );


const reviewNextFreelancerButton =
    document.getElementById(
        "reviewNextFreelancerButton"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentAdmin = null;

let currentFreelancer = null;

let freelancerReviewCompleted = false;

let decisionInProgress = false;


/* =========================================================
   GET RELATED RECORD
========================================================= */

function getRelatedRecord(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {

        return value[0] ?? null;

    }


    return value ?? null;

}


/* =========================================================
   NORMALIZE APPROVAL STATUS
========================================================= */

function normalizeApprovalStatus(
    status
) {

    const normalizedStatus =
        cleanText(
            status
        )

            .toLowerCase()

            .replace(
                /[\s-]+/g,
                "_"
            );


    const allowedStatuses = [

        "pending",

        "approved",

        "rejected"

    ];


    if (
        allowedStatuses.includes(
            normalizedStatus
        )
    ) {

        return normalizedStatus;

    }


    return "pending";

}


/* =========================================================
   NORMALIZE STRING ARRAY
========================================================= */

function normalizeStringArray(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {

        return [

            ...new Set(

                value

                    .map(
                        (item) => {

                            return cleanText(
                                item
                            );

                        }
                    )

                    .filter(
                        Boolean
                    )

            )

        ];

    }


    if (
        typeof value === "string"
    ) {

        return [

            ...new Set(

                value

                    .split(
                        ","
                    )

                    .map(
                        (item) => {

                            return cleanText(
                                item
                            );

                        }
                    )

                    .filter(
                        Boolean
                    )

            )

        ];

    }


    return [];

}


/* =========================================================
   NORMALIZE PORTFOLIO REFERENCES
========================================================= */

function normalizePortfolioReferences(
    freelancer
) {

    const references = [];


    function addReference(
        label,
        value
    ) {

        const url =
            cleanText(
                value
            );


        if (!url) {

            return;

        }


        references.push({

            label:
                cleanText(
                    label
                ) ||
                "Portfolio Reference",

            url

        });

    }


    addReference(

        "Portfolio",

        freelancer?.portfolio_url

    );


    addReference(

        "GitHub",

        freelancer?.github_url

    );


    addReference(

        "LinkedIn",

        freelancer?.linkedin_url

    );


    return references.filter(
        (
            reference,
            index,
            allReferences
        ) => {

            return (

                allReferences.findIndex(
                    (item) => {

                        return (
                            item.url ===
                            reference.url
                        );

                    }
                ) === index

            );

        }
    );

}


/* =========================================================
   NORMALIZE FREELANCER APPLICATION
========================================================= */

function normalizeFreelancerApplication(
    freelancer
) {

    if (!freelancer) {

        return null;

    }


    const profile =
        getRelatedRecord(
            freelancer.profiles
        ) || {};


    return {

        id:
            cleanText(
                freelancer.id
            ),

        userId:
            cleanText(
                freelancer.user_id
            ),

        fullName:
            cleanText(
                profile.full_name
            ) ||
            "Campus Freelancer",

        email:
            cleanText(
                profile.email
            ),

        department:
            cleanText(
                profile.department
            ),

        year:
            cleanText(
                profile.year_of_study
            ),

        registerNumber:
            cleanText(
                profile.register_number
            ),

        professionalTitle:
            cleanText(
                freelancer
                    .professional_title
            ) ||
            "Professional information unavailable",

        bio:
            cleanText(
                freelancer.bio
            ),

        serviceCategories:
            normalizeStringArray(
                freelancer
                    .service_category
            ),

        skills:
            normalizeStringArray(
                freelancer.skills
            ),

        portfolioReferences:
            normalizePortfolioReferences(
                freelancer
            ),

        approvalStatus:
            normalizeApprovalStatus(
                freelancer
                    .approval_status
            ),

        rejectionReason:
            cleanText(
                freelancer
                    .rejection_reason
            ),

        reviewedBy:
            cleanText(
                freelancer
                    .reviewed_by
            ),

        reviewedAt:
            freelancer.reviewed_at ||
            null,

        createdAt:
            freelancer.created_at ||
            null

    };

}


/* =========================================================
   POPULATE ADMIN NAVBAR
========================================================= */

function populateAdminNavbar(
    admin
) {

    const adminName =
        cleanText(
            admin?.full_name
        ) ||
        "Platform Administrator";


    setText(

        navbarUserName,

        adminName

    );


    setText(

        navbarUserRole,

        "PLATFORM ADMINISTRATOR"

    );


    setText(

        navbarUserAvatar,

        getInitials(
            adminName
        )

    );

}


/* =========================================================
   GET FREELANCER ID FROM URL
========================================================= */

function getFreelancerIdFromUrl() {

    const searchParameters =
        new URLSearchParams(
            window.location.search
        );


    return cleanText(
        searchParameters.get(
            "freelancer"
        )
    );

}


/* =========================================================
   GET FREELANCER APPLICATION
========================================================= */

async function getFreelancerApplication(
    freelancerIdentifier
) {

    if (
        !freelancerIdentifier
    ) {

        return null;

    }


    const client =
        requireSupabaseClient();


    const {

        data,

        error

    } = await client

        .from(
            "freelancer_profiles"
        )

        .select(
            ADMIN_FREELANCER_REVIEW_CONFIG
                .FREELANCER_COLUMNS
        )

        .eq(
            "id",
            freelancerIdentifier
        )

        .maybeSingle();


    if (error) {

        throw error;

    }


    return normalizeFreelancerApplication(
        data
    );

}


/* =========================================================
   FORMAT APPROVAL STATUS
========================================================= */

function formatApprovalStatus(
    status
) {

    const statusLabels = {

        pending:
            "Pending Review",

        approved:
            "Approved",

        rejected:
            "Rejected"

    };


    return (

        statusLabels[
            normalizeApprovalStatus(
                status
            )
        ]

        ||

        "Pending Review"

    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "Not specified";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Not specified";

    }


    return new Intl.DateTimeFormat(

        "en-IN",

        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }

    ).format(
        date
    );

}


/* =========================================================
   CREATE TAG
========================================================= */

function createTag(
    value,
    className
) {

    const tag =
        document.createElement(
            "span"
        );


    tag.className =
        className;


    setText(

        tag,

        value

    );


    return tag;

}


/* =========================================================
   RENDER TAG LIST
========================================================= */

function renderTagList(
    container,
    values,
    className,
    emptyText
) {

    if (!container) {

        return;

    }


    container.replaceChildren();


    if (
        values.length === 0
    ) {

        container.appendChild(

            createTag(

                emptyText,

                "admin-freelancer-empty-tag"

            )

        );


        return;

    }


    values.forEach(
        (value) => {

            container.appendChild(

                createTag(
                    value,
                    className
                )

            );

        }
    );

}


/* =========================================================
   CHECK SAFE PORTFOLIO URL
========================================================= */

function getSafePortfolioUrl(
    value
) {

    const urlValue =
        cleanText(
            value
        );


    if (!urlValue) {

        return null;

    }


    try {

        const url =
            new URL(
                urlValue
            );


        if (

            url.protocol !== "https:" &&

            url.protocol !== "http:"

        ) {

            return null;

        }


        return url.href;


    } catch (error) {

        return null;

    }

}


/* =========================================================
   CREATE PORTFOLIO REFERENCE
========================================================= */

function createPortfolioReference(
    reference
) {

    const safeUrl =
        getSafePortfolioUrl(
            reference.url
        );


    if (!safeUrl) {

        return null;

    }


    const item =
        document.createElement(
            "a"
        );


    item.className =
        "admin-freelancer-portfolio-item";


    item.href =
        safeUrl;


    item.target =
        "_blank";


    item.rel =
        "noopener noreferrer";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "admin-freelancer-portfolio-content";


    const label =
        document.createElement(
            "strong"
        );


    setText(

        label,

        reference.label

    );


    const urlText =
        document.createElement(
            "span"
        );


    setText(

        urlText,

        safeUrl

    );


    content.append(
        label,
        urlText
    );


    const action =
        document.createElement(
            "span"
        );


    action.className =
        "admin-freelancer-portfolio-action";


    setText(

        action,

        "Open Reference ↗"

    );


    item.append(
        content,
        action
    );


    return item;

}


/* =========================================================
   RENDER PORTFOLIO REFERENCES
========================================================= */

function renderPortfolioReferences(
    references
) {

    freelancerPortfolioList
        ?.replaceChildren();


    hideElement(
        freelancerPortfolioEmptyState
    );


    const validReferenceElements =
        references

            .map(
                createPortfolioReference
            )

            .filter(
                Boolean
            );


    if (
        validReferenceElements.length === 0
    ) {

        hideElement(
            freelancerPortfolioList
        );


        showElement(
            freelancerPortfolioEmptyState
        );


        return;

    }


    validReferenceElements.forEach(
        (element) => {

            freelancerPortfolioList
                ?.appendChild(
                    element
                );

        }
    );


    showElement(
        freelancerPortfolioList
    );

}


/* =========================================================
   RENDER FREELANCER APPLICATION
========================================================= */

function renderFreelancerApplication(
    freelancer
) {

    setText(

        freelancerAvatar,

        getInitials(
            freelancer.fullName
        )

    );


    setText(

        freelancerName,

        freelancer.fullName

    );


    setText(

        freelancerProfessionalTitle,

        freelancer.professionalTitle

    );


    if (
        freelancerApprovalStatus
    ) {

        freelancerApprovalStatus.className =

            `admin-freelancer-status ${
                freelancer.approvalStatus
            }`;

    }


    setText(

        freelancerApprovalStatus,

        formatApprovalStatus(
            freelancer.approvalStatus
        )

    );


    setText(

        freelancerId,

        freelancer.id ||
        "Not available"

    );


    setText(

        freelancerRegisterNumber,

        freelancer.registerNumber ||
        "Not available"

    );


    setText(

        freelancerDepartment,

        freelancer.department ||
        "Not available"

    );


    setText(

        freelancerYear,

        freelancer.year ||
        "Not available"

    );


    setText(

        freelancerEmail,

        freelancer.email ||
        "Not available"

    );


    setText(

        freelancerSubmittedDate,

        formatDate(
            freelancer.createdAt
        )

    );


    setText(

        freelancerBio,

        freelancer.bio ||

        "No professional profile summary was provided."

    );


    renderTagList(

        freelancerServiceCategories,

        freelancer.serviceCategories,

        "admin-freelancer-category-tag",

        "No service categories provided"

    );


    renderTagList(

        freelancerSkills,

        freelancer.skills,

        "admin-freelancer-skill-tag",

        "No skills provided"

    );


    renderPortfolioReferences(
        freelancer.portfolioReferences
    );

}


/* =========================================================
   HIDE REVIEW PAGE STATES
========================================================= */

function hideReviewPageStates() {

    hideElement(
        freelancerReviewLoadingState
    );


    hideElement(
        freelancerReviewNotFoundState
    );


    hideElement(
        freelancerReviewErrorState
    );


    hideElement(
        freelancerReviewContent
    );

}


/* =========================================================
   SHOW FREELANCER NOT FOUND
========================================================= */

function showFreelancerNotFound() {

    hideReviewPageStates();


    showElement(
        freelancerReviewNotFoundState
    );

}


/* =========================================================
   SHOW FREELANCER ERROR
========================================================= */

function showFreelancerError(
    error
) {

    hideReviewPageStates();


    const message =
        cleanText(
            error?.message
        ) ||

        "An unexpected error occurred while loading the freelancer application.";


    setText(

        freelancerReviewErrorMessage,

        message

    );


    showElement(
        freelancerReviewErrorState
    );

}


/* =========================================================
   SHOW FREELANCER CONTENT
========================================================= */

function showFreelancerContent() {

    hideReviewPageStates();


    showElement(
        freelancerReviewContent
    );

}


/* =========================================================
   GET VERIFICATION CHECKBOXES
========================================================= */

function getVerificationCheckboxes() {

    return [

        campusIdentityCheck,

        professionalProfileCheck,

        skillsCheck,

        portfolioCheck

    ];

}


/* =========================================================
   CHECK VERIFICATION CHECKLIST
========================================================= */

function isVerificationChecklistComplete() {

    return getVerificationCheckboxes()
        .every(
            (checkbox) => {

                return Boolean(
                    checkbox?.checked
                );

            }
        );

}


/* =========================================================
   CLEAR DECISION MESSAGE
========================================================= */

function clearDecisionMessage() {

    if (
        !freelancerDecisionMessage
    ) {

        return;

    }


    freelancerDecisionMessage
        .classList
        .remove(
            "success",
            "error"
        );


    setText(

        freelancerDecisionMessage,

        ""

    );


    hideElement(
        freelancerDecisionMessage
    );

}


/* =========================================================
   SHOW DECISION MESSAGE
========================================================= */

function showDecisionMessage(
    message,
    type = "error"
) {

    if (
        !freelancerDecisionMessage
    ) {

        return;

    }


    freelancerDecisionMessage
        .classList
        .remove(
            "success",
            "error"
        );


    freelancerDecisionMessage
        .classList
        .add(
            type
        );


    setText(

        freelancerDecisionMessage,

        message

    );


    showElement(
        freelancerDecisionMessage
    );

}


/* =========================================================
   CLEAR REJECTION REASON ERROR
========================================================= */

function clearRejectionReasonError() {

    setText(

        freelancerRejectionReasonError,

        ""

    );


    freelancerRejectionReason
        ?.classList
        .remove(
            "input-error"
        );

}


/* =========================================================
   SHOW REJECTION REASON ERROR
========================================================= */

function showRejectionReasonError(
    message
) {

    setText(

        freelancerRejectionReasonError,

        message

    );


    freelancerRejectionReason
        ?.classList
        .add(
            "input-error"
        );

}


/* =========================================================
   UPDATE REJECTION CHARACTER COUNT
========================================================= */

function updateRejectionCharacterCount() {

    const value =
        freelancerRejectionReason
            ?.value || "";


    setText(

        freelancerRejectionReasonCount,

        `${value.length} / ${

            ADMIN_FREELANCER_REVIEW_CONFIG
                .REJECTION_REASON_MAX_LENGTH

        }`

    );

}


/* =========================================================
   VALIDATE APPROVAL
========================================================= */

function validateApproval() {

    clearDecisionMessage();


    clearRejectionReasonError();


    if (
        !currentFreelancer
    ) {

        showDecisionMessage(
            "The freelancer application is not available for review."
        );


        return false;

    }


    if (
        currentFreelancer
            .approvalStatus !==
        "pending"
    ) {

        showDecisionMessage(
            "Only pending freelancer applications can be approved."
        );


        return false;

    }


    if (
        !isVerificationChecklistComplete()
    ) {

        showDecisionMessage(
            "Complete all verification checklist items before approving this freelancer."
        );


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


    if (
        !currentFreelancer
    ) {

        showDecisionMessage(
            "The freelancer application is not available for review."
        );


        return false;

    }


    if (
        currentFreelancer
            .approvalStatus !==
        "pending"
    ) {

        showDecisionMessage(
            "Only pending freelancer applications can be rejected."
        );


        return false;

    }


    const reason =
        cleanText(
            freelancerRejectionReason
                ?.value
        );


    if (!reason) {

        showRejectionReasonError(
            "Enter a rejection reason before rejecting this freelancer application."
        );


        freelancerRejectionReason
            ?.focus();


        return false;

    }


    if (
        reason.length >

        ADMIN_FREELANCER_REVIEW_CONFIG
            .REJECTION_REASON_MAX_LENGTH
    ) {

        showRejectionReasonError(
            "The rejection reason exceeds the allowed character limit."
        );


        freelancerRejectionReason
            ?.focus();


        return false;

    }


    return true;

}


/* =========================================================
   SET DECISION BUTTON LOADING STATE
========================================================= */

function setDecisionButtonsLoading(
    isLoading,
    action = ""
) {

    const loading =
        Boolean(
            isLoading
        );


    if (
        approveFreelancerButton
    ) {

        approveFreelancerButton.disabled =
            loading;


        setText(

            approveFreelancerButton,

            loading &&
            action === "approve"

                ? "Approving..."

                : "Approve Freelancer"

        );

    }


    if (
        rejectFreelancerButton
    ) {

        rejectFreelancerButton.disabled =
            loading;


        setText(

            rejectFreelancerButton,

            loading &&
            action === "reject"

                ? "Rejecting..."

                : "Reject Freelancer"

        );

    }

}


/* =========================================================
   SAVE FREELANCER DECISION
========================================================= */

async function saveFreelancerDecision(
    decision,
    rejectionReasonValue = ""
) {

    if (
        !currentFreelancer?.id
    ) {

        throw new Error(
            "A valid freelancer application is required."
        );

    }


    if (
        !currentAdmin?.id
    ) {

        throw new Error(
            "A valid administrator profile is required."
        );

    }


    const nextStatus =

        decision === "approve"

            ? "approved"

            : "rejected";


    const updatePayload = {

        approval_status:
            nextStatus,

        rejection_reason:

            decision === "reject"

                ? cleanText(
                    rejectionReasonValue
                )

                : null,

        reviewed_by:
            currentAdmin.id,

        reviewed_at:
            new Date().toISOString()

    };


    const client =
        requireSupabaseClient();


    const {

        data,

        error

    } = await client

        .from(
            "freelancer_profiles"
        )

        .update(
            updatePayload
        )

        .eq(
            "id",
            currentFreelancer.id
        )

        .eq(
            "approval_status",
            "pending"
        )

        .select(
            ADMIN_FREELANCER_REVIEW_CONFIG
                .FREELANCER_COLUMNS
        )

        .maybeSingle();


    if (error) {

        throw error;

    }


    if (!data) {

        throw new Error(
            "The freelancer application is no longer available for review."
        );

    }


    return normalizeFreelancerApplication(
        data
    );

}


/* =========================================================
   DISABLE REVIEW CONTROLS
========================================================= */

function disableReviewControls() {

    getVerificationCheckboxes()
        .forEach(
            (checkbox) => {

                if (
                    checkbox
                ) {

                    checkbox.disabled =
                        true;

                }

            }
        );


    if (
        freelancerRejectionReason
    ) {

        freelancerRejectionReason.disabled =
            true;

    }


    if (
        approveFreelancerButton
    ) {

        approveFreelancerButton.disabled =
            true;

    }


    if (
        rejectFreelancerButton
    ) {

        rejectFreelancerButton.disabled =
            true;

    }

}


/* =========================================================
   RENDER COMPLETED DECISION
========================================================= */

function renderCompletedDecision(
    decision
) {

    freelancerReviewCompleted =
        true;


    disableReviewControls();


    clearDecisionMessage();


    if (
        decision === "approve"
    ) {

        setText(

            completedFreelancerDecisionLabel,

            "FREELANCER APPROVED"

        );


        setText(

            completedFreelancerDecisionTitle,

            "Freelancer application approved."

        );


        setText(

            completedFreelancerDecisionDescription,

            "The freelancer has been verified and the approved professional profile can now become available for campus services."

        );


    } else {

        setText(

            completedFreelancerDecisionLabel,

            "FREELANCER REJECTED"

        );


        setText(

            completedFreelancerDecisionTitle,

            "Freelancer application rejected."

        );


        setText(

            completedFreelancerDecisionDescription,

            "The freelancer application has been rejected and the administrative decision has been recorded."

        );

    }


    showElement(
        freelancerDecisionCompletedSection
    );


    freelancerDecisionCompletedSection
        ?.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

}


/* =========================================================
   HANDLE APPROVE FREELANCER
========================================================= */

async function handleApproveFreelancer() {

    if (

        decisionInProgress ||

        freelancerReviewCompleted ||

        !validateApproval()

    ) {

        return;

    }


    decisionInProgress = true;


    setDecisionButtonsLoading(
        true,
        "approve"
    );


    try {

        currentFreelancer =
            await saveFreelancerDecision(
                "approve"
            );


        renderFreelancerApplication(
            currentFreelancer
        );


        renderCompletedDecision(
            "approve"
        );


    } catch (error) {

        console.error(
            "Freelancer approval error:",
            error
        );


        showDecisionMessage(

            cleanText(
                error?.message
            ) ||

            "The freelancer application could not be approved."

        );


    } finally {

        decisionInProgress = false;


        if (
            !freelancerReviewCompleted
        ) {

            setDecisionButtonsLoading(
                false
            );

        }

    }

}


/* =========================================================
   HANDLE REJECT FREELANCER
========================================================= */

async function handleRejectFreelancer() {

    if (

        decisionInProgress ||

        freelancerReviewCompleted ||

        !validateRejection()

    ) {

        return;

    }


    const reason =
        cleanText(
            freelancerRejectionReason
                ?.value
        );


    decisionInProgress = true;


    setDecisionButtonsLoading(
        true,
        "reject"
    );


    try {

        currentFreelancer =
            await saveFreelancerDecision(

                "reject",

                reason

            );


        renderFreelancerApplication(
            currentFreelancer
        );


        renderCompletedDecision(
            "reject"
        );


    } catch (error) {

        console.error(
            "Freelancer rejection error:",
            error
        );


        showDecisionMessage(

            cleanText(
                error?.message
            ) ||

            "The freelancer application could not be rejected."

        );


    } finally {

        decisionInProgress = false;


        if (
            !freelancerReviewCompleted
        ) {

            setDecisionButtonsLoading(
                false
            );

        }

    }

}


/* =========================================================
   RESET REVIEW CONTROLS
========================================================= */

function resetReviewControls() {

    freelancerReviewCompleted =
        false;


    decisionInProgress =
        false;


    getVerificationCheckboxes()
        .forEach(
            (checkbox) => {

                if (
                    checkbox
                ) {

                    checkbox.checked =
                        false;


                    checkbox.disabled =
                        false;

                }

            }
        );


    if (
        freelancerRejectionReason
    ) {

        freelancerRejectionReason.value =
            "";


        freelancerRejectionReason.disabled =
            false;

    }


    setDecisionButtonsLoading(
        false
    );


    hideElement(
        freelancerDecisionCompletedSection
    );


    clearDecisionMessage();


    clearRejectionReasonError();


    updateRejectionCharacterCount();

}


/* =========================================================
   LOAD FREELANCER REVIEW
========================================================= */

async function loadFreelancerReview() {

    hideReviewPageStates();


    showElement(
        freelancerReviewLoadingState
    );


    resetReviewControls();


    currentFreelancer =
        null;


    try {

        const freelancerIdentifier =
            getFreelancerIdFromUrl();


        if (
            !freelancerIdentifier
        ) {

            showFreelancerNotFound();


            return;

        }


        currentFreelancer =
            await getFreelancerApplication(
                freelancerIdentifier
            );


        if (
            !currentFreelancer
        ) {

            showFreelancerNotFound();


            return;

        }


        renderFreelancerApplication(
            currentFreelancer
        );


        showFreelancerContent();


        if (
            currentFreelancer
                .approvalStatus !==
            "pending"
        ) {

            disableReviewControls();

        }


    } catch (error) {

        console.error(
            "Freelancer review loading error:",
            error
        );


        currentFreelancer =
            null;


        showFreelancerError(
            error
        );

    }

}


/* =========================================================
   NAVIGATE TO FREELANCER LIST
========================================================= */

function navigateToFreelancerList() {

    navigateTo(
        ROUTES.ADMIN_FREELANCERS
    );

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    backToFreelancersButton
        ?.addEventListener(

            "click",

            navigateToFreelancerList

        );


    returnToFreelancersButton
        ?.addEventListener(

            "click",

            navigateToFreelancerList

        );


    reviewNextFreelancerButton
        ?.addEventListener(

            "click",

            navigateToFreelancerList

        );


    retryFreelancerReviewButton
        ?.addEventListener(

            "click",

            loadFreelancerReview

        );


    freelancerRejectionReason
        ?.addEventListener(

            "input",

            () => {

                clearRejectionReasonError();


                updateRejectionCharacterCount();

            }

        );


    approveFreelancerButton
        ?.addEventListener(

            "click",

            handleApproveFreelancer

        );


    rejectFreelancerButton
        ?.addEventListener(

            "click",

            handleRejectFreelancer

        );

}


/* =========================================================
   INITIALIZE ADMIN FREELANCER REVIEW PAGE
========================================================= */

async function initializeAdminFreelancerReviewPage(
    administratorProfile
) {

    try {

        currentAdmin =
            administratorProfile;


        populateAdminNavbar(
            currentAdmin
        );


        initializeEventListeners();


        updateRejectionCharacterCount();


        await loadFreelancerReview();


    } catch (error) {

        console.error(
            "Admin freelancer review initialization error:",
            error
        );


        showFreelancerError(
            error
        );

    }

}


/* =========================================================
   ADMINISTRATOR PAGE INITIALIZATION
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeAdministratorPage(
            initializeAdminFreelancerReviewPage
        );

    }

);