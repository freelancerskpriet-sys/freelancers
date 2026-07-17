/* =========================================================
   KPRIET FREELANCER PLATFORM
   Freelancer Registration Logic
   File: js/freelancers/register.js
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
   REGISTRATION CONFIGURATION
========================================================= */

const REGISTRATION_CONFIG =
    Object.freeze({

        MAX_SKILLS:
            10,

        MAX_SERVICES:
            5,

        MIN_TITLE_LENGTH:
            3,

        MAX_TITLE_LENGTH:
            80,

        MIN_BIO_LENGTH:
            30,

        MAX_BIO_LENGTH:
            500,

        MAX_SKILL_LENGTH:
            40,

        MAX_SERVICE_TITLE_LENGTH:
            80,

        MAX_SERVICE_DESCRIPTION_LENGTH:
            250,


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


        FREELANCER_COLUMNS: `

            id,
            user_id,
            professional_title,
            service_category,
            bio,
            skills,
            services,
            availability_status,
            approval_status,
            rejection_reason,
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
   NAVIGATION
--------------------------------------------------------- */

const backToDashboardButton =
    document.getElementById(
        "backToDashboardButton"
    );


const cancelRegistrationButton =
    document.getElementById(
        "cancelRegistrationButton"
    );


const openFreelancerDashboardButton =
    document.getElementById(
        "openFreelancerDashboardButton"
    );


const existingStateDashboardButton =
    document.getElementById(
        "existingStateDashboardButton"
    );


/* ---------------------------------------------------------
   PAGE STATES
--------------------------------------------------------- */

const existingFreelancerState =
    document.getElementById(
        "existingFreelancerState"
    );


const existingFreelancerTitle =
    document.getElementById(
        "existingFreelancerTitle"
    );


const existingFreelancerMessage =
    document.getElementById(
        "existingFreelancerMessage"
    );


const freelancerRegistrationContent =
    document.getElementById(
        "freelancerRegistrationContent"
    );


/* ---------------------------------------------------------
   REGISTRATION FORM
--------------------------------------------------------- */

const freelancerRegistrationForm =
    document.getElementById(
        "freelancerRegistrationForm"
    );


const professionalTitle =
    document.getElementById(
        "professionalTitle"
    );


const serviceCategory =
    document.getElementById(
        "serviceCategory"
    );


const professionalBio =
    document.getElementById(
        "professionalBio"
    );


const availabilityStatus =
    document.getElementById(
        "availabilityStatus"
    );


/* ---------------------------------------------------------
   CHARACTER COUNTERS
--------------------------------------------------------- */

const professionalTitleCount =
    document.getElementById(
        "professionalTitleCount"
    );


const professionalBioCount =
    document.getElementById(
        "professionalBioCount"
    );


/* ---------------------------------------------------------
   SKILLS
--------------------------------------------------------- */

const skillInput =
    document.getElementById(
        "skillInput"
    );


const addSkillButton =
    document.getElementById(
        "addSkillButton"
    );


const skillTagList =
    document.getElementById(
        "skillTagList"
    );


/* ---------------------------------------------------------
   SERVICES
--------------------------------------------------------- */

const serviceTitleInput =
    document.getElementById(
        "serviceTitleInput"
    );


const serviceDescriptionInput =
    document.getElementById(
        "serviceDescriptionInput"
    );


const addServiceButton =
    document.getElementById(
        "addServiceButton"
    );


const serviceList =
    document.getElementById(
        "serviceList"
    );


/* ---------------------------------------------------------
   ERRORS
--------------------------------------------------------- */

const professionalTitleError =
    document.getElementById(
        "professionalTitleError"
    );


const serviceCategoryError =
    document.getElementById(
        "serviceCategoryError"
    );


const professionalBioError =
    document.getElementById(
        "professionalBioError"
    );


const skillsError =
    document.getElementById(
        "skillsError"
    );


const servicesError =
    document.getElementById(
        "servicesError"
    );


const availabilityStatusError =
    document.getElementById(
        "availabilityStatusError"
    );


/* ---------------------------------------------------------
   FORM MESSAGE
--------------------------------------------------------- */

const registrationFormMessage =
    document.getElementById(
        "registrationFormMessage"
    );


/* ---------------------------------------------------------
   SUBMIT BUTTON
--------------------------------------------------------- */

const submitFreelancerButton =
    document.getElementById(
        "submitFreelancerButton"
    );


const submitFreelancerButtonText =
    document.getElementById(
        "submitFreelancerButtonText"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let skills = [];

let services = [];

let submissionInProgress = false;


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
            REGISTRATION_CONFIG
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
   NORMALIZE FREELANCER PROFILE
========================================================= */

function normalizeFreelancerProfile(
    freelancerProfile
) {

    if (
        !freelancerProfile
    ) {

        return null;

    }


    return {

        id:
            cleanText(
                freelancerProfile.id
            ),

        userId:
            cleanText(
                freelancerProfile.user_id
            ),

        professionalTitle:
            cleanText(
                freelancerProfile
                    .professional_title
            ),

        serviceCategory:
            cleanText(
                freelancerProfile
                    .service_category
            ),

        bio:
            cleanText(
                freelancerProfile.bio
            ),

        skills:
            Array.isArray(
                freelancerProfile.skills
            )
                ? freelancerProfile.skills
                : [],

        services:
            Array.isArray(
                freelancerProfile.services
            )
                ? freelancerProfile.services
                : [],

        availabilityStatus:
            cleanText(
                freelancerProfile
                    .availability_status
            ).toLowerCase(),

        approvalStatus:
            cleanText(
                freelancerProfile
                    .approval_status
            ).toLowerCase(),

        rejectionReason:
            cleanText(
                freelancerProfile
                    .rejection_reason
            ),

        createdAt:
            freelancerProfile.created_at ??
            null,

        updatedAt:
            freelancerProfile.updated_at ??
            null

    };

}


/* =========================================================
   CHECK EXISTING FREELANCER PROFILE
========================================================= */

async function getExistingFreelancerProfile(
    userId
) {

    const safeUserId =
        cleanText(
            userId
        );


    if (
        !safeUserId
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
            REGISTRATION_CONFIG
                .FREELANCER_COLUMNS
        )

        .eq(
            "user_id",
            safeUserId
        )

        .maybeSingle();


    if (
        error
    ) {

        throw error;

    }


    return normalizeFreelancerProfile(
        data
    );

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
        "User";


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


    applyNavbarPhoto(
        user.profile_photo_url
    );

}


/* =========================================================
   APPLY NAVBAR PHOTO
========================================================= */

function applyNavbarPhoto(
    profilePhotoUrl
) {

    if (
        !navbarUserAvatar
    ) {

        return;

    }


    const photoUrl =
        cleanText(
            profilePhotoUrl
        );


    navbarUserAvatar.style.backgroundImage =
        "";


    navbarUserAvatar.style.backgroundSize =
        "";


    navbarUserAvatar.style.backgroundPosition =
        "";


    navbarUserAvatar.style.backgroundRepeat =
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
            "http:"

            &&

            parsedUrl.protocol !==
            "https:"

        ) {

            return;

        }


        navbarUserAvatar.style.backgroundImage =
            `url("${parsedUrl.href}")`;


        navbarUserAvatar.style.backgroundSize =
            "cover";


        navbarUserAvatar.style.backgroundPosition =
            "center";


        navbarUserAvatar.style.backgroundRepeat =
            "no-repeat";


        navbarUserAvatar.textContent =
            "";


    } catch (error) {

        console.warn(
            "Invalid navbar profile photo URL:",
            error
        );

    }

}


/* =========================================================
   UPDATE CHARACTER COUNTERS
========================================================= */

function updateProfessionalTitleCount() {

    const length =
        professionalTitle
            ?.value
            .length ??
        0;


    setText(

        professionalTitleCount,

        `${length} / ${REGISTRATION_CONFIG.MAX_TITLE_LENGTH}`

    );

}


function updateProfessionalBioCount() {

    const length =
        professionalBio
            ?.value
            .length ??
        0;


    setText(

        professionalBioCount,

        `${length} / ${REGISTRATION_CONFIG.MAX_BIO_LENGTH}`

    );

}


/* =========================================================
   CLEAR FIELD ERROR
========================================================= */

function clearFieldError(
    input,
    errorElement
) {

    input
        ?.classList
        .remove(
            "form-input-error"
        );


    setText(
        errorElement,
        ""
    );

}


/* =========================================================
   SET FIELD ERROR
========================================================= */

function setFieldError(
    input,
    errorElement,
    message
) {

    input
        ?.classList
        .add(
            "form-input-error"
        );


    setText(
        errorElement,
        message
    );

}


/* =========================================================
   CLEAR ALL ERRORS
========================================================= */

function clearAllErrors() {

    clearFieldError(

        professionalTitle,

        professionalTitleError

    );


    clearFieldError(

        serviceCategory,

        serviceCategoryError

    );


    clearFieldError(

        professionalBio,

        professionalBioError

    );


    clearFieldError(

        skillInput,

        skillsError

    );


    clearFieldError(

        serviceTitleInput,

        servicesError

    );


    clearFieldError(

        availabilityStatus,

        availabilityStatusError

    );

}


/* =========================================================
   NORMALIZE COMPARISON TEXT
========================================================= */

function normalizeComparisonText(
    value
) {

    return cleanText(
        value
    ).toLowerCase();

}


/* =========================================================
   ADD SKILL
========================================================= */

function addSkill() {

    clearFieldError(

        skillInput,

        skillsError

    );


    const skill =
        cleanText(
            skillInput?.value
        );


    if (
        !skill
    ) {

        setFieldError(

            skillInput,

            skillsError,

            "Enter a skill before adding it."

        );


        return false;

    }


    if (

        skill.length >

        REGISTRATION_CONFIG
            .MAX_SKILL_LENGTH

    ) {

        setFieldError(

            skillInput,

            skillsError,

            `A skill can contain a maximum of ${REGISTRATION_CONFIG.MAX_SKILL_LENGTH} characters.`

        );


        return false;

    }


    if (

        skills.length >=

        REGISTRATION_CONFIG
            .MAX_SKILLS

    ) {

        setFieldError(

            skillInput,

            skillsError,

            `You can add a maximum of ${REGISTRATION_CONFIG.MAX_SKILLS} skills.`

        );


        return false;

    }


    const normalizedSkill =
        normalizeComparisonText(
            skill
        );


    const skillAlreadyExists =
        skills.some(
            (existingSkill) => {

                return (

                    normalizeComparisonText(
                        existingSkill
                    )

                    ===

                    normalizedSkill

                );

            }
        );


    if (
        skillAlreadyExists
    ) {

        setFieldError(

            skillInput,

            skillsError,

            "This skill has already been added."

        );


        return false;

    }


    skills.push(
        skill
    );


    if (
        skillInput
    ) {

        skillInput.value =
            "";

    }


    renderSkills();


    skillInput
        ?.focus();


    return true;

}


/* =========================================================
   REMOVE SKILL
========================================================= */

function removeSkill(
    skillIndex
) {

    if (

        skillIndex < 0 ||

        skillIndex >=
        skills.length

    ) {

        return;

    }


    skills.splice(

        skillIndex,

        1

    );


    renderSkills();

}


/* =========================================================
   RENDER SKILLS
========================================================= */

function renderSkills() {

    if (
        !skillTagList
    ) {

        return;

    }


    skillTagList
        .replaceChildren();


    const fragment =
        document.createDocumentFragment();


    skills.forEach(
        (
            skill,
            skillIndex
        ) => {

            const skillTag =
                document.createElement(
                    "span"
                );


            skillTag.className =
                "freelancer-form-tag";


            const skillText =
                document.createElement(
                    "span"
                );


            skillText.textContent =
                skill;


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.setAttribute(

                "aria-label",

                `Remove ${skill}`

            );


            removeButton.textContent =
                "×";


            removeButton.addEventListener(

                "click",

                () => {

                    removeSkill(
                        skillIndex
                    );

                }

            );


            skillTag.append(

                skillText,

                removeButton

            );


            fragment.appendChild(
                skillTag
            );

        }
    );


    skillTagList.appendChild(
        fragment
    );

}


/* =========================================================
   ADD SERVICE
========================================================= */

function addService() {

    clearFieldError(

        serviceTitleInput,

        servicesError

    );


    const title =
        cleanText(
            serviceTitleInput?.value
        );


    const description =
        cleanText(
            serviceDescriptionInput?.value
        );


    if (
        !title
    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            "Enter a service title."

        );


        return false;

    }


    if (
        !description
    ) {

        setFieldError(

            serviceDescriptionInput,

            servicesError,

            "Enter a service description."

        );


        return false;

    }


    if (

        title.length >

        REGISTRATION_CONFIG
            .MAX_SERVICE_TITLE_LENGTH

    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            `Service title can contain a maximum of ${REGISTRATION_CONFIG.MAX_SERVICE_TITLE_LENGTH} characters.`

        );


        return false;

    }


    if (

        description.length >

        REGISTRATION_CONFIG
            .MAX_SERVICE_DESCRIPTION_LENGTH

    ) {

        setFieldError(

            serviceDescriptionInput,

            servicesError,

            `Service description can contain a maximum of ${REGISTRATION_CONFIG.MAX_SERVICE_DESCRIPTION_LENGTH} characters.`

        );


        return false;

    }


    if (

        services.length >=

        REGISTRATION_CONFIG
            .MAX_SERVICES

    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            `You can add a maximum of ${REGISTRATION_CONFIG.MAX_SERVICES} services.`

        );


        return false;

    }


    const normalizedTitle =
        normalizeComparisonText(
            title
        );


    const serviceAlreadyExists =
        services.some(
            (service) => {

                return (

                    normalizeComparisonText(
                        service.title
                    )

                    ===

                    normalizedTitle

                );

            }
        );


    if (
        serviceAlreadyExists
    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            "This service has already been added."

        );


        return false;

    }


    services.push({

        title,

        description

    });


    if (
        serviceTitleInput
    ) {

        serviceTitleInput.value =
            "";

    }


    if (
        serviceDescriptionInput
    ) {

        serviceDescriptionInput.value =
            "";

    }


    renderServices();


    serviceTitleInput
        ?.focus();


    return true;

}


/* =========================================================
   REMOVE SERVICE
========================================================= */

function removeService(
    serviceIndex
) {

    if (

        serviceIndex < 0 ||

        serviceIndex >=
        services.length

    ) {

        return;

    }


    services.splice(

        serviceIndex,

        1

    );


    renderServices();

}


/* =========================================================
   RENDER SERVICES
========================================================= */

function renderServices() {

    if (
        !serviceList
    ) {

        return;

    }


    serviceList
        .replaceChildren();


    const fragment =
        document.createDocumentFragment();


    services.forEach(
        (
            service,
            serviceIndex
        ) => {

            const serviceItem =
                document.createElement(
                    "div"
                );


            serviceItem.className =
                "freelancer-form-service-item";


            const content =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                service.title;


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                service.description;


            content.append(

                title,

                description

            );


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.className =
                "freelancer-form-service-remove";


            removeButton.textContent =
                "Remove";


            removeButton.setAttribute(

                "aria-label",

                `Remove ${service.title}`

            );


            removeButton.addEventListener(

                "click",

                () => {

                    removeService(
                        serviceIndex
                    );

                }

            );


            serviceItem.append(

                content,

                removeButton

            );


            fragment.appendChild(
                serviceItem
            );

        }
    );


    serviceList.appendChild(
        fragment
    );

}


/* =========================================================
   VALIDATE PROFESSIONAL TITLE
========================================================= */

function validateProfessionalTitle() {

    const title =
        cleanText(
            professionalTitle?.value
        );


    clearFieldError(

        professionalTitle,

        professionalTitleError

    );


    if (
        !title
    ) {

        setFieldError(

            professionalTitle,

            professionalTitleError,

            "Professional title is required."

        );


        return false;

    }


    if (

        title.length <

        REGISTRATION_CONFIG
            .MIN_TITLE_LENGTH

    ) {

        setFieldError(

            professionalTitle,

            professionalTitleError,

            `Professional title must contain at least ${REGISTRATION_CONFIG.MIN_TITLE_LENGTH} characters.`

        );


        return false;

    }


    if (

        title.length >

        REGISTRATION_CONFIG
            .MAX_TITLE_LENGTH

    ) {

        setFieldError(

            professionalTitle,

            professionalTitleError,

            `Professional title can contain a maximum of ${REGISTRATION_CONFIG.MAX_TITLE_LENGTH} characters.`

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE SERVICE CATEGORY
========================================================= */

function validateServiceCategory() {

    const category =
        cleanText(
            serviceCategory?.value
        );


    clearFieldError(

        serviceCategory,

        serviceCategoryError

    );


    const validCategories = [

        "Web Development",

        "App Development",

        "UI/UX Design",

        "Graphic Design",

        "AI / Machine Learning",

        "Data Science",

        "Cloud Computing",

        "Cyber Security",

        "Digital Marketing",

        "Video Editing",

        "Content Writing",

        "Other"

    ];


    if (
        !category
    ) {

        setFieldError(

            serviceCategory,

            serviceCategoryError,

            "Service category is required."

        );


        return false;

    }


    if (
        !validCategories.includes(
            category
        )
    ) {

        setFieldError(

            serviceCategory,

            serviceCategoryError,

            "Select a valid service category."

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE PROFESSIONAL BIO
========================================================= */

function validateProfessionalBio() {

    const bio =
        cleanText(
            professionalBio?.value
        );


    clearFieldError(

        professionalBio,

        professionalBioError

    );


    if (
        !bio
    ) {

        setFieldError(

            professionalBio,

            professionalBioError,

            "Professional bio is required."

        );


        return false;

    }


    if (

        bio.length <

        REGISTRATION_CONFIG
            .MIN_BIO_LENGTH

    ) {

        setFieldError(

            professionalBio,

            professionalBioError,

            `Professional bio must contain at least ${REGISTRATION_CONFIG.MIN_BIO_LENGTH} characters.`

        );


        return false;

    }


    if (

        bio.length >

        REGISTRATION_CONFIG
            .MAX_BIO_LENGTH

    ) {

        setFieldError(

            professionalBio,

            professionalBioError,

            `Professional bio can contain a maximum of ${REGISTRATION_CONFIG.MAX_BIO_LENGTH} characters.`

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE SKILLS
========================================================= */

function validateSkills() {

    clearFieldError(

        skillInput,

        skillsError

    );


    if (
        skills.length ===
        0
    ) {

        setFieldError(

            skillInput,

            skillsError,

            "Add at least one relevant skill."

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE SERVICES
========================================================= */

function validateServices() {

    clearFieldError(

        serviceTitleInput,

        servicesError

    );


    if (
        services.length ===
        0
    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            "Add at least one professional service."

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE AVAILABILITY
========================================================= */

function validateAvailability() {

    const availability =
        cleanText(
            availabilityStatus?.value
        ).toLowerCase();


    clearFieldError(

        availabilityStatus,

        availabilityStatusError

    );


    const validAvailabilityValues = [

        "available",

        "busy"

    ];


    if (
        !validAvailabilityValues.includes(
            availability
        )
    ) {

        setFieldError(

            availabilityStatus,

            availabilityStatusError,

            "Select a valid availability status."

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE REGISTRATION FORM
========================================================= */

function validateRegistrationForm() {

    clearAllErrors();


    const titleValid =
        validateProfessionalTitle();


    const categoryValid =
        validateServiceCategory();


    const bioValid =
        validateProfessionalBio();


    const skillsValid =
        validateSkills();


    const servicesValid =
        validateServices();


    const availabilityValid =
        validateAvailability();


    return (

        titleValid &&

        categoryValid &&

        bioValid &&

        skillsValid &&

        servicesValid &&

        availabilityValid

    );

}


/* =========================================================
   CREATE REGISTRATION PAYLOAD
========================================================= */

function createRegistrationPayload() {

    return {

        user_id:
            currentUser.id,

        professional_title:
            cleanText(
                professionalTitle?.value
            ),

        service_category:
            cleanText(
                serviceCategory?.value
            ),

        bio:
            cleanText(
                professionalBio?.value
            ),

        skills:
            [
                ...skills
            ],

        services:
            services.map(
                (service) => {

                    return {

                        title:
                            cleanText(
                                service.title
                            ),

                        description:
                            cleanText(
                                service.description
                            )

                    };

                }
            ),

        availability_status:
            cleanText(
                availabilityStatus?.value
            ).toLowerCase(),

        approval_status:
            "pending"

    };

}


/* =========================================================
   SUBMIT FREELANCER PROFILE
========================================================= */

async function submitFreelancerProfile(
    registrationPayload
) {

    if (
        !registrationPayload?.user_id
    ) {

        throw new Error(
            "Campus user identifier is unavailable."
        );

    }


    const client =
        requireSupabaseClient();


    const {

        data: existingProfile,

        error: existingProfileError

    } = await client

        .from(
            "freelancer_profiles"
        )

        .select(
            "id"
        )

        .eq(
            "user_id",
            registrationPayload.user_id
        )

        .maybeSingle();


    if (
        existingProfileError
    ) {

        throw existingProfileError;

    }


    if (
        existingProfile
    ) {

        throw new Error(
            "A freelancer profile is already linked to this campus account."
        );

    }


    const {

        data,

        error

    } = await client

        .from(
            "freelancer_profiles"
        )

        .insert(
            registrationPayload
        )

        .select(
            REGISTRATION_CONFIG
                .FREELANCER_COLUMNS
        )

        .single();


    if (
        error
    ) {

        throw error;

    }


    return normalizeFreelancerProfile(
        data
    );

}


/* =========================================================
   SHOW FORM MESSAGE
========================================================= */

function showFormMessage(
    message,
    messageType
) {

    if (
        !registrationFormMessage
    ) {

        return;

    }


    registrationFormMessage
        .classList
        .remove(

            "hidden",

            "success",

            "error"

        );


    if (

        messageType ===
        "success"

        ||

        messageType ===
        "error"

    ) {

        registrationFormMessage
            .classList
            .add(
                messageType
            );

    }


    setText(

        registrationFormMessage,

        message

    );

}


/* =========================================================
   HIDE FORM MESSAGE
========================================================= */

function hideFormMessage() {

    if (
        !registrationFormMessage
    ) {

        return;

    }


    registrationFormMessage
        .classList
        .add(
            "hidden"
        );


    registrationFormMessage
        .classList
        .remove(

            "success",

            "error"

        );


    setText(

        registrationFormMessage,

        ""

    );

}


/* =========================================================
   SET SUBMITTING STATE
========================================================= */

function setSubmittingState(
    isSubmitting
) {

    submissionInProgress =
        Boolean(
            isSubmitting
        );


    if (
        submitFreelancerButton
    ) {

        submitFreelancerButton.disabled =
            submissionInProgress;


        submitFreelancerButton.setAttribute(

            "aria-busy",

            String(
                submissionInProgress
            )

        );

    }


    setText(

        submitFreelancerButtonText,

        submissionInProgress

            ? "Submitting..."

            : "Submit for Review"

    );

}


/* =========================================================
   SHOW EXISTING FREELANCER STATE
========================================================= */

function showExistingFreelancerState(
    freelancerProfile
) {

    hideElement(
        freelancerRegistrationContent
    );


    showElement(
        existingFreelancerState
    );


    const approvalStatus =
        cleanText(
            freelancerProfile
                ?.approvalStatus
        ).toLowerCase();


    if (
        approvalStatus ===
        "pending"
    ) {

        setText(

            existingFreelancerTitle,

            "Profile under review"

        );


        setText(

            existingFreelancerMessage,

            "Your freelancer profile has already been submitted and is currently waiting for admin review."

        );


        return;

    }


    if (
        approvalStatus ===
        "approved"
    ) {

        setText(

            existingFreelancerTitle,

            "Freelancer profile active"

        );


        setText(

            existingFreelancerMessage,

            "Your freelancer profile is approved and active on the KPRIET Freelancer Platform."

        );


        return;

    }


    if (
        approvalStatus ===
        "rejected"
    ) {

        setText(

            existingFreelancerTitle,

            "Freelancer profile requires review"

        );


        const rejectionReason =
            cleanText(
                freelancerProfile
                    ?.rejectionReason
            );


        setText(

            existingFreelancerMessage,

            rejectionReason

                ? `Your freelancer profile was not approved. Admin review: ${rejectionReason}`

                : "Your previous freelancer profile was not approved. Please contact the platform administrator for review."

        );


        return;

    }


    setText(

        existingFreelancerTitle,

        "Freelancer profile already created"

    );


    setText(

        existingFreelancerMessage,

        "A freelancer profile is already linked to your campus account."

    );

}


/* =========================================================
   SHOW REGISTRATION FORM
========================================================= */

function showRegistrationForm() {

    hideElement(
        existingFreelancerState
    );


    showElement(
        freelancerRegistrationContent
    );

}


/* =========================================================
   HANDLE FORM SUBMISSION
========================================================= */

async function handleRegistrationSubmit(
    event
) {

    event.preventDefault();


    if (
        submissionInProgress
    ) {

        return;

    }


    hideFormMessage();


    const formValid =
        validateRegistrationForm();


    if (
        !formValid
    ) {

        showFormMessage(

            "Review the highlighted fields before submitting your freelancer profile.",

            "error"

        );


        return;

    }


    if (
        !currentUser?.id
    ) {

        showFormMessage(

            "Your campus profile could not be identified. Please return to the dashboard and try again.",

            "error"

        );


        return;

    }


    const registrationPayload =
        createRegistrationPayload();


    setSubmittingState(
        true
    );


    try {

        const createdProfile =
            await submitFreelancerProfile(
                registrationPayload
            );


        if (
            !createdProfile
        ) {

            throw new Error(
                "Freelancer profile was not created."
            );

        }


        showFormMessage(

            "Freelancer profile submitted successfully. Your profile is now waiting for admin review.",

            "success"

        );


        showExistingFreelancerState(
            createdProfile
        );


    } catch (error) {

        console.error(
            "Freelancer registration error:",
            error
        );


        if (
            error?.code ===
            "23505"
        ) {

            showFormMessage(

                "A freelancer profile is already linked to your campus account.",

                "error"

            );


            return;

        }


        showFormMessage(

            "Unable to submit your freelancer profile. Please try again.",

            "error"

        );

    } finally {

        setSubmittingState(
            false
        );

    }

}


/* =========================================================
   HANDLE SKILL KEYBOARD INPUT
========================================================= */

function handleSkillKeyDown(
    event
) {

    if (
        event.key !==
        "Enter"
    ) {

        return;

    }


    event.preventDefault();


    addSkill();

}


/* =========================================================
   NAVIGATION
========================================================= */

function returnToDashboard() {

    navigateTo(
        ROUTES.MAIN_DASHBOARD
    );

}


function openFreelancerDashboard() {

    navigateTo(
        ROUTES.FREELANCER_DASHBOARD
    );

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    professionalTitle
        ?.addEventListener(

            "input",

            () => {

                updateProfessionalTitleCount();


                clearFieldError(

                    professionalTitle,

                    professionalTitleError

                );

            }

        );


    serviceCategory
        ?.addEventListener(

            "change",

            () => {

                clearFieldError(

                    serviceCategory,

                    serviceCategoryError

                );

            }

        );


    professionalBio
        ?.addEventListener(

            "input",

            () => {

                updateProfessionalBioCount();


                clearFieldError(

                    professionalBio,

                    professionalBioError

                );

            }

        );


    skillInput
        ?.addEventListener(

            "keydown",

            handleSkillKeyDown

        );


    skillInput
        ?.addEventListener(

            "input",

            () => {

                clearFieldError(

                    skillInput,

                    skillsError

                );

            }

        );


    serviceTitleInput
        ?.addEventListener(

            "input",

            () => {

                clearFieldError(

                    serviceTitleInput,

                    servicesError

                );

            }

        );


    serviceDescriptionInput
        ?.addEventListener(

            "input",

            () => {

                clearFieldError(

                    serviceDescriptionInput,

                    servicesError

                );

            }

        );


    availabilityStatus
        ?.addEventListener(

            "change",

            () => {

                clearFieldError(

                    availabilityStatus,

                    availabilityStatusError

                );

            }

        );


    addSkillButton
        ?.addEventListener(
            "click",
            addSkill
        );


    addServiceButton
        ?.addEventListener(
            "click",
            addService
        );


    freelancerRegistrationForm
        ?.addEventListener(

            "submit",

            handleRegistrationSubmit

        );


    backToDashboardButton
        ?.addEventListener(

            "click",

            returnToDashboard

        );


    cancelRegistrationButton
        ?.addEventListener(

            "click",

            returnToDashboard

        );


    existingStateDashboardButton
        ?.addEventListener(

            "click",

            returnToDashboard

        );


    openFreelancerDashboardButton
        ?.addEventListener(

            "click",

            openFreelancerDashboard

        );

}


/* =========================================================
   INITIALIZE REGISTRATION PAGE
========================================================= */

async function initializeRegistrationPage(
    authenticatedUser
) {

    initializeEventListeners();


    updateProfessionalTitleCount();


    updateProfessionalBioCount();


    renderSkills();


    renderServices();


    hideFormMessage();


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


        const existingFreelancerProfile =
            await getExistingFreelancerProfile(
                currentUser.id
            );


        if (
            existingFreelancerProfile
        ) {

            showExistingFreelancerState(
                existingFreelancerProfile
            );


            return;

        }


        showRegistrationForm();


    } catch (error) {

        console.error(
            "Freelancer registration initialization error:",
            error
        );


        hideElement(
            freelancerRegistrationContent
        );


        showFormMessage(

            "Unable to initialize freelancer registration. Please return to the dashboard and try again.",

            "error"

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
            initializeRegistrationPage
        );

    }

);