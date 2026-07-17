/* =========================================================
   KPRIET FREELANCER PLATFORM
   Client Request Details Logic
   File: js/client/request-details.js
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

const REQUEST_DETAILS_CONFIG =
    Object.freeze({

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
            budget,
            deadline,
            required_skills,
            status,
            created_at,
            updated_at

        `,


        WORK_COLUMNS: `

            id,
            service_request_id,
            freelancer_id,
            progress_percentage,
            status,
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


/* ---------------------------------------------------------
   PAGE ACTIONS
--------------------------------------------------------- */

const backToRequestsButton =
    document.getElementById(
        "backToRequestsButton"
    );


const clientDashboardButton =
    document.getElementById(
        "clientDashboardButton"
    );


const errorBackToRequestsButton =
    document.getElementById(
        "errorBackToRequestsButton"
    );


/* ---------------------------------------------------------
   PAGE STATES
--------------------------------------------------------- */

const requestDetailsLoadingState =
    document.getElementById(
        "requestDetailsLoadingState"
    );


const requestDetailsErrorState =
    document.getElementById(
        "requestDetailsErrorState"
    );


const requestDetailsErrorMessage =
    document.getElementById(
        "requestDetailsErrorMessage"
    );


const requestDetailsContent =
    document.getElementById(
        "requestDetailsContent"
    );


/* ---------------------------------------------------------
   REQUEST DETAILS
--------------------------------------------------------- */

const requestCategory =
    document.getElementById(
        "requestCategory"
    );


const requestTitle =
    document.getElementById(
        "requestTitle"
    );


const requestStatus =
    document.getElementById(
        "requestStatus"
    );


const requestDescription =
    document.getElementById(
        "requestDescription"
    );


const requestBudget =
    document.getElementById(
        "requestBudget"
    );


const requestDeadline =
    document.getElementById(
        "requestDeadline"
    );


const requestSubmittedDate =
    document.getElementById(
        "requestSubmittedDate"
    );


const requestUpdatedDate =
    document.getElementById(
        "requestUpdatedDate"
    );


/* ---------------------------------------------------------
   REQUEST PROGRESS
--------------------------------------------------------- */

const underReviewProgressStep =
    document.getElementById(
        "underReviewProgressStep"
    );


const matchingProgressStep =
    document.getElementById(
        "matchingProgressStep"
    );


const activeProgressStep =
    document.getElementById(
        "activeProgressStep"
    );


const completedProgressStep =
    document.getElementById(
        "completedProgressStep"
    );


/* ---------------------------------------------------------
   ACCEPTED FREELANCERS
--------------------------------------------------------- */

const acceptedFreelancersSection =
    document.getElementById(
        "acceptedFreelancersSection"
    );


const acceptedFreelancersList =
    document.getElementById(
        "acceptedFreelancersList"
    );


/* ---------------------------------------------------------
   WORK PROGRESS
--------------------------------------------------------- */

const workProgressSection =
    document.getElementById(
        "workProgressSection"
    );


const workProgressLabel =
    document.getElementById(
        "workProgressLabel"
    );


const workProgressPercentage =
    document.getElementById(
        "workProgressPercentage"
    );


const workProgressBar =
    document.getElementById(
        "workProgressBar"
    );


const workProgressDescription =
    document.getElementById(
        "workProgressDescription"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let currentRequest = null;

let acceptedFreelancers = [];

let currentWork = null;


/* =========================================================
   GET REQUEST ID
========================================================= */

function getRequestIdFromUrl() {

    const searchParameters =
        new URLSearchParams(
            window.location.search
        );


    return cleanText(
        searchParameters.get(
            "request"
        )
    );

}


/* =========================================================
   GET CURRENT USER PROFILE
========================================================= */

async function getCurrentUserProfile(
    authenticatedUser
) {

    if (
        !authenticatedUser?.id
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
            "profiles"
        )

        .select(
            REQUEST_DETAILS_CONFIG
                .PROFILE_COLUMNS
        )

        .eq(
            "id",
            authenticatedUser.id
        )

        .maybeSingle();


    if (
        error
    ) {

        throw error;

    }


    return data ?? null;

}


/* =========================================================
   NORMALIZE REQUEST STATUS
========================================================= */

function normalizeRequestStatus(
    statusValue
) {

    const normalizedStatus =
        cleanText(
            statusValue
        )

            .toLowerCase()

            .replace(
                /[\s-]+/g,
                "_"
            );


    const statusMap = {

        pending:
            "under_review",

        submitted:
            "under_review",

        under_review:
            "under_review",

        approved:
            "matching",

        waiting:
            "matching",

        waiting_for_match:
            "matching",

        freelancer_matching:
            "matching",

        matching:
            "matching",

        matched:
            "matching",

        assigned:
            "matching",

        freelancer_assigned:
            "matching",

        active:
            "active",

        active_work:
            "active",

        in_progress:
            "active",

        completed:
            "completed",

        rejected:
            "rejected"

    };


    return (

        statusMap[
            normalizedStatus
        ]

        ||

        normalizedStatus

        ||

        "under_review"

    );

}


/* =========================================================
   NORMALIZE REQUEST
========================================================= */

function normalizeRequest(
    request
) {

    if (
        !request
    ) {

        return null;

    }


    return {

        id:
            cleanText(
                request.id
            ),

        clientId:
            cleanText(
                request.client_id
            ),

        title:
            cleanText(
                request.title
            ) ||
            "Service Request",

        category:
            cleanText(
                request.service_category
            ) ||
            "Campus Service",

        description:
            cleanText(
                request.description
            ),

        budget:
            Number(
                request.budget
            ),

        deadline:
            request.deadline ??
            null,

        requiredSkills:
            normalizeStringArray(
                request.required_skills
            ),

        status:
            normalizeRequestStatus(
                request.status
            ),

        createdAt:
            request.created_at ??
            null,

        updatedAt:
            request.updated_at ??
            null

    };

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

        return value

            .map(
                (item) => {

                    return cleanText(
                        item
                    );

                }
            )

            .filter(
                Boolean
            );

    }


    const safeValue =
        cleanText(
            value
        );


    if (
        !safeValue
    ) {

        return [];

    }


    return safeValue

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
        );

}


/* =========================================================
   GET REQUEST DETAILS
========================================================= */

async function getRequestDetails(
    requestId,
    clientId
) {

    const safeRequestId =
        cleanText(
            requestId
        );


    const safeClientId =
        cleanText(
            clientId
        );


    if (

        !safeRequestId ||

        !safeClientId

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
            "service_requests"
        )

        .select(
            REQUEST_DETAILS_CONFIG
                .REQUEST_COLUMNS
        )

        .eq(
            "id",
            safeRequestId
        )

        .eq(
            "client_id",
            safeClientId
        )

        .maybeSingle();


    if (
        error
    ) {

        throw error;

    }


    return normalizeRequest(
        data
    );

}


/* =========================================================
   GET ACCEPTED FREELANCERS
========================================================= */

async function getAcceptedFreelancers(
    requestId
) {

    console.groupCollapsed("[Request Details] Accepted Freelancers");

    const safeRequestId =
        cleanText(
            requestId
        );


    if (
        !safeRequestId
    ) {

        console.groupEnd();
        return [];

    }


    const client =
        requireSupabaseClient();


    // 1. Fetch assignments
    const {

        data: assignments,

        error: assignmentsError

    } = await client

        .from(
            "service_assignments"
        )

        .select(
            "id, request_id, freelancer_id, status"
        )

        .eq(
            "request_id",
            safeRequestId
        )

        .eq(
            "status",
            "accepted"
        );


    console.log("[Request Details] Assignments", assignments, assignmentsError);


    if (
        assignmentsError
    ) {

        console.groupEnd();
        throw assignmentsError;

    }


    if (
        !assignments ||
        assignments.length === 0
    ) {

        console.groupEnd();
        return [];

    }


    const freelancerIds =
        assignments
            .map(
                (assignment) =>
                    assignment.freelancer_id
            )
            .filter(
                Boolean
            );


    if (
        freelancerIds.length ===
        0
    ) {

        console.groupEnd();
        return [];

    }


    // 2. Fetch profiles and freelancer profiles in parallel
    const [

        profilesResponse,

        freelancerProfilesResponse

    ] = await Promise.all([

        client
            .from(
                "profiles"
            )
            .select(
                "id, full_name, email, department, academic_year, section, profile_photo_url"
            )
            .in(
                "id",
                freelancerIds
            ),

        client
            .from(
                "freelancer_profiles"
            )
            .select(
                "id, user_id, professional_title, skills"
            )
            .in(
                "user_id",
                freelancerIds
            )

    ]);


    console.log("[Request Details] Profiles", profilesResponse.data, profilesResponse.error);
    console.log("[Request Details] Freelancer Profiles", freelancerProfilesResponse.data, freelancerProfilesResponse.error);


    if (
        profilesResponse.error
    ) {

        console.groupEnd();
        throw profilesResponse.error;

    }


    if (
        freelancerProfilesResponse.error
    ) {

        console.groupEnd();
        throw freelancerProfilesResponse.error;

    }


    const profiles =
        profilesResponse.data ?? [];


    const freelancerProfiles =
        freelancerProfilesResponse.data ?? [];


    // Map user_id to freelancer profile
    const freelancerProfilesMap =
        {};


    freelancerProfiles.forEach(
        (fp) => {

            freelancerProfilesMap[fp.user_id] =
                fp;

        }
    );


    // Map user_id to profile
    const profilesMap =
        {};


    profiles.forEach(
        (p) => {

            profilesMap[p.id] =
                p;

        }
    );


    const finalMapped = freelancerIds
        .map(
            (freelancerId) => {

                const profile =
                    profilesMap[freelancerId];


                const freelancerProfile =
                    freelancerProfilesMap[freelancerId];


                if (
                    !profile ||
                    !freelancerProfile
                ) {

                    console.log("Missing profile for freelancer:", freelancerId, profile, freelancerProfile);
                    return null;

                }


                return {

                    id:
                        cleanText(
                            freelancerProfile.id
                        ),

                    userId:
                        cleanText(
                            freelancerId
                        ),

                    fullName:
                        cleanText(
                            profile.full_name
                        ) ||
                        "Campus Freelancer",

                    professionalTitle:
                        cleanText(
                            freelancerProfile.professional_title
                        ),

                    department:
                        cleanText(
                            profile.department
                        ),

                    academicYear:
                        cleanText(
                            profile.academic_year
                        ),

                    section:
                        cleanText(
                            profile.section
                        ),

                    skills:
                        normalizeStringArray(
                            freelancerProfile.skills
                        ),

                    profilePhotoUrl:
                        cleanText(
                            profile.profile_photo_url
                        ),

                    email:
                        cleanText(
                            profile.email
                        )

                };

            }
        )
        .filter(
            Boolean
        );


    console.log("[Request Details] Final Accepted Freelancers", freelancerIds, profilesMap, freelancerProfilesMap, finalMapped);
    console.groupEnd();

    return finalMapped;

}


/* =========================================================
   NORMALIZE WORK
========================================================= */

function normalizeWork(
    work
) {

    if (
        !work
    ) {

        return null;

    }


    return {

        id:
            cleanText(
                work.id
            ),

        serviceRequestId:
            cleanText(
                work.service_request_id
            ),

        freelancerId:
            cleanText(
                work.freelancer_id
            ),

        progressPercentage:
            normalizeWorkProgress(
                work.progress_percentage
            ),

        status:
            cleanText(
                work.status
            ).toLowerCase(),

        createdAt:
            work.created_at ??
            null,

        updatedAt:
            work.updated_at ??
            null

    };

}


/* =========================================================
   GET REQUEST WORK
========================================================= */

async function getRequestWork(
    requestId
) {

    const safeRequestId =
        cleanText(
            requestId
        );


    if (
        !safeRequestId
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
            "works"
        )

        .select(
            REQUEST_DETAILS_CONFIG
                .WORK_COLUMNS
        )

        .eq(
            "service_request_id",
            safeRequestId
        )

        .maybeSingle();


    if (
        error
    ) {

        throw error;

    }


    return normalizeWork(
        data
    );

}


/* =========================================================
   APPLY BACKGROUND PHOTO
========================================================= */

function applyBackgroundPhoto(
    element,
    profilePhotoUrl
) {

    if (
        !element
    ) {

        return;

    }


    const photoUrl =
        cleanText(
            profilePhotoUrl
        );


    element.style.backgroundImage =
        "";


    element.style.backgroundSize =
        "";


    element.style.backgroundPosition =
        "";


    element.style.backgroundRepeat =
        "";


    if (
        !photoUrl
    ) {

        return;

    }


    try {

        const parsedUrl =
            new URL(
                photoUrl
            );


        if (

            parsedUrl.protocol !==
            "http:" &&

            parsedUrl.protocol !==
            "https:"

        ) {

            return;

        }


        element.style.backgroundImage =
            `url("${parsedUrl.href}")`;


        element.style.backgroundSize =
            "cover";


        element.style.backgroundPosition =
            "center";


        element.style.backgroundRepeat =
            "no-repeat";


        element.textContent =
            "";


    } catch (error) {

        console.warn(
            "Invalid profile photo URL:",
            error
        );

    }

}


/* =========================================================
   POPULATE NAVBAR
========================================================= */

function populateNavbar(
    user
) {

    if (
        !user
    ) {

        return;

    }


    const fullName =
        cleanText(
            user.full_name
        ) ||
        "Campus User";


    setText(

        navbarUserName,

        fullName

    );


    setText(

        navbarUserRole,

        createNavbarRole(
            user
        ) ||
        "KPRIET USER"

    );


    setText(

        navbarUserAvatar,

        getInitials(
            fullName
        )

    );


    applyBackgroundPhoto(

        navbarUserAvatar,

        user.profile_photo_url

    );

}


/* =========================================================
   FORMAT REQUEST STATUS
========================================================= */

function formatRequestStatus(
    statusValue
) {

    const status =
        normalizeRequestStatus(
            statusValue
        );


    const labels = {

        under_review:
            "Under Review",

        matching:
            "Freelancer Matching",

        active:
            "Active Work",

        completed:
            "Completed",

        rejected:
            "Rejected"

    };


    return (

        labels[
            status
        ]

        ||

        "Submitted"

    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    dateValue
) {

    if (
        !dateValue
    ) {

        return "Not specified";

    }


    const date =
        new Date(
            dateValue
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
   FORMAT BUDGET
========================================================= */

function formatBudget(
    budgetValue
) {

    const safeBudget =
        Number(
            budgetValue
        );


    if (

        !Number.isFinite(
            safeBudget
        )

        ||

        safeBudget < 0

    ) {

        return "Not specified";

    }


    return new Intl.NumberFormat(

        "en-IN",

        {

            style:
                "currency",

            currency:
                "INR",

            maximumFractionDigits:
                0

        }

    ).format(
        safeBudget
    );

}


/* =========================================================
   GET PROGRESS LEVEL
========================================================= */

function getRequestProgressLevel(
    requestStatusValue
) {

    const status =
        normalizeRequestStatus(
            requestStatusValue
        );


    const progressLevels = {

        under_review:
            1,

        matching:
            2,

        active:
            3,

        completed:
            4

    };


    return (

        progressLevels[
            status
        ]

        ||

        0

    );

}


/* =========================================================
   RESET PROGRESS STEPS
========================================================= */

function resetProgressSteps() {

    [

        underReviewProgressStep,

        matchingProgressStep,

        activeProgressStep,

        completedProgressStep

    ].forEach(
        (step) => {

            step?.classList.remove(
                "active",
                "completed"
            );

        }
    );

}


/* =========================================================
   RENDER REQUEST PROGRESS
========================================================= */

function renderRequestProgress() {

    resetProgressSteps();


    const progressLevel =
        getRequestProgressLevel(
            currentRequest.status
        );


    const progressSteps = [

        underReviewProgressStep,

        matchingProgressStep,

        activeProgressStep,

        completedProgressStep

    ];


    progressSteps.forEach(
        (
            step,
            index
        ) => {

            if (
                !step
            ) {

                return;

            }


            const stepLevel =
                index + 1;


            if (
                stepLevel <
                progressLevel
            ) {

                step.classList.add(
                    "completed"
                );


                return;

            }


            if (
                stepLevel ===
                progressLevel
            ) {

                step.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   RENDER REQUEST DETAILS
========================================================= */

function renderRequestDetails() {

    const normalizedStatus =
        normalizeRequestStatus(
            currentRequest.status
        );


    setText(

        requestCategory,

        currentRequest.category

    );


    setText(

        requestTitle,

        currentRequest.title

    );


    setText(

        requestStatus,

        formatRequestStatus(
            currentRequest.status
        )

    );


    if (
        requestStatus
    ) {

        requestStatus.className =

            `client-request-status ${
                normalizedStatus
            }`;

    }


    setText(

        requestDescription,

        currentRequest.description ||

        "Service request description unavailable."

    );


    setText(

        requestBudget,

        formatBudget(
            currentRequest.budget
        )

    );


    setText(

        requestDeadline,

        formatDate(
            currentRequest.deadline
        )

    );


    setText(

        requestSubmittedDate,

        formatDate(
            currentRequest.createdAt
        )

    );


    setText(

        requestUpdatedDate,

        formatDate(
            currentRequest.updatedAt
        )

    );


    renderRequestProgress();

}


/* =========================================================
   CREATE FREELANCER IDENTITY
========================================================= */

function createFreelancerIdentity(
    freelancer
) {

    const department =
        cleanText(
            freelancer.department
        ).toUpperCase();


    const academicYear =
        cleanText(
            freelancer.academicYear
        ).toUpperCase();


    const section =
        cleanText(
            freelancer.section
        ).toUpperCase();


    const parts = [

        department,

        academicYear
            ? `${academicYear} YEAR`
            : "",

        section
            ? `SECTION ${section}`
            : ""

    ].filter(
        Boolean
    );


    return (

        parts.join(
            " · "
        )

        ||

        "KPRIET Freelancer"

    );

}


/* =========================================================
   RENDER ACCEPTED FREELANCERS
========================================================= */

function renderAcceptedFreelancers() {

    if (
        !acceptedFreelancersList
    ) {

        return;

    }


    acceptedFreelancersList
        .replaceChildren();


    if (
        acceptedFreelancers.length ===
        0
    ) {

        const emptyCard =
            document.createElement(
                "div"
            );


        emptyCard.className =
            "card";


        const message =
            document.createElement(
                "p"
            );


        message.style.textAlign =
            "center";


        message.style.color =
            "var(--color-text-secondary, #8a96a3)";


        message.style.padding =
            "2rem 0";


        message.textContent =
            "No freelancer has accepted this request yet.";


        emptyCard.appendChild(
            message
        );


        acceptedFreelancersList
            .appendChild(
                emptyCard
            );


        return;

    }


    const fragment =
        document.createDocumentFragment();


    acceptedFreelancers.forEach(
        (freelancer) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "card";


            const innerContainer =
                document.createElement(
                    "div"
                );


            innerContainer.className =
                "client-assigned-freelancer";


            // Avatar
            const avatar =
                document.createElement(
                    "div"
                );


            avatar.className =
                "user-avatar";


            avatar.setAttribute(
                "aria-label",
                "Freelancer profile"
            );


            avatar.textContent =
                getInitials(
                    freelancer.fullName
                );


            applyBackgroundPhoto(
                avatar,
                freelancer.profilePhotoUrl
            );


            // Content container
            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "client-assigned-freelancer-content";


            const label =
                document.createElement(
                    "span"
                );


            label.className =
                "section-label";


            label.textContent =
                "CAMPUS FREELANCER";


            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                freelancer.fullName;


            const professionalTitle =
                document.createElement(
                    "p"
                );


            professionalTitle.style.fontWeight =
                "600";


            professionalTitle.style.color =
                "var(--color-text-primary, #1f2933)";


            professionalTitle.style.margin =
                "4px 0";


            professionalTitle.textContent =
                freelancer.professionalTitle ||
                "Freelancer";


            const identity =
                document.createElement(
                    "p"
                );


            identity.textContent =
                createFreelancerIdentity(
                    freelancer
                );


            const skills =
                document.createElement(
                    "p"
                );


            skills.style.fontSize =
                "0.82rem";


            skills.style.color =
                "var(--color-text-secondary, #8a96a3)";


            skills.style.margin =
                "6px 0";


            skills.textContent =
                freelancer.skills.length > 0
                    ? `Skills: ${freelancer.skills.join(" · ")}`
                    : "Skills unavailable";


            const contactEmail =
                document.createElement(
                    "p"
                );


            contactEmail.style.fontSize =
                "0.82rem";


            contactEmail.style.color =
                "var(--color-primary, #72b9e6)";


            contactEmail.style.marginTop =
                "6px";


            contactEmail.style.fontWeight =
                "500";


            contactEmail.textContent =
                freelancer.email
                    ? `Contact: ${freelancer.email}`
                    : "Contact email unavailable";


            content.append(
                label,
                name,
                professionalTitle,
                identity,
                skills,
                contactEmail
            );


            // View Profile Button
            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "button button-secondary";


            button.textContent =
                "View Freelancer Profile";


            button.addEventListener(
                "click",
                () => {

                    openFreelancerProfile(freelancer);

                }
            );


            innerContainer.append(
                avatar,
                content,
                button
            );


            card.appendChild(
                innerContainer
            );


            fragment.appendChild(
                card
            );

        }
    );


    acceptedFreelancersList
        .appendChild(
            fragment
        );

}


/* =========================================================
   NORMALIZE WORK PROGRESS
========================================================= */

function normalizeWorkProgress(
    progressValue
) {

    const progress =
        Number(
            progressValue
        );


    if (
        !Number.isFinite(
            progress
        )
    ) {

        return 0;

    }


    return Math.min(

        100,

        Math.max(

            0,

            Math.round(
                progress
            )

        )

    );

}


/* =========================================================
   CREATE WORK PROGRESS LABEL
========================================================= */

function createWorkProgressLabel(
    progress
) {

    if (
        progress >= 100
    ) {

        return "Work completed";

    }


    if (
        progress >= 75
    ) {

        return "Final stage";

    }


    if (
        progress >= 50
    ) {

        return "Development in progress";

    }


    if (
        progress >= 25
    ) {

        return "Work underway";

    }


    if (
        progress > 0
    ) {

        return "Work started";

    }


    return "Work preparation";

}


/* =========================================================
   CREATE WORK PROGRESS DESCRIPTION
========================================================= */

function createWorkProgressDescription(
    progress
) {

    if (
        progress >= 100
    ) {

        return "The assigned freelancer has completed the freelance service through the platform.";

    }


    if (
        progress >= 75
    ) {

        return "The assigned freelancer is working on the final stage of this service request.";

    }


    if (
        progress >= 50
    ) {

        return "The service work is actively progressing and has crossed the midpoint.";

    }


    if (
        progress >= 25
    ) {

        return "The assigned freelancer is actively working on the service requirement.";

    }


    if (
        progress > 0
    ) {

        return "The assigned freelancer has started working on this service request.";

    }


    return "The assigned freelancer is preparing to begin the service work.";

}


/* =========================================================
   RENDER WORK PROGRESS
========================================================= */

function renderWorkProgress() {

    if (

        currentRequest.status !==
        "active"

        &&

        currentRequest.status !==
        "completed"

    ) {

        hideElement(
            workProgressSection
        );


        return;

    }


    const progress =

        currentRequest.status ===
        "completed"

            ? 100

            : normalizeWorkProgress(
                currentWork
                    ?.progressPercentage
            );


    setText(

        workProgressLabel,

        createWorkProgressLabel(
            progress
        )

    );


    setText(

        workProgressPercentage,

        `${progress}%`

    );


    setText(

        workProgressDescription,

        createWorkProgressDescription(
            progress
        )

    );


    if (
        workProgressBar
    ) {

        workProgressBar.style.width =
            `${progress}%`;


        workProgressBar.setAttribute(

            "aria-valuenow",

            String(
                progress
            )

        );

    }


    showElement(
        workProgressSection
    );

}


/* =========================================================
   SHOW REQUEST ERROR
========================================================= */

function showRequestError(
    message
) {

    hideElement(
        requestDetailsLoadingState
    );


    hideElement(
        requestDetailsContent
    );


    setText(

        requestDetailsErrorMessage,

        message

    );


    showElement(
        requestDetailsErrorState
    );

}


/* =========================================================
   SHOW REQUEST CONTENT
========================================================= */

function showRequestContent() {

    hideElement(
        requestDetailsLoadingState
    );


    hideElement(
        requestDetailsErrorState
    );


    showElement(
        requestDetailsContent
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function openFreelancerProfile(
    assignedFreelancer
) {

    if (
        !assignedFreelancer ||
        !assignedFreelancer.id
    ) {

        return;

    }


    navigateTo(
        ROUTES.FREELANCER_PROFILE,
        {

            id:
                assignedFreelancer.id

        }
    );

}


function openMyRequests() {

    navigateTo(
        ROUTES.MY_REQUESTS
    );

}


function openClientDashboard() {

    navigateTo(
        ROUTES.CLIENT_DASHBOARD
    );

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    backToRequestsButton
        ?.addEventListener(
            "click",
            openMyRequests
        );


    errorBackToRequestsButton
        ?.addEventListener(
            "click",
            openMyRequests
        );


    clientDashboardButton
        ?.addEventListener(
            "click",
            openClientDashboard
        );

}


/* =========================================================
   INITIALIZE REQUEST DETAILS PAGE
========================================================= */

async function initializeRequestDetailsPage(
    authenticatedUser
) {

    initializeEventListeners();


    const requestId =
        getRequestIdFromUrl();


    if (
        !requestId
    ) {

        showRequestError(
            "The service request identifier is missing."
        );


        return;

    }


    try {

        currentUser =
            await getCurrentUserProfile(
                authenticatedUser
            );


        if (
            !currentUser
        ) {

            navigateTo(
                ROUTES.PROFILE_SETUP
            );


            return;

        }


        populateNavbar(
            currentUser
        );


        currentRequest =
            await getRequestDetails(

                requestId,

                currentUser.id

            );


        if (
            !currentRequest
        ) {

            showRequestError(
                "The requested service request could not be found."
            );


            return;

        }


        renderRequestDetails();


        acceptedFreelancers =
            await getAcceptedFreelancers(
                currentRequest.id
            );


        renderAcceptedFreelancers();


        if (

            currentRequest.status ===
            "active"

            ||

            currentRequest.status ===
            "completed"

        ) {

            currentWork =
                await getRequestWork(
                    currentRequest.id
                );

        }


        renderWorkProgress();


        showRequestContent();


    } catch (error) {

        console.error(
            "Request details initialization error:",
            error
        );


        showRequestError(
            "Unable to load the service request. Please try again."
        );

    }

}


/* =========================================================
   AUTHENTICATED PAGE INITIALIZATION
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeAuthenticatedPage(
            initializeRequestDetailsPage
        );

    }

);
