/* =========================================================
   KPRIET FREELANCER PLATFORM
   Authentication Guard
   File: js/auth/auth-guard.js
========================================================= */


import {

    requireSupabaseClient

} from "../config/supabase.js";


import {

    ROUTES,

    replacePage

} from "../utils/navigation.js";


/* =========================================================
   AUTH GUARD CONFIGURATION
========================================================= */

const AUTH_GUARD_CONFIG = Object.freeze({

    /*
       REAL SUPABASE AUTHENTICATION

       Development authentication has been removed.

       Every protected page now requires a valid
       Supabase authenticated user.
    */

    DEVELOPMENT_MODE: false

});


/* =========================================================
   AUTH STATE
========================================================= */

let authenticatedUser = null;

let authenticationChecked = false;


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

let authStateListenerInitialized = false;

let authStateSubscription = null;


/* =========================================================
   GET AUTHENTICATED USER

   Uses Supabase Auth to validate the current user.

   Returns:

   Supabase user
   or
   null
========================================================= */

async function getAuthenticatedUser() {

    const client =
        requireSupabaseClient();


    const {

        data: {
            user
        },

        error

    } = await client.auth.getUser();


    if (error) {

        throw error;

    }


    authenticatedUser =
        user ?? null;


    authenticationChecked = true;


    return authenticatedUser;

}


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToLogin() {

    replacePage(
        ROUTES.LOGIN
    );

}


/* =========================================================
   REQUIRE AUTHENTICATION

   Use:

   const user =
       await requireAuthentication();

   Result:

   Authenticated
   → Returns Supabase user.

   Not authenticated
   → Redirects to login.
========================================================= */

async function requireAuthentication() {

    if (

        authenticationChecked &&
        authenticatedUser

    ) {

        return authenticatedUser;

    }


    try {

        const user =
            await getAuthenticatedUser();


        if (!user) {

            redirectToLogin();


            return null;

        }


        return user;


    } catch (error) {

        console.error(
            "Authentication guard error:",
            error
        );


        clearAuthenticationCache();


        redirectToLogin();


        return null;

    }

}


/* =========================================================
   CHECK AUTHENTICATION

   Does not redirect.

   Returns:

   true
   → Authenticated.

   false
   → Unauthenticated.
========================================================= */

async function isAuthenticated() {

    try {

        const user =
            await getAuthenticatedUser();


        return Boolean(
            user
        );


    } catch (error) {

        console.error(
            "Authentication check error:",
            error
        );


        clearAuthenticationCache();


        return false;

    }

}


/* =========================================================
   GET CACHED AUTHENTICATED USER
========================================================= */

function getCachedAuthenticatedUser() {

    return authenticatedUser;

}


/* =========================================================
   CLEAR AUTH GUARD CACHE
========================================================= */

function clearAuthenticationCache() {

    authenticatedUser = null;

    authenticationChecked = false;

}


/* =========================================================
   HANDLE AUTH STATE CHANGE
========================================================= */

function handleAuthenticationStateChange(
    event,
    session
) {

    authenticatedUser =
        session?.user ?? null;


    authenticationChecked = true;


    if (

        event === "SIGNED_OUT" ||
        !session?.user

    ) {

        authenticatedUser = null;

    }

}


/* =========================================================
   INITIALIZE AUTH STATE LISTENER

   Supabase emits authentication events when:

   - User signs in
   - User signs out
   - Session is refreshed
   - User information changes
========================================================= */

function initializeAuthenticationStateListener() {

    if (
        authStateListenerInitialized
    ) {

        return authStateSubscription;

    }


    const client =
        requireSupabaseClient();


    const {

        data: {
            subscription
        }

    } = client.auth.onAuthStateChange(

        (
            event,
            session
        ) => {

            handleAuthenticationStateChange(
                event,
                session
            );

        }

    );


    authStateSubscription =
        subscription;


    authStateListenerInitialized = true;


    return authStateSubscription;

}


/* =========================================================
   DESTROY AUTH STATE LISTENER
========================================================= */

function destroyAuthenticationStateListener() {

    if (
        authStateSubscription
    ) {

        authStateSubscription.unsubscribe();

    }


    authStateSubscription = null;

    authStateListenerInitialized = false;

}


/* =========================================================
   AUTHENTICATED PAGE INITIALIZER

   Protects a page before its page-specific
   initialization logic runs.

   Example:

   initializeAuthenticatedPage(
       initializeDashboard
   );
========================================================= */

async function initializeAuthenticatedPage(
    pageInitializer
) {

    initializeAuthenticationStateListener();


    const user =
        await requireAuthentication();


    if (!user) {

        return null;

    }


    if (
        typeof pageInitializer ===
        "function"
    ) {

        await pageInitializer(
            user
        );

    }


    return user;

}


/* =========================================================
   INITIALIZE GLOBAL AUTH GUARD
========================================================= */

function initializeAuthenticationGuard() {

    try {

        initializeAuthenticationStateListener();


    } catch (error) {

        console.error(
            "Authentication listener initialization error:",
            error
        );

    }

}


/* =========================================================
   START AUTH GUARD
========================================================= */

initializeAuthenticationGuard();


/* =========================================================
   EXPORTS
========================================================= */

export {

    AUTH_GUARD_CONFIG,

    getAuthenticatedUser,

    requireAuthentication,

    isAuthenticated,

    getCachedAuthenticatedUser,

    clearAuthenticationCache,

    initializeAuthenticationStateListener,

    destroyAuthenticationStateListener,

    initializeAuthenticatedPage

};