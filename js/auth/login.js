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
    isValidEmail,
    setFieldError,
    clearFieldError,
    clearFormValidation,
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

const loginView =
    document.getElementById("loginView");

const signupView =
    document.getElementById("signupView");

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("loginEmail");

const passwordInput =
    document.getElementById("loginPassword");

const emailField =
    document.getElementById("loginEmailField");

const passwordField =
    document.getElementById("loginPasswordField");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");

const togglePasswordButton =
    document.getElementById("loginTogglePasswordButton");

const forgotPasswordButton =
    document.getElementById("forgotPasswordButton");

const showSignupButton =
    document.getElementById("showSignupButton");

const passwordShowIcon =
    togglePasswordButton?.querySelector(".password-show-icon");

const passwordHideIcon =
    togglePasswordButton?.querySelector(".password-hide-icon");


/* =========================================================
   LOGIN CONFIGURATION
========================================================= */

const LOGIN_CONFIG = Object.freeze({

    MINIMUM_PASSWORD_LENGTH: 8,

    /*
       FIX: Added mobile_number.
       Removed department — faculty/staff have null department.
    */
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
   EMAIL VALIDATION
========================================================= */

function validateEmail() {

    const email = cleanText(emailInput?.value);

    if (!email) {
        setFieldError(emailField, "Email address is required.");
        return false;
    }

    if (!isValidEmail(email)) {
        setFieldError(emailField, "Enter a valid email address.");
        return false;
    }

    clearFieldError(emailField);
    return true;

}


/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function validatePassword() {

    const password = passwordInput?.value ?? "";

    if (!password) {
        setFieldError(passwordField, "Password is required.");
        return false;
    }

    if (password.length < LOGIN_CONFIG.MINIMUM_PASSWORD_LENGTH) {
        setFieldError(
            passwordField,
            `Password must contain at least ${LOGIN_CONFIG.MINIMUM_PASSWORD_LENGTH} characters.`
        );
        return false;
    }

    clearFieldError(passwordField);
    return true;

}


/* =========================================================
   COMPLETE LOGIN VALIDATION
========================================================= */

function validateLoginForm() {

    const emailValid = validateEmail();
    const passwordValid = validatePassword();

    return emailValid && passwordValid;

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function togglePasswordVisibility() {

    if (!passwordInput || !togglePasswordButton) {
        return;
    }

    const passwordIsHidden = passwordInput.type === "password";

    passwordInput.type = passwordIsHidden ? "text" : "password";

    togglePasswordButton.setAttribute(
        "aria-label",
        passwordIsHidden ? "Hide password" : "Show password"
    );

    togglePasswordButton.setAttribute(
        "aria-pressed",
        String(passwordIsHidden)
    );

    passwordShowIcon?.classList.toggle("hidden", passwordIsHidden);
    passwordHideIcon?.classList.toggle("hidden", !passwordIsHidden);

}


/* =========================================================
   AUTHENTICATE USER
========================================================= */

async function authenticateUser(email, password) {

    const client = requireSupabaseClient();

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw error;
    }

    if (!data?.user || !data?.session) {
        throw new Error("Authenticated session is unavailable.");
    }

    return {
        success: true,
        user: data.user,
        session: data.session
    };

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
========================================================= */

async function handleLoginSuccess(authenticationResult) {

    const user = authenticationResult?.user;

    if (!user) {
        throw new Error("Authenticated user information is unavailable.");
    }

    const profile = await getAuthenticatedUserProfile(user.id);
    console.log("Profile:", profile);
console.log("is_admin:", profile?.is_admin);

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
   LOGIN ERROR MESSAGE
========================================================= */

function getLoginErrorMessage(error) {

    const message = String(error?.message ?? "").toLowerCase();
    const code = String(error?.code ?? "").toLowerCase();
    const status = Number(error?.status ?? 0);

    if (
        message.includes("invalid login credentials") ||
        code === "invalid_credentials"
    ) {
        return "Incorrect email address or password.";
    }

    if (
        message.includes("email not confirmed") ||
        code === "email_not_confirmed"
    ) {
        return "Confirm your email address before signing in.";
    }

    if (message.includes("authenticated session is unavailable")) {
        return "Your login session could not be created. Try again.";
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

    return "Unable to sign in. Please try again.";

}


/* =========================================================
   LOGIN SUBMISSION
========================================================= */

async function handleLoginSubmit(event) {

    event.preventDefault();

    if (loginInProgress) {
        return;
    }

    hideFormMessage(loginMessage);
    clearFormValidation(loginForm);

    const formIsValid = validateLoginForm();

    if (!formIsValid) {
        showFormMessage(
            loginMessage,
            "Check the highlighted fields and try again.",
            "error"
        );
        return;
    }

    const email = cleanText(emailInput.value).toLowerCase();
    const password = passwordInput.value;

    loginInProgress = true;
    setButtonLoading(loginButton, true);

    try {

        const authenticationResult = await authenticateUser(email, password);
        await handleLoginSuccess(authenticationResult);

    } catch (error) {

        console.error("Login error:", error);

        showFormMessage(
            loginMessage,
            getLoginErrorMessage(error),
            "error"
        );

    } finally {

        loginInProgress = false;
        setButtonLoading(loginButton, false);

    }

}


/* =========================================================
   PASSWORD RESET REDIRECT URL
========================================================= */

function getPasswordResetRedirectUrl() {

    return new URL(ROUTES.LOGIN, window.location.origin).href;

}


/* =========================================================
   PASSWORD RESET ERROR MESSAGE
========================================================= */

function getPasswordResetErrorMessage(error) {

    const message = String(error?.message ?? "").toLowerCase();
    const status = Number(error?.status ?? 0);

    if (
        message.includes("rate limit") ||
        message.includes("too many requests") ||
        status === 429
    ) {
        return "Too many password reset requests. Try again later.";
    }

    if (
        message.includes("failed to fetch") ||
        message.includes("network") ||
        message.includes("fetch")
    ) {
        return "Unable to connect to the server. Check your internet connection.";
    }

    return "Unable to send password reset instructions. Please try again.";

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

async function handleForgotPassword() {

    hideFormMessage(loginMessage);

    const email = cleanText(emailInput?.value).toLowerCase();

    if (!email) {
        setFieldError(emailField, "Enter your email address first.");
        emailInput?.focus();
        return;
    }

    if (!isValidEmail(email)) {
        setFieldError(emailField, "Enter a valid email address.");
        emailInput?.focus();
        return;
    }

    clearFieldError(emailField);
    setButtonLoading(forgotPasswordButton, true);

    try {

        const client = requireSupabaseClient();

        const { error } = await client.auth.resetPasswordForEmail(
            email,
            { redirectTo: getPasswordResetRedirectUrl() }
        );

        if (error) {
            throw error;
        }

        showFormMessage(
            loginMessage,
            "Password reset instructions have been sent to your email address.",
            "success"
        );

    } catch (error) {

        console.error("Password reset error:", error);

        showFormMessage(
            loginMessage,
            getPasswordResetErrorMessage(error),
            "error"
        );

    } finally {

        setButtonLoading(forgotPasswordButton, false);

    }

}


/* =========================================================
   SHOW SIGNUP VIEW
========================================================= */

function showSignupView() {

    hideFormMessage(loginMessage);
    clearFormValidation(loginForm);

    loginView?.classList.add("hidden");
    loginView?.setAttribute("aria-hidden", "true");

    signupView?.classList.remove("hidden");
    signupView?.setAttribute("aria-hidden", "false");

    document.dispatchEvent(new CustomEvent("auth:signup-view-opened"));

}


/* =========================================================
   HANDLE LOGIN VIEW OPENED
========================================================= */

function handleLoginViewOpened() {

    hideFormMessage(loginMessage);
    clearFormValidation(loginForm);
    emailInput?.focus();

}


/* =========================================================
   REDIRECT EXISTING AUTHENTICATED USER
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
        return false;

    }

}


/* =========================================================
   LIVE FIELD VALIDATION
========================================================= */

function initializeLiveValidation() {

    emailInput?.addEventListener("blur", validateEmail);
    passwordInput?.addEventListener("blur", validatePassword);

    emailInput?.addEventListener("input", () => {
        if (emailField?.classList.contains("has-error")) {
            validateEmail();
        }
        hideFormMessage(loginMessage);
    });

    passwordInput?.addEventListener("input", () => {
        if (passwordField?.classList.contains("has-error")) {
            validatePassword();
        }
        hideFormMessage(loginMessage);
    });

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    loginForm?.addEventListener("submit", handleLoginSubmit);
    togglePasswordButton?.addEventListener("click", togglePasswordVisibility);
    forgotPasswordButton?.addEventListener("click", handleForgotPassword);
    showSignupButton?.addEventListener("click", showSignupView);
    document.addEventListener("auth:login-view-opened", handleLoginViewOpened);

}


/* =========================================================
   LOGIN PAGE INITIALIZATION
========================================================= */

async function initializeLoginPage() {

    if (!loginForm || !emailInput || !passwordInput) {
        console.error("Login page elements are unavailable.");
        return;
    }

    initializeEventListeners();
    initializeLiveValidation();

    const redirected = await redirectAuthenticatedUser();

    if (redirected) {
        return;
    }

    emailInput.focus();

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
    validateEmail,
    validatePassword,
    validateLoginForm,
    authenticateUser,
    getAuthenticatedUserProfile,
    isStudentProfileComplete,
    isProfileComplete,
    handleLoginSuccess,
    getLoginErrorMessage,
    handleLoginSubmit,
    initializeLoginPage
};