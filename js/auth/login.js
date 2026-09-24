/* =========================================================
   KPRIET FREELANCER PLATFORM
   Login Page Logic
   File: js/auth/login.js
========================================================= */


import {
    supabase,
    requireSupabaseClient
} from "../config/supabase.js";

import {
    cleanText,
    showFormMessage,
    hideFormMessage,
    setButtonLoading
} from "../utils/helpers.js";

import {
    ROUTES,
    replacePage
} from "../utils/navigation.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginMessage =
    document.getElementById("loginMessage");

const googleLoginButton =
    document.getElementById("googleLoginButton");


/* =========================================================
   LOGIN CONFIGURATION
========================================================= */

const LOGIN_CONFIG = Object.freeze({

    /*
       FIX: Added mobile_number.
       Removed department — faculty/staff have null department.
    */

    ALLOWED_EMAIL_DOMAIN: "@kpriet.ac.in",

    PROFILE_LOOKUP_COLUMNS: [
        "id",
        "full_name",
        "email",
        "mobile_number",
        "campus_role",
        "department",
        "academic_year",
        "section",
        "register_number",
        "is_admin"
    ].join(",")

});


/* =========================================================
   LOGIN STATE
========================================================= */

let loginInProgress = false;


/* =========================================================
   GOOGLE OAUTH REDIRECT URL
========================================================= */

function getGoogleOAuthRedirectUrl() {

    return new URL(ROUTES.LOGIN, window.location.origin).href;

}


/* =========================================================
   AUTHENTICATE USER WITH GOOGLE
========================================================= */

async function authenticateWithGoogle() {

    const client = requireSupabaseClient();

    const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: getGoogleOAuthRedirectUrl()
        }
    });

    if (error) {
        throw error;
    }

    return data;

}


/* =========================================================
   GET AUTHENTICATED USER PROFILE
========================================================= */

async function getAuthenticatedUserProfile(userId) {

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("profiles")
        .select(LOGIN_CONFIG.PROFILE_LOOKUP_COLUMNS)
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;

}

function isAllowedEmail(email) {

    const normalizedEmail = cleanText(email).toLowerCase();

    return normalizedEmail.endsWith(
        LOGIN_CONFIG.ALLOWED_EMAIL_DOMAIN
    );

}


/* =========================================================
   CHECK STUDENT PROFILE
========================================================= */

function isStudentProfileComplete(profile) {

    const academicYear = cleanText(profile?.academic_year);
    const section = cleanText(profile?.section);
    const registerNumber = cleanText(profile?.register_number);

    return Boolean(academicYear && section && registerNumber);

}


/* =========================================================
   CHECK PROFILE COMPLETION

   FIX: Replaced department check with mobile_number.
   Department is null for faculty/staff — checking it caused
   an infinite redirect loop for non-student users.
   Added is_admin bypass so admin accounts skip the check.
========================================================= */

function isProfileComplete(profile) {

    if (!profile) {
        return false;
    }

    // Admin always bypasses profile completion check
    if (profile.is_admin === true) {
        return true;
    }

    const fullName = cleanText(profile.full_name);
    const email = cleanText(profile.email);
    const campusRole = cleanText(profile.campus_role).toLowerCase();
    const mobileNumber = cleanText(profile.mobile_number);

    if (!fullName || !email || !campusRole || !mobileNumber) {
        return false;
    }

    if (campusRole === "student") {
        return isStudentProfileComplete(profile);
    }

    if (campusRole === "faculty" || campusRole === "staff") {
        return true;
    }

    return false;

}


/* =========================================================
   HANDLE LOGIN SUCCESS

   Routes an authenticated Supabase user (Google OAuth) based
   on whether a profiles row exists and whether it is complete.
   Does NOT create a profiles row — that is handled by
   js/auth/profile-setup.js for first-time Google users.
========================================================= */

async function handleLoginSuccess(authenticationResult) {

    const user = authenticationResult?.user;

if (!user) {
    throw new Error("Authenticated user information is unavailable.");
}

if (!isAllowedEmail(user.email)) {
    throw new Error(
        `Only ${LOGIN_CONFIG.ALLOWED_EMAIL_DOMAIN} email addresses are allowed.`
    );
}

const profile = await getAuthenticatedUserProfile(user.id);

    if (!profile) {
        replacePage(ROUTES.PROFILE_SETUP);
        return;
    }

    if (!isProfileComplete(profile)) {
        replacePage(ROUTES.PROFILE_SETUP);
        return;
    }

    if (profile.is_admin === true) {
        replacePage(ROUTES.ADMIN_DASHBOARD);
        return;
    }

    replacePage(ROUTES.MAIN_DASHBOARD);

}


/* =========================================================
   GOOGLE OAUTH ERROR MESSAGE
========================================================= */

function getGoogleOAuthErrorMessage(error) {

    const message = String(error?.message ?? "").toLowerCase();
    const status = Number(error?.status ?? 0);

if (message.includes("only @kpriet.ac.in email addresses are allowed")) {
    return "Only KPRIET email addresses (@kpriet.ac.in) are allowed.";
}

    if (
        message.includes("popup") &&
        (message.includes("closed") || message.includes("blocked"))
    ) {
        return "Google sign-in was cancelled or blocked. Please try again.";
    }

    if (
        message.includes("too many requests") ||
        message.includes("rate limit") ||
        status === 429
    ) {
        return "Too many login attempts. Try again after some time.";
    }

    if (
        message.includes("failed to fetch") ||
        message.includes("network") ||
        message.includes("fetch")
    ) {
        return "Unable to connect to the server. Check your internet connection.";
    }

    return "Unable to sign in with Google. Please try again.";

}


/* =========================================================
   GOOGLE LOGIN CLICK HANDLER
========================================================= */

async function handleGoogleLoginClick() {

    if (loginInProgress) {
        return;
    }

    hideFormMessage(loginMessage);

    loginInProgress = true;
    setButtonLoading(googleLoginButton, true);

    try {

        // Redirects the browser to Google; execution normally
        // does not continue past this call on success.
        await authenticateWithGoogle();

    } catch (error) {

        console.error("Google login error:", error);

        showFormMessage(
            loginMessage,
            getGoogleOAuthErrorMessage(error),
            "error"
        );

        loginInProgress = false;
        setButtonLoading(googleLoginButton, false);

    }

}


/* =========================================================
   REDIRECT EXISTING AUTHENTICATED USER

   Handles both:
   - A user who already has a valid session when opening
     the login page directly.
   - A user returning from the Google OAuth redirect.
========================================================= */

async function redirectAuthenticatedUser() {

    if (!supabase) {
        return false;
    }

    try {

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return false;
        }

        await handleLoginSuccess({ success: true, user });
        return true;

    } catch (error) {

        console.error("Existing session check error:", error);

        showFormMessage(
            loginMessage,
            getGoogleOAuthErrorMessage(error),
            "error"
        );

        return false;

    }

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    googleLoginButton?.addEventListener("click", handleGoogleLoginClick);

}


/* =========================================================
   LOGIN PAGE INITIALIZATION
========================================================= */

async function initializeLoginPage() {

    if (!googleLoginButton) {
        console.error("Login page elements are unavailable.");
        return;
    }

    initializeEventListeners();

    await redirectAuthenticatedUser();

}


/* =========================================================
   START LOGIN PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", initializeLoginPage);


/* =========================================================
   EXPORTS
========================================================= */

export {
    LOGIN_CONFIG,
    authenticateWithGoogle,
    getAuthenticatedUserProfile,
    isStudentProfileComplete,
    isProfileComplete,
    handleLoginSuccess,
    getGoogleOAuthErrorMessage,
    handleGoogleLoginClick,
    initializeLoginPage
};