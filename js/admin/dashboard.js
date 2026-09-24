/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Dashboard Logic
   File: js/admin/dashboard.js
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

    navigateTo,

    navigateWithQuery

} from "../utils/navigation.js";


import {

    initializeAuthenticatedPage

} from "../auth/auth-guard.js";


/* =========================================================
   ADMIN DASHBOARD CONFIGURATION
========================================================= */

const ADMIN_DASHBOARD_CONFIG = Object.freeze({

    ATTENTION_ITEM_LIMIT: 6

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


const serviceRequestsCard =
    document.getElementById(
        "serviceRequestsCard"
    );


const freelancerApprovalsCard =
    document.getElementById(
        "freelancerApprovalsCard"
    );


const freelancerMatchingCard =
    document.getElementById(
        "freelancerMatchingCard"
    );


const mainDashboardCard =
    document.getElementById(
        "mainDashboardCard"
    );


const pendingRequestsCount =
    document.getElementById(
        "pendingRequestsCount"
    );


const pendingFreelancersCount =
    document.getElementById(
        "pendingFreelancersCount"
    );


const awaitingMatchingCount =
    document.getElementById(
        "awaitingMatchingCount"
    );


const activeWorksCount =
    document.getElementById(
        "activeWorksCount"
    );


const viewAllRequestsButton =
    document.getElementById(
        "viewAllRequestsButton"
    );


const adminAttentionLoadingState =
    document.getElementById(
        "adminAttentionLoadingState"
    );


const adminAttentionList =
    document.getElementById(
        "adminAttentionList"
    );


const adminAttentionEmptyState =
    document.getElementById(
        "adminAttentionEmptyState"
    );


/* =========================================================
   ADMIN DASHBOARD STATE
========================================================= */

let currentAdmin = null;


let dashboardOverview = {

    pendingRequests: 0,

    pendingFreelancers: 0,

    awaitingMatching: 0,

    activeWorks: 0

};


let attentionItems = [];


/* =========================================================
   NORMALIZE ADMIN

   FIX:
   Authorization has migrated from the legacy "role" column
   to the boolean "is_admin" column (matching js/auth/login.js).
   "role" is no longer queried or trusted here.
========================================================= */

function normalizeAdmin(
    profile
) {

    if (!profile) {

        return null;

    }


    return {

        id:
            profile.id ?? "",

        fullName:
            cleanText(
                profile.full_name
            ) ||
            "Platform Administrator",

        isAdmin:
            profile.is_admin === true

    };

}


/* =========================================================
   GET CURRENT ADMIN

   FIX:
   Queries "is_admin" instead of the legacy "role" column,
   and no longer requires a matching role string. A profile
   is only returned as an admin when is_admin === true,
   otherwise null is returned so isAdminUser() correctly
   denies access.
========================================================= */

async function getCurrentAdmin(
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

        .select(`
            id,
            full_name,
            is_admin
        `)

        .eq(
            "id",
            authenticatedUser.id
        )

        .maybeSingle();


    if (error) {

        throw error;

    }


    if (
        !data ||
        data.is_admin !== true
    ) {

        return null;

    }


    return normalizeAdmin(
        data
    );

}


/* =========================================================
   VERIFY ADMIN ACCESS

   FIX:
   Validates using the is_admin boolean instead of the
   legacy role string comparison.
========================================================= */

function isAdminUser(
    admin
) {

    if (!admin) {

        return false;

    }


    return admin.isAdmin === true;

}


/* =========================================================
   REDIRECT NON-ADMIN USER
========================================================= */

function redirectNonAdminUser() {

    navigateTo(
        ROUTES.MAIN_DASHBOARD
    );

}


/* =========================================================
   POPULATE ADMIN NAVBAR
========================================================= */

function populateAdminNavbar(
    admin
) {

    if (!admin) {

        return;

    }


    const adminName =
        admin.fullName ||
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
   CHECK SUPABASE RESULT
========================================================= */

function throwIfResultFailed(
    result
) {

    if (
        result?.error
    ) {

        throw result.error;

    }

}


/* =========================================================
   GET DASHBOARD OVERVIEW
========================================================= */

async function getDashboardOverview() {

    const client =
        requireSupabaseClient();


    const [

        pendingRequestResult,

        pendingFreelancerResult,

        matchingResult,

        activeWorkResult

    ] = await Promise.all([


        client

            .from(
                "service_requests"
            )

            .select(
                "id",
                {

                    count: "exact",

                    head: true

                }
            )

            .eq(
                "status",
                "under_review"
            ),


        client

            .from(
                "freelancer_profiles"
            )

            .select(
                "id",
                {

                    count: "exact",

                    head: true

                }
            )

            .eq(
                "approval_status",
                "pending"
            ),


        client

            .from(
                "service_requests"
            )

            .select(
                "id",
                {

                    count: "exact",

                    head: true

                }
            )

            .eq(
                "status",
                "matching"
            ),


        client

            .from(
                "service_assignments"
            )

            .select(
                "id",
                {

                    count: "exact",

                    head: true

                }
            )

            .eq(
                "status",
                "active"
            )

    ]);


    [

        pendingRequestResult,

        pendingFreelancerResult,

        matchingResult,

        activeWorkResult

    ].forEach(
        throwIfResultFailed
    );


    return {

        pendingRequests:
            pendingRequestResult
                .count ?? 0,

        pendingFreelancers:
            pendingFreelancerResult
                .count ?? 0,

        awaitingMatching:
            matchingResult
                .count ?? 0,

        activeWorks:
            activeWorkResult
                .count ?? 0

    };

}


/* =========================================================
   RENDER DASHBOARD OVERVIEW
========================================================= */

function renderDashboardOverview(
    overview
) {

    const safeOverview =
        overview ?? {};


    setText(

        pendingRequestsCount,

        String(
            safeOverview
                .pendingRequests ?? 0
        )

    );


    setText(

        pendingFreelancersCount,

        String(
            safeOverview
                .pendingFreelancers ?? 0
        )

    );


    setText(

        awaitingMatchingCount,

        String(
            safeOverview
                .awaitingMatching ?? 0
        )

    );


    setText(

        activeWorksCount,

        String(
            safeOverview
                .activeWorks ?? 0
        )

    );

}


/* =========================================================
   GET ADMIN ATTENTION ITEMS

   FIX:
   The service_requests table's category column is named
   "service_category" (matching js/admin/requests.js's
   ADMIN_REQUEST_CONFIG.REQUEST_COLUMNS), not "category".
   Selecting "category" previously caused Supabase to
   reject the query (400 — column does not exist), which
   rejected the surrounding Promise.all and silently
   zeroed out this dashboard's attention list and stat
   counts. Both the select() and the later .map() that
   reads the value have been corrected to use
   "service_category".
========================================================= */

async function getAdminAttentionItems() {

    const client =
        requireSupabaseClient();


    const [

        requestResult,

        freelancerResult

    ] = await Promise.all([


        client

            .from(
                "service_requests"
            )

            .select(`
                id,
                title,
                service_category,
                created_at
            `)

            .eq(
                "status",
                "under_review"
            )

            .order(
                "created_at",
                {

                    ascending: false

                }
            )

            .limit(
                ADMIN_DASHBOARD_CONFIG
                    .ATTENTION_ITEM_LIMIT
            ),


        client

            .from(
                "freelancer_profiles"
            )

            .select(`
                id,
                professional_title,
                created_at,
                profiles (
                    full_name
                )
            `)

            .eq(
                "approval_status",
                "pending"
            )

            .order(
                "created_at",
                {

                    ascending: false

                }
            )

            .limit(
                ADMIN_DASHBOARD_CONFIG
                    .ATTENTION_ITEM_LIMIT
            )

    ]);


    throwIfResultFailed(
        requestResult
    );


    throwIfResultFailed(
        freelancerResult
    );


    const requestItems =
        (
            requestResult.data ?? []
        ).map(
            (request) => ({

                id:
                    request.id,

                type:
                    "request",

                label:
                    cleanText(
                        request.service_category
                    ) ||
                    "SERVICE REQUEST",

                title:
                    cleanText(
                        request.title
                    ) ||
                    "Service Request",

                createdAt:
                    request.created_at

            })
        );


    const freelancerItems =
        (
            freelancerResult.data ?? []
        ).map(
            (freelancer) => ({

                id:
                    freelancer.id,

                type:
                    "freelancer",

                label:
                    "FREELANCER REGISTRATION",

                title:
                    cleanText(
                        freelancer
                            .profiles
                            ?.full_name
                    ) ||
                    cleanText(
                        freelancer
                            .professional_title
                    ) ||
                    "Freelancer Registration",

                createdAt:
                    freelancer.created_at

            })
        );


    return [

        ...requestItems,

        ...freelancerItems

    ]

        .sort(
            (
                firstItem,
                secondItem
            ) => {

                return (

                    new Date(
                        secondItem.createdAt
                    ).getTime()

                    -

                    new Date(
                        firstItem.createdAt
                    ).getTime()

                );

            }
        )

        .slice(
            0,
            ADMIN_DASHBOARD_CONFIG
                .ATTENTION_ITEM_LIMIT
        );

}


/* =========================================================
   OPEN ADMIN ATTENTION ITEM
========================================================= */

function openAdminAttentionItem(
    item
) {

    const itemType =
        cleanText(
            item?.type
        ).toLowerCase();


    if (
        itemType === "freelancer"
    ) {

        /*
           Current project navigation does not have a
           dedicated freelancer-review details route.

           Open the freelancer administration page.
        */

        navigateTo(
            ROUTES.ADMIN_FREELANCERS
        );


        return;

    }


    navigateWithQuery(

        ROUTES.ADMIN_REQUEST_REVIEW,

        {

            request:
                item.id

        }

    );

}

// Add this DOM reference at the top with the others
const logoutButton = document.getElementById("logoutButton");

// Add inside initializeEventListeners()
logoutButton?.addEventListener("click", async (event) => {
    event.preventDefault();

    try {
        const client = requireSupabaseClient();
        await client.auth.signOut();
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        navigateTo(ROUTES.LOGIN); // or window.location.href = "../../index.html"
    }
});

/* =========================================================
   CREATE ADMIN ATTENTION ITEM
========================================================= */

function createAdminAttentionItem(
    item
) {

    const attentionItem =
        document.createElement(
            "article"
        );


    attentionItem.className =
        "admin-attention-card";


    attentionItem.tabIndex = 0;


    attentionItem.setAttribute(
        "role",
        "button"
    );


    const itemType =
        cleanText(
            item.type
        ).toLowerCase();


    const itemLabel =
        cleanText(
            item.label
        ) ||
        (
            itemType === "freelancer"

                ? "FREELANCER REGISTRATION"

                : "SERVICE REQUEST"
        );


    const itemTitle =
        cleanText(
            item.title
        ) ||
        "Administrative Review";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "admin-attention-content";


    const label =
        document.createElement(
            "span"
        );


    label.className =
        "admin-attention-label";


    setText(
        label,
        itemLabel
    );


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "admin-attention-title";


    setText(
        title,
        itemTitle
    );


    content.append(
        label,
        title
    );


    const action =
        document.createElement(
            "span"
        );


    action.className =
        "admin-attention-action";


    setText(
        action,
        "Review →"
    );


    attentionItem.append(
        content,
        action
    );


    const openItem = () => {

        openAdminAttentionItem(
            item
        );

    };


    attentionItem.addEventListener(
        "click",
        openItem
    );


    attentionItem.addEventListener(

        "keydown",

        (event) => {

            if (

                event.key === "Enter" ||

                event.key === " "

            ) {

                event.preventDefault();


                openItem();

            }

        }

    );


    return attentionItem;

}


/* =========================================================
   RENDER ADMIN ATTENTION ITEMS
========================================================= */

function renderAdminAttentionItems(
    items
) {

    hideElement(
        adminAttentionLoadingState
    );


    if (
        !adminAttentionList
    ) {

        return;

    }


    adminAttentionList
        .replaceChildren();


    if (

        !Array.isArray(
            items
        ) ||

        items.length === 0

    ) {

        hideElement(
            adminAttentionList
        );


        showElement(
            adminAttentionEmptyState
        );


        return;

    }


    hideElement(
        adminAttentionEmptyState
    );


    const fragment =
        document.createDocumentFragment();


    items.forEach(
        (item) => {

            fragment.appendChild(

                createAdminAttentionItem(
                    item
                )

            );

        }
    );


    adminAttentionList
        .appendChild(
            fragment
        );


    showElement(
        adminAttentionList
    );

}


/* =========================================================
   ADD CARD INTERACTION
========================================================= */

function addCardInteraction(
    card,
    route
) {

    if (

        !card ||

        !route

    ) {

        return;

    }


    const openRoute = () => {

        navigateTo(
            route
        );

    };


    card.addEventListener(
        "click",
        openRoute
    );


    card.addEventListener(

        "keydown",

        (event) => {

            if (

                event.key === "Enter" ||

                event.key === " "

            ) {

                event.preventDefault();


                openRoute();

            }

        }

    );

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    addCardInteraction(

        serviceRequestsCard,

        ROUTES.ADMIN_REQUESTS

    );


    addCardInteraction(

        freelancerApprovalsCard,

        ROUTES.ADMIN_FREELANCERS

    );


    addCardInteraction(

        freelancerMatchingCard,

        ROUTES.ADMIN_FREELANCER_MATCHING

    );


    addCardInteraction(

        mainDashboardCard,

        ROUTES.MAIN_DASHBOARD

    );


    viewAllRequestsButton
        ?.addEventListener(

            "click",

            () => {

                navigateTo(
                    ROUTES.ADMIN_REQUESTS
                );

            }

        );

}


/* =========================================================
   RESET DASHBOARD STATE
========================================================= */

function resetDashboardState() {

    dashboardOverview = {

        pendingRequests: 0,

        pendingFreelancers: 0,

        awaitingMatching: 0,

        activeWorks: 0

    };


    attentionItems = [];


    renderDashboardOverview(
        dashboardOverview
    );


    renderAdminAttentionItems(
        attentionItems
    );

}


/* =========================================================
   INITIALIZE ADMIN DASHBOARD
========================================================= */

async function initializeAdminDashboard(
    authenticatedUser
) {

    try {

        initializeEventListeners();


        currentAdmin =
            await getCurrentAdmin(
                authenticatedUser
            );


        if (
            !isAdminUser(
                currentAdmin
            )
        ) {

            redirectNonAdminUser();


            return;

        }


        populateAdminNavbar(
            currentAdmin
        );


        const [

            overview,

            items

        ] = await Promise.all([

            getDashboardOverview(),

            getAdminAttentionItems()

        ]);


        dashboardOverview =
            overview;


        attentionItems =
            items;


        renderDashboardOverview(
            dashboardOverview
        );


        renderAdminAttentionItems(
            attentionItems
        );


    } catch (error) {

        console.error(
            "Admin dashboard initialization error:",
            error
        );


        resetDashboardState();

    }

}


/* =========================================================
   AUTHENTICATED PAGE INITIALIZATION
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeAuthenticatedPage(
            initializeAdminDashboard
        );

    }

);
