/* =========================================================
   KPRIET FREELANCER PLATFORM
   Logout Logic
   File: js/auth/logout.js
========================================================= */


import {

    requireSupabaseClient

} from "../config/supabase.js";


import {

    ROUTES,

    replacePage

} from "../utils/navigation.js";


import {

    clearAuthenticationCache

} from "./auth-guard.js";


/* =========================================================
   LOGOUT CONFIGURATION
========================================================= */

const LOGOUT_CONFIG = Object.freeze({

    /*
       REAL SUPABASE LOGOUT

       Development logout has been removed.

       The authenticated Supabase session is terminated
       using auth.signOut().
    */

    DEVELOPMENT_MODE: false

});


/* =========================================================
   LOGOUT STATE
========================================================= */

let logoutInProgress = false;


/* =========================================================
   SIGN OUT USER

   Terminates the current Supabase authentication session.
========================================================= */

async function signOutUser() {

    const client =
        requireSupabaseClient();


    const {

        error

    } = await client.auth.signOut();


    if (error) {

        throw error;

    }


    return {

        success: true

    };

}


/* =========================================================
   REDIRECT AFTER LOGOUT
========================================================= */

function redirectAfterLogout() {

    replacePage(
        ROUTES.LOGIN
    );

}


/* =========================================================
   PERFORM LOGOUT
========================================================= */

async function logout() {

    if (
        logoutInProgress
    ) {

        return false;

    }


    logoutInProgress = true;


    try {

        const result =
            await signOutUser();


        if (
            !result?.success
        ) {

            throw new Error(
                "Logout operation failed."
            );

        }


        clearAuthenticationCache();


        redirectAfterLogout();


        return true;


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        /*
           Do not redirect when Supabase sign out fails.

           The authentication session may still be active.
        */

        return false;


    } finally {

        logoutInProgress = false;

    }

}


/* =========================================================
   LOGOUT BUTTON LOADING STATE
========================================================= */

function setLogoutButtonLoading(
    logoutButton,
    isLoading
) {

    if (
        !logoutButton
    ) {

        return;

    }


    const loading =
        Boolean(
            isLoading
        );


    logoutButton.disabled =
        loading;


    logoutButton.setAttribute(

        "aria-busy",

        String(
            loading
        )

    );


    logoutButton.classList.toggle(

        "is-loading",

        loading

    );

}


/* =========================================================
   HANDLE LOGOUT BUTTON CLICK
========================================================= */

async function handleLogoutButtonClick(
    logoutButton
) {

    if (

        !logoutButton ||
        logoutInProgress

    ) {

        return false;

    }


    setLogoutButtonLoading(

        logoutButton,

        true

    );


    const logoutSuccessful =
        await logout();


    if (
        !logoutSuccessful
    ) {

        setLogoutButtonLoading(

            logoutButton,

            false

        );

    }


    return logoutSuccessful;

}


/* =========================================================
   INITIALIZE LOGOUT BUTTON

   Usage:

   initializeLogoutButton(
       document.getElementById(
           "logoutButton"
       )
   );
========================================================= */

function initializeLogoutButton(
    logoutButton
) {

    if (
        !logoutButton
    ) {

        console.warn(
            "Logout button is unavailable."
        );


        return false;

    }


    /*
       Prevent the same logout button from receiving
       duplicate event listeners.
    */

    if (
        logoutButton.dataset
            .logoutInitialized === "true"
    ) {

        return true;

    }


    logoutButton.addEventListener(

        "click",

        () => {

            handleLogoutButtonClick(
                logoutButton
            );

        }

    );


    logoutButton.dataset
        .logoutInitialized = "true";


    return true;

}


/* =========================================================
   INITIALIZE LOGOUT BUTTON BY ID

   Default button ID:

   logoutButton
========================================================= */

function initializeDefaultLogoutButton() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (
        !logoutButton
    ) {

        return false;

    }


    return initializeLogoutButton(
        logoutButton
    );

}


/* =========================================================
   EXPORTS
========================================================= */

export {

    LOGOUT_CONFIG,

    signOutUser,

    logout,

    setLogoutButtonLoading,

    handleLogoutButtonClick,

    initializeLogoutButton,

    initializeDefaultLogoutButton

};