/* =========================================================
   KPRIET FREELANCER PLATFORM
   Common Navigation Utilities
   File: js/utils/navigation.js
========================================================= */


/* =========================================================
   PROJECT ROUTES
========================================================= */

export const ROUTES =
    Object.freeze({

        /* =================================================
           AUTHENTICATION
        ================================================= */

        LOGIN:
            "/index.html",

        PROFILE_SETUP:
            "/pages/profile-setup.html",


        /* =================================================
           MAIN USER PAGES
        ================================================= */

        MAIN_DASHBOARD:
            "/pages/dashboard.html",

        CAMPUS_PROFILE:
            "/pages/campus-profile.html",


        /* =================================================
           FREELANCER PAGES
        ================================================= */

        EXPLORE_FREELANCERS:
            "/pages/freelancers/explore.html",

        FREELANCER_PROFILE:
            "/pages/freelancers/profile.html",

        FREELANCER_REGISTER:
            "/pages/freelancers/register.html",

        FREELANCER_DASHBOARD:
            "/pages/freelancers/dashboard.html",

        FREELANCER_REQUESTS:
            "/pages/freelancers/requests.html",

        FREELANCER_WORKS:
            "/pages/freelancers/works.html",


        /* =================================================
           CLIENT PAGES
        ================================================= */

        CLIENT_DASHBOARD:
            "/pages/client/dashboard.html",

        CLIENT_CREATE_REQUEST:
            "/pages/client/create-request.html",

        CLIENT_MY_REQUESTS:
            "/pages/client/my-requests.html",

        CLIENT_REQUEST_DETAILS:
            "/pages/client/request-details.html",


        /* =================================================
           CLIENT LEGACY ALIASES

           These aliases preserve compatibility with older
           page modules while the project uses standardized
           CLIENT_* route names.
        ================================================= */

        CREATE_REQUEST:
            "/pages/client/create-request.html",

        MY_REQUESTS:
            "/pages/client/my-requests.html",

        REQUEST_DETAILS:
            "/pages/client/request-details.html",


        /* =================================================
           ADMIN PAGES
        ================================================= */

        /* =================================================
   ADMIN PAGES
================================================= */

ADMIN_DASHBOARD:
    "/pages/admin/dashboard.html",

ADMIN_USERS:
    "/pages/admin/users.html",

ADMIN_FREELANCERS:
    "/pages/admin/freelancers.html",

ADMIN_FREELANCER_PROFILE:
    "/pages/admin/profile.html",

ADMIN_FREELANCER_REVIEW:
    "/pages/admin/freelancer-review.html",

ADMIN_REQUESTS:
    "/pages/admin/requests.html",

ADMIN_REQUEST_REVIEW:
    "/pages/admin/request-review.html",

ADMIN_MATCHING:
    "/pages/admin/matching.html",

ADMIN_MATCHING_DETAILS:
    "/pages/admin/matching-details.html",

ADMIN_ACTIVE_WORKS:
    "/pages/admin/active-works.html",
    
        /* =================================================
           ADMIN LEGACY ALIAS
        ================================================= */

        ADMIN_FREELANCER_MATCHING:
            "/pages/admin/matching.html"

    });


/* =========================================================
   PROJECT BASE PATH
========================================================= */

/*
   Domain root deployment:

   https://example.com/

   PROJECT_BASE_PATH = ""


   Subfolder deployment example:

   https://example.com/kpriet-freelance-platform/

   PROJECT_BASE_PATH =
       "/kpriet-freelance-platform"
*/

const PROJECT_BASE_PATH =
    "";


/* =========================================================
   CLEAN NAVIGATION TEXT
========================================================= */

function cleanNavigationText(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return "";

    }


    return value.trim();

}


/* =========================================================
   CHECK ABSOLUTE EXTERNAL URL
========================================================= */

function isAbsoluteExternalUrl(
    route
) {

    const safeRoute =
        cleanNavigationText(
            route
        );


    if (
        !safeRoute
    ) {

        return false;

    }


    try {

        const parsedUrl =
            new URL(
                safeRoute
            );


        return (

            parsedUrl.protocol ===
                "http:"

            ||

            parsedUrl.protocol ===
                "https:"

        );


    } catch {

        return false;

    }

}


/* =========================================================
   ROUTE RESOLVER
========================================================= */

/**
 * Converts a project route into a browser-safe path.
 */
export function resolveRoute(
    route
) {

    const safeRoute =
        cleanNavigationText(
            route
        );


    if (
        !safeRoute
    ) {

        return (

            `${PROJECT_BASE_PATH}` +

            `${ROUTES.LOGIN}`

        );

    }


    if (
        isAbsoluteExternalUrl(
            safeRoute
        )
    ) {

        return safeRoute;

    }


    const normalizedRoute =
        safeRoute.startsWith(
            "/"
        )

            ? safeRoute

            : `/${safeRoute}`;


    return (

        `${PROJECT_BASE_PATH}` +

        `${normalizedRoute}`

    );

}


/* =========================================================
   QUERY PARAMETER NORMALIZATION
========================================================= */

/**
 * Determines whether a query parameter value
 * should be added to a URL.
 */
function isValidQueryValue(
    value
) {

    return (

        value !== undefined

        &&

        value !== null

        &&

        value !== ""

    );

}


/* =========================================================
   CREATE ROUTE WITH QUERY
========================================================= */

/**
 * Creates a route with query parameters.
 */
export function createRouteWithQuery(
    route,
    queryParameters = {}
) {

    const resolvedRoute =
        resolveRoute(
            route
        );


    if (

        !queryParameters

        ||

        typeof queryParameters !==
            "object"

        ||

        Array.isArray(
            queryParameters
        )

    ) {

        return resolvedRoute;

    }


    const parameters =
        new URLSearchParams();


    Object.entries(
        queryParameters
    ).forEach(
        ([key, value]) => {

            const safeKey =
                cleanNavigationText(
                    key
                );


            if (

                !safeKey

                ||

                !isValidQueryValue(
                    value
                )

            ) {

                return;

            }


            parameters.set(

                safeKey,

                String(
                    value
                )

            );

        }
    );


    const queryString =
        parameters.toString();


    if (
        !queryString
    ) {

        return resolvedRoute;

    }


    const separator =
        resolvedRoute.includes(
            "?"
        )

            ? "&"

            : "?";


    return (

        `${resolvedRoute}` +

        `${separator}` +

        `${queryString}`

    );

}


/* =========================================================
   BASIC NAVIGATION
========================================================= */

/**
 * Opens a project page.
 */
export function navigateTo(
    route,
    queryParameters = null
) {

    const targetRoute =

        queryParameters

        &&

        typeof queryParameters ===
            "object"

        &&

        !Array.isArray(
            queryParameters
        )

            ? createRouteWithQuery(

                route,

                queryParameters

            )

            : resolveRoute(
                route
            );


    window.location.assign(
        targetRoute
    );

}


/**
 * Replaces the current browser page.
 */
export function replacePage(
    route,
    queryParameters = null
) {

    const targetRoute =

        queryParameters

        &&

        typeof queryParameters ===
            "object"

        &&

        !Array.isArray(
            queryParameters
        )

            ? createRouteWithQuery(

                route,

                queryParameters

            )

            : resolveRoute(
                route
            );


    window.location.replace(
        targetRoute
    );

}


/**
 * Reloads the current page.
 */
export function reloadPage() {

    window.location.reload();

}


/**
 * Returns to the previous browser page.
 */
export function goBack() {

    window.history.back();

}


/* =========================================================
   QUERY PARAMETER HELPERS
========================================================= */

/**
 * Reads one query parameter from the current URL.
 */
export function getQueryParameter(
    parameterName
) {

    const safeParameterName =
        cleanNavigationText(
            parameterName
        );


    if (
        !safeParameterName
    ) {

        return null;

    }


    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        safeParameterName
    );

}


/**
 * Reads all query parameters.
 */
export function getAllQueryParameters() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return Object.fromEntries(
        parameters.entries()
    );

}


/**
 * Navigates to a page with query parameters.
 */
export function navigateWithQuery(
    route,
    queryParameters = {}
) {

    navigateTo(

        route,

        queryParameters

    );

}


/* =========================================================
   FREELANCER NAVIGATION
========================================================= */

/**
 * Opens a selected freelancer profile.
 */
export function openFreelancerProfile(
    freelancerId
) {

    const safeFreelancerId =
        cleanNavigationText(
            freelancerId
        );


    if (
        !safeFreelancerId
    ) {

        console.error(
            "Freelancer ID is required."
        );


        return false;

    }


    navigateTo(

        ROUTES.FREELANCER_PROFILE,

        {

            id:
                safeFreelancerId

        }

    );


    return true;

}


/**
 * Opens a freelancer profile and preserves
 * the source page.
 */
export function openFreelancerProfileFrom(
    freelancerId,
    source
) {

    const safeFreelancerId =
        cleanNavigationText(
            freelancerId
        );


    if (
        !safeFreelancerId
    ) {

        console.error(
            "Freelancer ID is required."
        );


        return false;

    }


    const safeSource =
        cleanNavigationText(
            source
        );


    const queryParameters = {

        id:
            safeFreelancerId

    };


    if (
        safeSource
    ) {

        queryParameters.source =
            safeSource;

    }


    navigateTo(

        ROUTES.FREELANCER_PROFILE,

        queryParameters

    );


    return true;

}


/* =========================================================
   CLIENT REQUEST NAVIGATION
========================================================= */

/**
 * Opens one client request.
 */
export function openRequestDetails(
    requestId
) {

    const safeRequestId =
        cleanNavigationText(
            requestId
        );


    if (
        !safeRequestId
    ) {

        console.error(
            "Request ID is required."
        );


        return false;

    }


    navigateTo(

        ROUTES.CLIENT_REQUEST_DETAILS,

        {

            id:
                safeRequestId

        }

    );


    return true;

}


/**
 * Opens the create-request page with a selected
 * freelancer attached.
 */
export function createRequestForFreelancer(
    freelancerId
) {

    const safeFreelancerId =
        cleanNavigationText(
            freelancerId
        );


    if (
        !safeFreelancerId
    ) {

        navigateTo(
            ROUTES.CLIENT_CREATE_REQUEST
        );


        return true;

    }


    navigateTo(

        ROUTES.CLIENT_CREATE_REQUEST,

        {

            freelancer:
                safeFreelancerId

        }

    );


    return true;

}


/* =========================================================
   ADMIN REQUEST NAVIGATION
========================================================= */

/**
 * Opens one service request for admin review.
 */
export function openAdminRequestReview(
    requestId
) {

    const safeRequestId =
        cleanNavigationText(
            requestId
        );


    if (
        !safeRequestId
    ) {

        console.error(
            "Request ID is required."
        );


        return false;

    }


    navigateTo(

        ROUTES.ADMIN_REQUEST_REVIEW,

        {

            id:
                safeRequestId

        }

    );


    return true;

}


/* =========================================================
   ADMIN FREELANCER REVIEW NAVIGATION
========================================================= */

/**
 * Opens one freelancer application for admin review.
 */
export function openAdminFreelancerReview(
    freelancerId
) {

    const safeFreelancerId =
        cleanNavigationText(
            freelancerId
        );


    if (
        !safeFreelancerId
    ) {

        console.error(
            "Freelancer ID is required for admin review."
        );


        return false;

    }


    navigateTo(

        ROUTES.ADMIN_FREELANCER_REVIEW,

        {

            id:
                safeFreelancerId

        }

    );


    return true;

}


/* =========================================================
   ADMIN MATCHING NAVIGATION
========================================================= */

/**
 * Opens the main freelancer matching workspace.
 */
export function openAdminMatching() {

    navigateTo(
        ROUTES.ADMIN_MATCHING
    );

}


/**
 * Opens matching details for one approved request.
 */
export function openAdminMatchingDetails(
    requestId
) {

    const safeRequestId =
        cleanNavigationText(
            requestId
        );


    if (
        !safeRequestId
    ) {

        console.error(
            "Request ID is required for freelancer matching."
        );


        return false;

    }


    navigateTo(

        ROUTES.ADMIN_MATCHING_DETAILS,

        {

            request:
                safeRequestId

        }

    );


    return true;

}


/**
 * Legacy matching helper.
 */
export function openFreelancerMatching(
    requestId
) {

    return openAdminMatchingDetails(
        requestId
    );

}


/* =========================================================
   DATA ATTRIBUTE NAVIGATION STATE
========================================================= */

const initializedRouteElements =
    new WeakSet();


const initializedFreelancerElements =
    new WeakSet();


const initializedRequestElements =
    new WeakSet();


/* =========================================================
   KEYBOARD NAVIGATION HELPER
========================================================= */

function initializeKeyboardActivation(
    element,
    action
) {

    if (

        !element

        ||

        typeof action !==
            "function"

    ) {

        return;

    }


    element.addEventListener(

        "keydown",

        (event) => {

            if (

                event.key !==
                    "Enter"

                &&

                event.key !==
                    " "

            ) {

                return;

            }


            event.preventDefault();


            action();

        }

    );

}


/* =========================================================
   DATA ROUTE NAVIGATION
========================================================= */

/**
 * Initializes elements containing:
 *
 * data-route="/pages/dashboard.html"
 */
export function initializeRouteNavigation() {

    const routeElements =
        document.querySelectorAll(
            "[data-route]"
        );


    routeElements.forEach(
        (element) => {

            if (
                initializedRouteElements.has(
                    element
                )
            ) {

                return;

            }


            const navigate =
                () => {

                    const route =
                        cleanNavigationText(
                            element.dataset.route
                        );


                    if (
                        !route
                    ) {

                        return;

                    }


                    navigateTo(
                        route
                    );

                };


            element.addEventListener(

                "click",

                navigate

            );


            initializeKeyboardActivation(

                element,

                navigate

            );


            initializedRouteElements.add(
                element
            );

        }
    );

}


/* =========================================================
   FREELANCER PROFILE NAVIGATION
========================================================= */

/**
 * Initializes freelancer profile links.
 *
 * Expected:
 *
 * data-freelancer-id="UUID"
 */
export function initializeFreelancerNavigation() {

    const freelancerElements =
        document.querySelectorAll(
            "[data-freelancer-id]"
        );


    freelancerElements.forEach(
        (element) => {

            if (
                initializedFreelancerElements.has(
                    element
                )
            ) {

                return;

            }


            const openProfile =
                () => {

                    const freelancerId =
                        cleanNavigationText(

                            element
                                .dataset
                                .freelancerId

                        );


                    if (
                        !freelancerId
                    ) {

                        return;

                    }


                    openFreelancerProfile(
                        freelancerId
                    );

                };


            element.addEventListener(

                "click",

                openProfile

            );


            initializeKeyboardActivation(

                element,

                openProfile

            );


            initializedFreelancerElements.add(
                element
            );

        }
    );

}


/* =========================================================
   REQUEST DETAIL NAVIGATION
========================================================= */

/**
 * Initializes request detail links.
 *
 * Expected:
 *
 * data-request-id="UUID"
 */
export function initializeRequestNavigation() {

    const requestElements =
        document.querySelectorAll(
            "[data-request-id]"
        );


    requestElements.forEach(
        (element) => {

            if (
                initializedRequestElements.has(
                    element
                )
            ) {

                return;

            }


            const openRequest =
                () => {

                    const requestId =
                        cleanNavigationText(

                            element
                                .dataset
                                .requestId

                        );


                    if (
                        !requestId
                    ) {

                        return;

                    }


                    openRequestDetails(
                        requestId
                    );

                };


            element.addEventListener(

                "click",

                openRequest

            );


            initializeKeyboardActivation(

                element,

                openRequest

            );


            initializedRequestElements.add(
                element
            );

        }
    );

}


/* =========================================================
   EXTERNAL LINK HELPER
========================================================= */

/**
 * Opens an HTTP or HTTPS URL in a new browser tab.
 */
export function openExternalLink(
    url
) {

    const safeUrl =
        cleanNavigationText(
            url
        );


    if (
        !safeUrl
    ) {

        return false;

    }


    try {

        const parsedUrl =
            new URL(
                safeUrl
            );


        if (

            parsedUrl.protocol !==
                "http:"

            &&

            parsedUrl.protocol !==
                "https:"

        ) {

            console.error(
                "Unsupported external URL protocol."
            );


            return false;

        }


        window.open(

            parsedUrl.href,

            "_blank",

            "noopener,noreferrer"

        );


        return true;


    } catch (error) {

        console.error(
            "Invalid external URL:",
            error
        );


        return false;

    }

}


/* =========================================================
   COMMON NAVIGATION INITIALIZATION
========================================================= */

/**
 * Initializes common navigation behaviour.
 */
export function initializeCommonNavigation() {

    initializeRouteNavigation();

    initializeFreelancerNavigation();

    initializeRequestNavigation();

}