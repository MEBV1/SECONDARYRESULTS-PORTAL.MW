// public/app.js
// Purpose: Unified State Controller, Supabase integrations, File Upload System, and Deletion Engines

// ==========================================
// 1. SUPABASE CLIENT CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://uxkyuheraonvykrqtdtb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4a3l1aGVyYW9udnlrcnF0ZHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTExNDAsImV4cCI6MjA5NzM2NzE0MH0.6KqFH3VvUXMTavr0Kz9tGQW3BE-3OMesZ97JYkCmkc0";

let supabaseClient = null;

try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (error) {
    console.error("Initialization error of Supabase client: ", error);
}

// ==========================================
// 2. STATE MANAGEMENT & DOM NODES
// ==========================================
const state = {
    user: null,
    profile: null,
    schools: [],
    students: [],
    selectedStudent: null,
    currentSchool: null,
    activeTab: "manage-schools"
};

// JCE & MSCE Curriculum Structure (UPDATED: Combined Social & Life Skills, Physical Science removed)
const JCE_SUBJECTS = [
    "Agriculture", "Bible Knowledge", "Biology", "Chemistry", "Chichewa", 
    "English", "Geography", "History", "Social and Life Skills", "Mathematics", "Physics"
];

const MSCE_SUBJECTS = [
    "Agriculture", "Bible Knowledge", "Biology", "Chemistry", "Chichewa", 
    "English", "Geography", "History", "Mathematics", "Physics", "Social and Life Skills"
];

// Document Selectors
const DOMElements = {
    splashScreen: document.getElementById("splash-screen"),
    appContainer: document.getElementById("app"),
    toastContainer: document.getElementById("toast-container"),
    resultsEnquiryForm: document.getElementById("results-enquiry-form"),
    resultsDisplayView: document.getElementById("results-display-view"),
    studentSearchView: document.getElementById("student-search-view"),
    adminDashboardView: document.getElementById("admin-dashboard-view"),
    adminLoginModal: document.getElementById("admin-login-modal"),
    adminLoginForm: document.getElementById("admin-login-form"),
    adminPasswordInput: document.getElementById("admin-password"),
    togglePasswordBtn: document.getElementById("toggle-password-visibility"),
    adminLogoutBtn: document.getElementById("admin-logout-btn"),
    sidebarUsername: document.getElementById("sidebar-username"),
    sidebarRoleBadge: document.getElementById("sidebar-role-badge"),
    sidebarUserInitials: document.getElementById("sidebar-user-initials"),
    superAdminMenu: document.getElementById("super-admin-menu"),
    schoolAdminMenu: document.getElementById("school-admin-menu"),
    workspaceTitle: document.getElementById("workspace-title"),
    activeSchoolDisplay: document.getElementById("active-school-display-name"),
    schoolsTbody: document.getElementById("schools-table-tbody"),
    adminsTbody: document.getElementById("admins-table-tbody"),
    studentsTbody: document.getElementById("students-table-tbody"),
    publishResultsTbody: document.getElementById("publish-results-table-tbody"),
    openSchoolModalBtn: document.getElementById("open-register-school-modal-btn"),
    openAdminModalBtn: document.getElementById("open-register-admin-modal-btn"),
    openStudentModalBtn: document.getElementById("open-register-student-modal-btn"),
    schoolModal: document.getElementById("register-school-modal"),
    adminModal: document.getElementById("register-admin-modal"),
    studentModal: document.getElementById("register-student-modal"),
    schoolForm: document.getElementById("register-school-form"),
    adminRegForm: document.getElementById("register-admin-form"),
    studentForm: document.getElementById("register-student-form"),
    studentHasLinCheckbox: document.getElementById("student-has-lin"),
    linFieldContainer: document.getElementById("lin-field-container"),
    adminAssignedSchoolSelect: document.getElementById("admin-assigned-school"),
    marksStudentSearch: document.getElementById("marks-student-search-input"),
    marksStudentList: document.getElementById("marks-student-list-container"),
    selectedStudentBannerName: document.getElementById("selected-student-display-name"),
    selectedStudentBannerCode: document.getElementById("selected-student-display-code"),
    marksEntryForm: document.getElementById("marks-entry-form"),
    marksEntryYearSelect: document.getElementById("marks-entry-academic-year"),
    marksEntryTermSelect: document.getElementById("marks-entry-term"),
    subjectsGrid: document.getElementById("dynamic-subjects-marks-grid"),
    noStudentSelectedEmpty: document.getElementById("no-student-selected-empty"),
    schoolSettingsForm: document.getElementById("school-settings-form"),
    printStudentCodesBtn: document.getElementById("print-student-codes-pdf-btn"),

    // History Modal & Action Fields
    resultsHistoryModal: document.getElementById("results-history-modal"),
    historyStudentName: document.getElementById("history-student-name"),
    historyStudentCode: document.getElementById("history-student-code"),
    historyTableTbody: document.getElementById("history-table-tbody"),
    selectedStudentActions: document.getElementById("selected-student-actions"),
    btnViewHistory: document.getElementById("btn-view-history"),
    btnAddNewResult: document.getElementById("btn-add-new-result"),
    
    // Report Card Fields
    reportSchoolLogo: document.getElementById("report-school-logo"),
    reportLogoFallback: document.getElementById("report-logo-fallback"),
    reportSchoolName: document.getElementById("report-school-name"),
    reportSchoolAddress: document.getElementById("report-school-address"),
    reportSchoolContact: document.getElementById("report-school-contact"),
    reportStudentName: document.getElementById("report-student-name-val"),
    reportStudentCode: document.getElementById("report-student-code-val"),
    reportStudentLin: document.getElementById("report-student-lin-val"),
    reportStudentClass: document.getElementById("report-student-class-val"),
    reportAcademicYear: document.getElementById("report-academic-year-val"),
    reportTerm: document.getElementById("report-term-val"),
    reportResultsTbody: document.getElementById("report-results-tbody"),
    jceSummaryRow: document.getElementById("jce-summary-row"),
    msceSummaryRow: document.getElementById("msce-summary-row"),
    reportTotalMarks: document.getElementById("report-total-marks"),
    reportAvgGrade: document.getElementById("report-avg-grade"),
    reportTotalPoints: document.getElementById("report-total-points"),
    reportPosition: document.getElementById("report-position"),
    reportTeacherRemarks: document.getElementById("report-teacher-remarks"),
    reportHeadRemarks: document.getElementById("report-head-remarks"),
    reportHeadSignature: document.getElementById("report-head-signature"),
    reportSigFallback: document.getElementById("report-sig-fallback"),
    reportHeadName: document.getElementById("report-head-name"),
    reportGenerationDate: document.getElementById("report-generation-date"),
    backToSearchBtn: document.getElementById("back-to-search-btn"),
    printResultsBtn: document.getElementById("print-results-btn"),
    downloadPdfBtn: document.getElementById("download-pdf-btn")
};

// ==========================================
// 3. SECURE AD-HOC HOTKEY EVENT DETECTOR
// ==========================================
let keysPressed = {};
let hotkeyTimer = null;

window.addEventListener("keydown", (e) => {
    keysPressed[e.key] = true;
    
    const isCtrl = keysPressed["Control"] || e.ctrlKey;
    const isShift = keysPressed["Shift"] || e.shiftKey;
    const isA = keysPressed["a"] || keysPressed["A"];
    
    if (isCtrl && isShift && isA) {
        if (!hotkeyTimer) {
            hotkeyTimer = setTimeout(() => {
                showToast("System administrator gateway recognized.", "info");
                openModal(DOMElements.adminLoginModal);
            }, 3000);
        }
    }
});

window.addEventListener("keyup", (e) => {
    delete keysPressed[e.key];
    if (hotkeyTimer) {
        clearTimeout(hotkeyTimer);
        hotkeyTimer = null;
    }
});

// ==========================================
// 4. GENERAL UI UTILITY ENGINES
// ==========================================
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    DOMElements.toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add("show"), 10);
    
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function openModal(modal) {
    modal.classList.remove("hidden");
}

function closeModal(modal) {
    modal.classList.add("hidden");
}

document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        closeModal(btn.closest(".modal-overlay"));
    });
});

DOMElements.togglePasswordBtn.addEventListener("click", () => {
    const isPassword = DOMElements.adminPasswordInput.type === "password";
    DOMElements.adminPasswordInput.type = isPassword ? "text" : "password";
    DOMElements.togglePasswordBtn.querySelector(".eye-open-icon").classList.toggle("hidden", isPassword);
    DOMElements.togglePasswordBtn.querySelector(".eye-closed-icon").classList.toggle("hidden", !isPassword);
});

// ==========================================
// 5. APPLICATION STARTUP & AUTOPRIME
// ==========================================
window.addEventListener("DOMContentLoaded", async () => {
    setTimeout(() => {
        DOMElements.splashScreen.style.opacity = "0";
        DOMElements.splashScreen.style.visibility = "hidden";
        DOMElements.appContainer.classList.remove("hidden");
        document.body.classList.remove("loading-state");
    }, 2500);

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            await establishAdminWorkspace(session.user);
        }
    }
});

// ==========================================
// 6. STUDENT ENQUIRY RETRIEVAL ENGINE
// ==========================================
DOMElements.resultsEnquiryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const studentName = document.getElementById("search-student-name").value.trim();
    const identifier = document.getElementById("search-identifier").value.trim();
    const formVal = document.getElementById("search-form").value;
    const termVal = document.getElementById("search-term").value;
    const academicYear = document.getElementById("search-academic-year").value;
    
    const submitBtn = document.getElementById("load-results-btn");
    submitBtn.querySelector(".btn-text").classList.add("hidden");
    submitBtn.querySelector(".btn-spinner").classList.remove("hidden");
    submitBtn.disabled = true;

    try {
        if (!supabaseClient) {
            throw new Error("Supabase integration database engine is offline.");
        }

        const { data: students, error: studentError } = await supabaseClient
            .from("students")
            .select("*, schools(*)")
            .eq("form", formVal)
            .or(`student_code.eq.${identifier},lin.eq.${identifier}`);

        if (studentError) throw studentError;

        if (!students || students.length === 0) {
            throw new Error("No student matched the entered registration records.");
        }

        const matchedStudent = students.find(s => 
            (s.first_name + " " + s.last_name).toLowerCase().includes(studentName.toLowerCase())
        );

        if (!matchedStudent) {
            throw new Error("Student credentials mismatch. Please double check student name spelling.");
        }

        const { data: results, error: resultError } = await supabaseClient
            .from("results")
            .select("*")
            .eq("student_id", matchedStudent.id)
            .eq("academic_year", academicYear)
            .eq("term", termVal)
            .eq("is_published", true)
            .maybeSingle(); 

        if (resultError || !results) {
            throw new Error("No published results found for the requested term and academic year.");
        }

        renderReportCard(matchedStudent, results);
        showToast("Report card verified and retrieved.", "success");
        
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        submitBtn.querySelector(".btn-text").classList.remove("hidden");
        submitBtn.querySelector(".btn-spinner").classList.add("hidden");
        submitBtn.disabled = false;
    }
});

function renderReportCard(student, results) {
    if (state.currentSchool && student.school_id === state.currentSchool.id) {
        student.schools = state.currentSchool;
    }

    let school = student.schools;
    
    if (Array.isArray(school)) {
        school = school[0];
    }

    if (!school) {
        showToast("Error: Associated school details could not be parsed.", "error");
        return;
    }
    
    if (school.logo_url) {
        DOMElements.reportSchoolLogo.src = school.logo_url;
        DOMElements.reportSchoolLogo.classList.remove("hidden");
        DOMElements.reportLogoFallback.classList.add("hidden");
    } else {
        DOMElements.reportSchoolLogo.classList.add("hidden");
        DOMElements.reportLogoFallback.classList.remove("hidden");
    }

    DOMElements.reportSchoolName.textContent = school.name;
    DOMElements.reportSchoolAddress.textContent = school.postal_address;
    DOMElements.reportSchoolContact.textContent = `Tel: ${school.phone_number} | Email: ${school.email_address}`;

    DOMElements.reportStudentName.textContent = `${student.first_name} ${student.last_name}`;
    DOMElements.reportStudentCode.textContent = student.student_code;
    DOMElements.reportStudentLin.textContent = student.lin ? student.lin : "N/A";
    DOMElements.reportStudentClass.textContent = `${student.form} (${student.section})`;
    DOMElements.reportAcademicYear.textContent = results.academic_year;
    DOMElements.reportTerm.textContent = results.term;

    DOMElements.reportResultsTbody.innerHTML = "";
    
    const uniqueSubjects = [];
    const seenSubjects = new Set();
    results.subjects_data.forEach(item => {
        if (!seenSubjects.has(item.subject)) {
            seenSubjects.add(item.subject);
            uniqueSubjects.push(item);
        }
    });

    uniqueSubjects.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-subject">${item.subject}</td>
            <td class="col-score" style="text-align: center;">${item.marks}%</td>
            <td class="col-grade" style="text-align: center;">${item.grade}</td>
            <td class="col-remarks">${item.remarks}</td>
        `;
        DOMElements.reportResultsTbody.appendChild(tr);
    });

    if (student.section === "JCE") {
        DOMElements.jceSummaryRow.classList.remove("hidden");
        DOMElements.msceSummaryRow.classList.add("hidden");
        DOMElements.reportTotalMarks.textContent = `${results.total_marks} Marks`;
        DOMElements.reportAvgGrade.textContent = results.average_grade;
    } else {
        DOMElements.jceSummaryRow.classList.add("hidden");
        DOMElements.msceSummaryRow.classList.remove("hidden");
        DOMElements.reportTotalPoints.textContent = `${results.total_points} Points`;
    }

    DOMElements.reportPosition.textContent = `${results.position ? formatOrdinal(results.position) : "Unassigned"} out of ${results.out_of || 0}`;

    DOMElements.reportTeacherRemarks.textContent = results.total_points && results.total_points <= 12 || results.total_marks && results.total_marks >= 700 
        ? "Exemplary commitment. An outstanding student in all dynamic areas." 
        : "A balanced performance this term. Excellent progress, room for optimization.";
    DOMElements.reportHeadRemarks.textContent = "Approved. Valid academic assessment record.";

    DOMElements.reportHeadName.textContent = `${school.head_teacher_name || "Head Teacher"}`;
    
    const signatureImg = document.getElementById("report-head-signature");
    const stampImg = document.getElementById("report-school-stamp");
    const fallbackSig = document.getElementById("report-sig-fallback");

    let hasSig = false;
    let hasStamp = false;

    if (school.head_teacher_signature_url) {
        signatureImg.src = school.head_teacher_signature_url;
        signatureImg.classList.remove("hidden");
        hasSig = true;
    } else {
        signatureImg.classList.add("hidden");
    }

    if (school.stamp_url) { 
        stampImg.src = school.stamp_url;
        stampImg.classList.remove("hidden");
        hasStamp = true;
    } else if (school.logo_url) { 
        stampImg.src = school.logo_url;
        stampImg.classList.remove("hidden");
        hasStamp = true;
    } else {
        stampImg.classList.add("hidden");
    }

    if (hasSig || hasStamp) {
        fallbackSig.classList.add("hidden");
    } else {
        fallbackSig.classList.remove("hidden");
    }

    DOMElements.reportGenerationDate.textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    DOMElements.studentSearchView.classList.add("hidden");
    DOMElements.resultsDisplayView.classList.remove("hidden");
}

function formatOrdinal(i) {
    var j = i % 10, k = i % 100;
    if (j == 1 && k != 11) return i + "st";
    if (j == 2 && k != 12) return i + "nd";
    if (j == 3 && k != 13) return i + "rd";
    return i + "th";
}

DOMElements.backToSearchBtn.addEventListener("click", () => {
    DOMElements.resultsDisplayView.classList.add("hidden");
    DOMElements.studentSearchView.classList.remove("hidden");
});

DOMElements.printResultsBtn.addEventListener("click", () => window.print());
DOMElements.downloadPdfBtn.addEventListener("click", () => window.print());

// ==========================================
// 7. SECURE AUTHENTICATION WORKFLOWS
// ==========================================
DOMElements.adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("admin-email").value.trim();
    const password = DOMElements.adminPasswordInput.value;
    const submitBtn = document.getElementById("admin-login-submit-btn");
    
    submitBtn.querySelector(".btn-text").classList.add("hidden");
    submitBtn.querySelector(".btn-spinner").classList.remove("hidden");
    submitBtn.disabled = true;

    try {
        if (!supabaseClient) throw new Error("Supabase integration layer offline.");

        const { data: { user }, error: loginError } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;

        await establishAdminWorkspace(user);
        closeModal(DOMElements.adminLoginModal);
        showToast("System credentials verified successfully.", "success");
        
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        submitBtn.querySelector(".btn-text").classList.remove("hidden");
        submitBtn.querySelector(".btn-spinner").classList.add("hidden");
        submitBtn.disabled = false;
    }
});

async function establishAdminWorkspace(user) {
    try {
        const { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("*, schools(*)")
            .eq("id", user.id)
            .single();

        if (error || !profile) throw new Error("Admin privileges mapping corrupted.");

        state.user = user;
        state.profile = profile;
        
        // CRITICAL UNPACKER: Defend against PostgREST returning linked school as a single-element array inside profile
        let schoolData = profile.schools;
        if (Array.isArray(schoolData)) {
            schoolData = schoolData[0];
        }
        state.currentSchool = schoolData;

        DOMElements.sidebarUsername.textContent = `${profile.first_name} ${profile.last_name}`;
        DOMElements.sidebarUserInitials.textContent = `${profile.first_name[0]}${profile.last_name[0]}`;
        
        if (profile.role === "super_admin") {
            DOMElements.sidebarRoleBadge.textContent = "Super Admin";
            DOMElements.superAdminMenu.classList.remove("hidden");
            DOMElements.schoolAdminMenu.classList.add("hidden");
            DOMElements.activeSchoolDisplay.textContent = "All Schools (Supervisory View)";
            switchTab("manage-schools");
            await loadSchools();
            await loadSchoolsForDropdown();
            await loadAdmins();
        } else {
            DOMElements.sidebarRoleBadge.textContent = "School Admin";
            DOMElements.superAdminMenu.classList.add("hidden");
            DOMElements.schoolAdminMenu.classList.remove("hidden");
            DOMElements.activeSchoolDisplay.textContent = profile.schools.name;
            switchTab("manage-students");
            await loadStudents();
            await loadResultsPublications();
            initializeSchoolProfileSettings();
        }

        DOMElements.studentSearchView.classList.add("hidden");
        DOMElements.resultsDisplayView.classList.add("hidden");
        DOMElements.adminDashboardView.classList.remove("hidden");

    } catch (err) {
        showToast(err.message, "error");
        await supabaseClient.auth.signOut();
    }
}

DOMElements.adminLogoutBtn.addEventListener("click", async () => {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    state.user = null;
    state.profile = null;
    state.currentSchool = null;

    DOMElements.adminDashboardView.classList.add("hidden");
    DOMElements.studentSearchView.classList.remove("hidden");
    showToast("Session terminated.", "info");
});

document.querySelectorAll(".sidebar-link").forEach(link => {
    link.addEventListener("click", (e) => {
        const tab = e.currentTarget.getAttribute("data-tab");
        document.querySelectorAll(".sidebar-link").forEach(l => l.classList.remove("active"));
        e.currentTarget.classList.add("active");
        switchTab(tab);
    });
});

function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll(".dashboard-tab").forEach(tab => tab.classList.add("hidden"));
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.classList.remove("hidden");

    let title = "Manage Records";
    if (tabId === "manage-schools") title = "Register & Manage Schools";
    if (tabId === "manage-admins") title = "School Administrator Accounts";
    if (tabId === "manage-students") title = "School Student Registry";
    if (tabId === "manage-results") title = "Academic Examination Entry";
    if (tabId === "publish-results") title = "Publish Report Cards";
    if (tabId === "school-settings") title = "School Profile Configuration";

    DOMElements.workspaceTitle.textContent = title;
}

// ==========================================
// 8. DATA LOADER ENGINES (CRUD)
// ==========================================

async function loadSchools() {
    try {
        const { data: schools, error } = await supabaseClient
            .from("schools")
            .select("*")
            .order("name", { ascending: true });

        if (error) throw error;
        state.schools = schools;

        DOMElements.schoolsTbody.innerHTML = "";
        schools.forEach(school => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${school.code}</strong></td>
                <td>${school.name}</td>
                <td>${school.district}</td>
                <td>${school.head_teacher_name || "N/A"}</td>
                <td>${school.email_address}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-edit-school" data-id="${school.id}">Edit</button>
                        <button class="btn btn-danger btn-delete-school" data-id="${school.id}">Delete</button>
                    </div>
                </td>
            `;
            DOMElements.schoolsTbody.appendChild(tr);
        });

        document.querySelectorAll(".btn-edit-school").forEach(btn => {
            btn.addEventListener("click", () => editSchoolRecord(btn.getAttribute("data-id")));
        });
        document.querySelectorAll(".btn-delete-school").forEach(btn => {
            btn.addEventListener("click", () => deleteSchoolRecord(btn.getAttribute("data-id")));
        });

    } catch (err) {
        showToast("Error retrieving school list: " + err.message, "error");
    }
}

async function loadSchoolsForDropdown() {
    try {
        const { data, error } = await supabaseClient.from("schools").select("id, name");
        if (error) throw error;

        DOMElements.adminAssignedSchoolSelect.innerHTML = `<option value="" disabled selected>Select Institution</option>`;
        data.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.id;
            opt.textContent = item.name;
            DOMElements.adminAssignedSchoolSelect.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadAdmins() {
    try {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("*, schools(name)")
            .eq("role", "school_admin");

        if (error) throw error;

        DOMElements.adminsTbody.innerHTML = "";
        data.forEach(admin => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${admin.first_name} ${admin.last_name}</strong></td>
                <td>${admin.id} (Ref)</td>
                <td>${admin.schools ? admin.schools.name : "Unassigned"}</td>
                <td><span class="status-badge status-published">${admin.role}</span></td>
                <td>${new Date(admin.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-danger btn-delete-admin" data-id="${admin.id}">Delete</button>
                </td>
            `;
            DOMElements.adminsTbody.appendChild(tr);
        });

        document.querySelectorAll(".btn-delete-admin").forEach(btn => {
            btn.addEventListener("click", () => deleteAdminRecord(btn.getAttribute("data-id")));
        });

    } catch (err) {
        showToast("Error retrieving admin details: " + err.message, "error");
    }
}

async function loadStudents() {
    try {
        const { data, error } = await supabaseClient
            .from("students")
            .select("*")
            .eq("school_id", state.currentSchool.id)
            .order("first_name", { ascending: true });

        if (error) throw error;
        state.students = data;

        DOMElements.studentsTbody.innerHTML = "";
        data.forEach(student => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${student.student_code}</strong></td>
                <td>${student.lin || "None"}</td>
                <td>${student.first_name} ${student.last_name}</td>
                <td>${student.form}</td>
                <td><span class="status-badge status-published">${student.section}</span></td>
                <td>${student.academic_year}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-edit-student" data-id="${student.id}">Modify</button>
                        <button class="btn btn-danger btn-delete-student" data-id="${student.id}">Delete</button>
                    </div>
                </td>
            `;
            DOMElements.studentsTbody.appendChild(tr);
        });

        document.querySelectorAll(".btn-edit-student").forEach(btn => {
            btn.addEventListener("click", () => editStudentRecord(btn.getAttribute("data-id")));
        });
        document.querySelectorAll(".btn-delete-student").forEach(btn => {
            btn.addEventListener("click", () => deleteStudentRecord(btn.getAttribute("data-id")));
        });
        
        renderStudentSelectorList();

    } catch (err) {
        showToast("Error retrieving student database: " + err.message, "error");
    }
}

async function loadResultsPublications() {
    try {
        const { data, error } = await supabaseClient
            .from("results")
            .select("*, students(*)")
            .eq("school_id", state.currentSchool.id);

        if (error) throw error;

        DOMElements.publishResultsTbody.innerHTML = "";
        data.forEach(result => {
            const KPI = result.students.section === "JCE" 
                ? `${result.total_marks} Marks` 
                : `${result.total_points} Points`;

            const statusClass = result.is_published ? "status-published" : "status-draft";
            const statusLabel = result.is_published ? "Published" : "Draft";
            const btnText = result.is_published ? "Unpublish" : "Publish";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${result.students.student_code}</strong></td>
                <td>${result.students.first_name} ${result.students.last_name}</td>
                <td>${result.students.form}</td>
                <td>${result.term}</td>
                <td>${result.academic_year}</td>
                <td><strong>${KPI}</strong></td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <button class="btn ${result.is_published ? "btn-secondary" : "btn-accent"} btn-toggle-publish" data-id="${result.id}" data-status="${result.is_published}">
                        ${btnText}
                    </button>
                </td>
            `;
            DOMElements.publishResultsTbody.appendChild(tr);
        });

        document.querySelectorAll(".btn-toggle-publish").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.getAttribute("data-id");
                const currentStatus = e.currentTarget.getAttribute("data-status") === "true";
                await togglePublishStatus(id, !currentStatus);
            });
        });

    } catch (err) {
        showToast("Error gathering publication information: " + err.message, "error");
    }
}

async function togglePublishStatus(id, newStatus) {
    try {
        const { error } = await supabaseClient
            .from("results")
            .update({ 
                is_published: newStatus,
                published_by: state.profile.id
            })
            .eq("id", id);

        if (error) throw error;
        showToast(newStatus ? "Academic report card published." : "Report card rolled back to Draft.", "success");
        await loadResultsPublications();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// 9. SCHOOL ADMIN STU REGISTRATION WORKFLOW
// ==========================================
DOMElements.openStudentModalBtn.addEventListener("click", () => {
    DOMElements.studentForm.reset();
    document.getElementById("register-student-id").value = "";
    DOMElements.linFieldContainer.classList.add("hidden");
    DOMElements.studentHasLinCheckbox.checked = false;
    openModal(DOMElements.studentModal);
});

DOMElements.studentHasLinCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
        DOMElements.linFieldContainer.classList.remove("hidden");
        document.getElementById("student-lin").required = true;
    } else {
        DOMElements.linFieldContainer.classList.add("hidden");
        document.getElementById("student-lin").required = false;
        document.getElementById("student-lin").value = "";
    }
});

DOMElements.studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = document.getElementById("register-student-id").value;
    const firstName = document.getElementById("student-first-name").value.trim();
    const lastName = document.getElementById("student-last-name").value.trim();
    const hasLin = DOMElements.studentHasLinCheckbox.checked;
    const lin = hasLin ? document.getElementById("student-lin").value.trim() : null;
    const formVal = document.getElementById("student-form").value;
    const academicYear = document.getElementById("student-academic-year").value;
    const gender = document.getElementById("student-gender").value;
    const dob = document.getElementById("student-dob").value;
    const guardian = document.getElementById("student-guardian").value.trim();
    const guardianPhone = document.getElementById("student-guardian-phone").value.trim();

    try {
        if (id) {
            const { error } = await supabaseClient
                .from("students")
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    has_lin: hasLin,
                    lin: lin,
                    form: formVal,
                    section: formVal === "Form 1" || formVal === "Form 2" ? "JCE" : "MSCE",
                    academic_year: academicYear,
                    gender: gender,
                    dob: dob,
                    guardian_name: guardian,
                    guardian_phone: guardianPhone
                })
                .eq("id", id);

            if (error) throw error;
            showToast("Student enrollment card updated.", "success");
        } else {
            const { error } = await supabaseClient
                .from("students")
                .insert([{
                    school_id: state.currentSchool.id,
                    first_name: firstName,
                    last_name: lastName,
                    has_lin: hasLin,
                    lin: lin,
                    student_code: "TMP-" + Math.floor(Math.random() * 900000), 
                    form: formVal,
                    section: formVal === "Form 1" || formVal === "Form 2" ? "JCE" : "MSCE",
                    academic_year: academicYear,
                    gender: gender,
                    dob: dob,
                    guardian_name: guardian,
                    guardian_phone: guardianPhone
                }]);

            if (error) throw error;
            showToast("New student registered successfully.", "success");
        }

        closeModal(DOMElements.studentModal);
        await loadStudents();

    } catch (err) {
        showToast(err.message, "error");
    }
});

async function editStudentRecord(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    document.getElementById("register-student-id").value = student.id;
    document.getElementById("student-first-name").value = student.first_name;
    document.getElementById("student-last-name").value = student.last_name;
    DOMElements.studentHasLinCheckbox.checked = student.has_lin;
    
    if (student.has_lin) {
        DOMElements.linFieldContainer.classList.remove("hidden");
        document.getElementById("student-lin").value = student.lin;
        document.getElementById("student-lin").required = true;
    } else {
        DOMElements.linFieldContainer.classList.add("hidden");
        document.getElementById("student-lin").value = "";
        document.getElementById("student-lin").required = false;
    }

    document.getElementById("student-form").value = student.form;
    document.getElementById("student-academic-year").value = student.academic_year;
    document.getElementById("student-gender").value = student.gender;
    document.getElementById("student-dob").value = student.dob;
    document.getElementById("student-guardian").value = student.guardian_name;
    document.getElementById("student-guardian-phone").value = student.guardian_phone;

    openModal(DOMElements.studentModal);
}

async function deleteStudentRecord(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const confirmDelete = confirm(`Are you sure you want to permanently delete student "${student.first_name} ${student.last_name}"?\nThis will remove all of their exam results!`);
    if (!confirmDelete) return;

    try {
        const { error } = await supabaseClient
            .from("students")
            .delete()
            .eq("id", studentId);

        if (error) throw error;
        showToast(`Student "${student.first_name} ${student.last_name}" deleted successfully.`, "success");
        await loadStudents();
        await loadResultsPublications();
    } catch (err) {
        showToast("Error deleting student: " + err.message, "error");
    }
}

// ==========================================
// 10. STUDENT CODE PDF GENERATOR
// ==========================================
DOMElements.printStudentCodesBtn.addEventListener("click", () => {
    if (state.students.length === 0) {
        showToast("No student records available to generate PDF.", "error");
        return;
    }

    const printWindow = window.open("", "_blank");
    const logoHtml = state.currentSchool.logo_url 
        ? `<img src="${state.currentSchool.logo_url}" style="height: 50px;">` 
        : `<div style="padding: 10px; background: #000; color: #fff; font-weight:800;">LOGO</div>`;

    let tableRows = "";
    state.students.forEach(student => {
        tableRows += `
            <tr>
                <td>${student.first_name} ${student.last_name}</td>
                <td>${student.lin || "None"}</td>
                <td style="font-family: monospace; font-weight: bold;">${student.student_code}</td>
                <td>${student.form}</td>
                <td>${student.section}</td>
            </tr>
        `;
    });

    printWindow.document.write(`
        <html>
        <head>
            <title>Enrollment Registration List</title>
            <style>
                body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
                .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1E3A8A; padding-bottom: 20px; margin-bottom: 30px; }
                .title h2 { margin: 0; color: #1E3A8A; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #CBD5E1; padding: 12px; text-align: left; font-size: 14px; }
                th { background-color: #F8FAFC; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">
                    <h2>${state.currentSchool.name}</h2>
                    <p style="margin: 4px 0 0 0;">Official Student Code Ledger</p>
                </div>
                ${logoHtml}
            </div>
            <p style="font-size: 12px; color: #666;">Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>LIN</th>
                        <th>Student Code</th>
                        <th>Form</th>
                        <th>Section</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
});

// ==========================================
// 11. EXAMINATION MARK scorecard ENTRY
// ==========================================

function renderStudentSelectorList() {
    DOMElements.marksStudentList.innerHTML = "";
    
    const searchVal = DOMElements.marksStudentSearch.value.toLowerCase();
    const filtered = state.students.filter(s => 
        (s.first_name + " " + s.last_name).toLowerCase().includes(searchVal) ||
        s.student_code.toLowerCase().includes(searchVal)
    );

    filtered.forEach(student => {
        const item = document.createElement("div");
        item.className = "student-select-item";
        if (state.selectedStudent && state.selectedStudent.id === student.id) {
            item.classList.add("selected");
        }

        item.innerHTML = `
            <h5>${student.first_name} ${student.last_name}</h5>
            <p>${student.student_code} | ${student.form}</p>
        `;

        item.addEventListener("click", () => selectStudentForMarks(student));
        DOMElements.marksStudentList.appendChild(item);
    });
}

DOMElements.marksStudentSearch.addEventListener("input", renderStudentSelectorList);

async function selectStudentForMarks(student) {
    state.selectedStudent = student;
    
    document.querySelectorAll(".student-select-item").forEach(item => {
        item.classList.remove("selected");
    });
    renderStudentSelectorList();

    DOMElements.selectedStudentBannerName.textContent = `${student.first_name} ${student.last_name}`;
    DOMElements.selectedStudentBannerCode.textContent = `${student.student_code} | Form: ${student.form} | Section: ${student.section}`;
    
    DOMElements.selectedStudentActions.classList.remove("hidden");
    
    DOMElements.btnViewHistory.onclick = () => openResultsHistoryModal(student);
    DOMElements.btnAddNewResult.onclick = () => prepNewResultsEntry(student);

    DOMElements.marksEntryYearSelect.value = student.academic_year;

    const subjects = student.section === "JCE" ? JCE_SUBJECTS : MSCE_SUBJECTS;
    DOMElements.subjectsGrid.innerHTML = "";

    let existingResults = {};
    try {
        const { data, error } = await supabaseClient
            .from("results")
            .select("subjects_data, academic_year, term")
            .eq("student_id", student.id)
            .eq("academic_year", DOMElements.marksEntryYearSelect.value)
            .eq("term", DOMElements.marksEntryTermSelect.value)
            .maybeSingle();

        if (data && data.subjects_data) {
            data.subjects_data.forEach(item => {
                existingResults[item.subject] = item.marks;
            });
        }
    } catch (err) {
        console.error("Existing scores verification skipped:", err);
    }

    subjects.forEach(subject => {
        const prevMarks = existingResults[subject] !== undefined ? existingResults[subject] : "";
        const group = document.createElement("div");
        group.className = "form-group";
        
        // Optional Subject Selection Rule: ONLY English is compulsory (*) [1]. All other subjects are optional.
        const isCompulsory = (subject === "English") ? "required" : "";
        
        group.innerHTML = `
            <label for="marks-${subject}">${subject} ${isCompulsory ? '<span style="color:var(--danger-color)">*</span>' : '(Optional)'}</label>
            <input type="number" id="marks-${subject}" data-subject="${subject}" min="0" max="100" value="${prevMarks}" placeholder="0 - 100" ${isCompulsory}>
        `;
        DOMElements.subjectsGrid.appendChild(group);
    });

    DOMElements.noStudentSelectedEmpty.classList.add("hidden");
    DOMElements.marksEntryForm.classList.remove("hidden");
}

DOMElements.marksEntryTermSelect.addEventListener("change", () => {
    if (state.selectedStudent) selectStudentForMarks(state.selectedStudent);
});

DOMElements.marksEntryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.selectedStudent) return;

    const academicYear = DOMElements.marksEntryYearSelect.value;
    const termVal = DOMElements.marksEntryTermSelect.value;
    const subjectInputs = DOMElements.subjectsGrid.querySelectorAll("input");
    
    const subjectsData = [];
    subjectInputs.forEach(input => {
        // Collect and save only if a value is actually entered (enables optional subject combinations)
        if (input.value.trim() !== "") {
            subjectsData.push({
                subject: input.getAttribute("data-subject"),
                marks: parseInt(input.value)
            });
        }
    });

    try {
        const { data: checkExisting } = await supabaseClient
            .from("results")
            .select("id")
            .eq("student_id", state.selectedStudent.id)
            .eq("academic_year", academicYear)
            .eq("term", termVal)
            .maybeSingle();

        if (checkExisting) {
            const { error } = await supabaseClient
                .from("results")
                .update({
                    subjects_data: subjectsData,
                    modified_by: state.profile.id,
                    updated_at: new Date()
                })
                .eq("id", checkExisting.id);

            if (error) throw error;
            showToast("Report scorecard updated.", "success");
        } else {
            const { error = null } = await supabaseClient
                .from("results")
                .insert([{
                    student_id: state.selectedStudent.id,
                    school_id: state.currentSchool.id,
                    academic_year: academicYear,
                    term: termVal,
                    subjects_data: subjectsData,
                    created_by: state.profile.id,
                    is_published: false
                }]);

            if (error) throw error;
            showToast("Report scorecard successfully cataloged.", "success");
        }

        await loadResultsPublications();

    } catch (err) {
        showToast(err.message, "error");
    }
});

// ==========================================
// 12. INSTITUTIONAL CONFIGURATION
// ==========================================
// Helper to update settings profile page visual image previews immediately
function updateSettingsImagePreviews() {
    const school = state.currentSchool;
    if (!school) return;

    const logoPreview = document.getElementById("preview-school-logo");
    const sigPreview = document.getElementById("preview-school-sig");
    const stampPreview = document.getElementById("preview-school-stamp");

    if (school.logo_url) {
        logoPreview.src = school.logo_url;
        logoPreview.style.display = "block";
    } else {
        logoPreview.style.display = "none";
    }

    if (school.head_teacher_signature_url) {
        sigPreview.src = school.head_teacher_signature_url;
        sigPreview.style.display = "block";
    } else {
        sigPreview.style.display = "none";
    }

    if (school.stamp_url) {
        stampPreview.src = school.stamp_url;
        stampPreview.style.display = "block";
    } else {
        stampPreview.style.display = "none";
    }
}

function initializeSchoolProfileSettings() {
    const school = state.currentSchool;
    if (!school) return;

    document.getElementById("settings-school-name").value = school.name;
    document.getElementById("settings-school-code").value = school.code;
    document.getElementById("settings-school-address").value = school.postal_address;
    document.getElementById("settings-school-phone").value = school.phone_number;
    document.getElementById("settings-school-email").value = school.email_address;
    document.getElementById("settings-school-head").value = school.head_teacher_name || "";
    document.getElementById("settings-school-district").value = school.district;
    document.getElementById("settings-school-country").value = school.country || "Malawi";

    // Set active visual uploads
    updateSettingsImagePreviews();
}

DOMElements.schoolSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("settings-school-name").value.trim();
    const address = document.getElementById("settings-school-address").value.trim();
    const phone = document.getElementById("settings-school-phone").value.trim();
    const email = document.getElementById("settings-school-email").value.trim();
    const head = document.getElementById("settings-school-head").value.trim();
    const district = document.getElementById("settings-school-district").value.trim();
    const country = document.getElementById("settings-school-country").value.trim();

    try {
        const { error } = await supabaseClient
            .from("schools")
            .update({
                name,
                postal_address: address,
                phone_number: phone,
                email_address: email,
                head_teacher_name: head,
                district,
                country
                // logo_url, head_teacher_signature_url, and stamp_url are already auto-saved on upload
            })
            .eq("id", state.currentSchool.id);

        if (error) throw error;
        showToast("School administrative profile updated.", "success");
        
        // Update local session caches
        state.currentSchool.name = name;
        state.currentSchool.postal_address = address;
        state.currentSchool.phone_number = phone;
        state.currentSchool.email_address = email;
        state.currentSchool.head_teacher_name = head;
        state.currentSchool.district = district;
        state.currentSchool.country = country;

    } catch (err) {
        showToast(err.message, "error");
    }
});

// ==========================================
// 13. SUPER ADMIN OPERATION HANDLERS
// ==========================================
DOMElements.openSchoolModalBtn.addEventListener("click", () => {
    DOMElements.schoolForm.reset();
    document.getElementById("register-school-id").value = "";
    document.getElementById("school-code").removeAttribute("readonly");
    document.getElementById("school-code").classList.remove("readonly-input");
    DOMElements.schoolModal.querySelector("h3").textContent = "Register Educational Institution";
    openModal(DOMElements.schoolModal);
});

DOMElements.schoolForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("register-school-id").value;
    const name = document.getElementById("school-name").value.trim();
    const code = document.getElementById("school-code").value.trim().toUpperCase();
    const logo = document.getElementById("school-logo").value.trim();
    const address = document.getElementById("school-address").value.trim();
    const phone = document.getElementById("school-phone").value.trim();
    const email = document.getElementById("school-email").value.trim();
    const head = document.getElementById("school-head").value.trim();
    const sig = document.getElementById("school-sig").value.trim();
    const district = document.getElementById("school-district").value.trim();
    const country = document.getElementById("school-country").value.trim();

    try {
        if (id) {
            const { error } = await supabaseClient
                .from("schools")
                .update({ name, logo_url: logo, postal_address: address, phone_number: phone, email_address: email, head_teacher_name: head, head_teacher_signature_url: sig, district, country })
                .eq("id", id);
            
            if (error) throw error;
            showToast("Institution configuration details updated.", "success");
        } else {
            const { error } = await supabaseClient
                .from("schools")
                .insert([{ name, code, logo_url: logo, postal_address: address, phone_number: phone, email_address: email, head_teacher_name: head, head_teacher_signature_url: sig, district, country }]);
            
            if (error) throw error;
            showToast("New educational institution registered.", "success");
        }

        closeModal(DOMElements.schoolModal);
        await loadSchools();
        await loadSchoolsForDropdown();

    } catch (err) {
        showToast(err.message, "error");
    }
});

async function editSchoolRecord(schoolId) {
    const school = state.schools.find(s => s.id === schoolId);
    if (!school) return;

    document.getElementById("register-school-id").value = school.id;
    document.getElementById("school-name").value = school.name;
    document.getElementById("school-code").value = school.code;
    document.getElementById("school-code").setAttribute("readonly", "true");
    document.getElementById("school-code").classList.add("readonly-input");
    document.getElementById("school-logo").value = school.logo_url || "";
    document.getElementById("school-address").value = school.postal_address;
    document.getElementById("school-phone").value = school.phone_number;
    document.getElementById("school-email").value = school.email_address;
    document.getElementById("school-head").value = school.head_teacher_name || "";
    document.getElementById("school-sig").value = school.head_teacher_signature_url || "";
    document.getElementById("school-district").value = school.district;
    document.getElementById("school-country").value = school.country;

    DOMElements.schoolModal.querySelector("h3").textContent = "Modify Institution Profile";
    openModal(DOMElements.schoolModal);
}

DOMElements.openAdminModalBtn.addEventListener("click", () => {
    DOMElements.adminRegForm.reset();
    openModal(DOMElements.adminModal);
});

DOMElements.adminRegForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const first = document.getElementById("admin-first-name").value.trim();
    const last = document.getElementById("admin-last-name").value.trim();
    const email = document.getElementById("admin-reg-email").value.trim();
    const password = document.getElementById("admin-reg-password").value;
    const schoolId = DOMElements.adminAssignedSchoolSelect.value;

    const submitBtn = DOMElements.adminRegForm.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Registering Account...";
    submitBtn.disabled = true;

    try {
        if (!supabaseClient) throw new Error("Supabase is not initialized.");

        const { data, error } = await supabaseClient.rpc("create_school_admin", {
            p_email: email,
            p_password: password,
            p_school_id: schoolId,
            p_first_name: first,
            p_last_name: last
        });

        if (error) throw error;

        showToast(`Administrator account for ${first} ${last} created and activated!`, "success");
        closeModal(DOMElements.adminModal);
        DOMElements.adminRegForm.reset();
        await loadAdmins();

    } catch (err) {
        showToast("Registration failed: " + err.message, "error");
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

async function deleteSchoolRecord(schoolId) {
    const school = state.schools.find(s => s.id === schoolId);
    if (!school) return;

    const confirmDelete = confirm(`Are you absolutely sure you want to delete "${school.name}"?\nThis will permanently delete all associated student profiles and exam scorecards!`);
    if (!confirmDelete) return;

    try {
        const { error } = await supabaseClient
            .from("schools")
            .delete()
            .eq("id", schoolId);

        if (error) throw error;
        showToast(`School "${school.name}" deleted successfully.`, "success");
        await loadSchools();
        await loadSchoolsForDropdown();
    } catch (err) {
        showToast("Error deleting school: " + err.message, "error");
    }
}

async function deleteAdminRecord(adminId) {
    const confirmDelete = confirm("Are you absolutely sure you want to permanently delete this administrator account?\nThis will immediately revoke their access and delete their profile!");
    if (!confirmDelete) return;

    try {
        if (!supabaseClient) throw new Error("Supabase is not initialized.");

        const { error } = await supabaseClient.rpc("delete_school_admin", {
            p_user_id: adminId
        });

        if (error) throw error;

        showToast("Administrator account permanently deleted.", "success");
        await loadAdmins(); 

    } catch (err) {
        showToast("Deletion failed: " + err.message, "error");
    }
}

// ==========================================
// 14. FILE UPLOADING AND METADATA ASSOCIATION
// ==========================================

async function uploadAssetToSupabase(file, folderPath) {
    if (!supabaseClient) {
        throw new Error("Supabase integration engine is offline.");
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    const { data, error } = await supabaseClient.storage
        .from('school-assets')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage
        .from('school-assets')
        .getPublicUrl(filePath);

    return publicUrl;
}

document.addEventListener("DOMContentLoaded", () => {
    const logoFileInput = document.getElementById("settings-school-logo-file");
    const sigFileInput = document.getElementById("settings-school-sig-file");
    const stampFileInput = document.getElementById("settings-school-stamp-file");

    if (logoFileInput) {
        logoFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                showToast("Uploading school logo...", "info");
                const publicUrl = await uploadAssetToSupabase(file, "logos");
                
                // Direct database auto-save for immediate activation
                const { error } = await supabaseClient
                    .from("schools")
                    .update({ logo_url: publicUrl })
                    .eq("id", state.currentSchool.id);

                if (error) throw error;

                state.currentSchool.logo_url = publicUrl;
                updateSettingsImagePreviews(); // Update live preview on settings page immediately
                
                showToast("School logo uploaded and saved successfully.", "success");
            } catch (err) {
                showToast("Upload failed: " + err.message, "error");
            }
        });
    }

    if (sigFileInput) {
        sigFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                showToast("Uploading principal signature...", "info");
                const publicUrl = await uploadAssetToSupabase(file, "signatures");
                
                // Direct database auto-save for immediate activation
                const { error } = await supabaseClient
                    .from("schools")
                    .update({ head_teacher_signature_url: publicUrl })
                    .eq("id", state.currentSchool.id);

                if (error) throw error;

                state.currentSchool.head_teacher_signature_url = publicUrl;
                updateSettingsImagePreviews(); // Update live preview on settings page immediately

                showToast("Signature uploaded and saved successfully.", "success");
            } catch (err) {
                showToast("Upload failed: " + err.message, "error");
            }
        });
    }

    if (stampFileInput) {
        stampFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                showToast("Uploading school stamp...", "info");
                const publicUrl = await uploadAssetToSupabase(file, "stamps");
                
                // Direct database auto-save for immediate activation
                const { error } = await supabaseClient
                    .from("schools")
                    .update({ stamp_url: publicUrl })
                    .eq("id", state.currentSchool.id);

                if (error) throw error;

                state.currentSchool.stamp_url = publicUrl;
                updateSettingsImagePreviews(); // Update live preview on settings page immediately

                showToast("School stamp uploaded and saved successfully.", "success");
            } catch (err) {
                showToast("Upload failed: " + err.message, "error");
            }
        });
    }
});

// ==========================================
// 15. RESULTS HISTORY & SCORECARD MULTI-ASSESSMENT ENGINE
// ==========================================

async function openResultsHistoryModal(student) {
    if (!supabaseClient) return;

    DOMElements.historyStudentName.textContent = `${student.first_name} ${student.last_name}`;
    DOMElements.historyStudentCode.textContent = `${student.student_code} | Class: ${student.form} (${student.section})`;
    DOMElements.historyTableTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Retrieving history...</td></tr>`;
    
    openModal(DOMElements.resultsHistoryModal);

    try {
        const { data: records, error } = await supabaseClient
            .from("results")
            .select("*")
            .eq("student_id", student.id)
            .order("academic_year", { ascending: false })
            .order("term", { ascending: false });

        if (error) throw error;

        DOMElements.historyTableTbody.innerHTML = "";

        if (!records || records.length === 0) {
            DOMElements.historyTableTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No historical academic results records found for this student.</td></tr>`;
            return;
        }

        records.forEach(rec => {
            const scoreDisplay = student.section === "JCE" 
                ? `${rec.total_marks} Marks` 
                : `${rec.total_points} Points`;

            const statusClass = rec.is_published ? "status-published" : "status-draft";
            const statusText = rec.is_published ? "Published" : "Draft";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${rec.academic_year}</strong></td>
                <td>${rec.term}</td>
                <td><strong>${scoreDisplay}</strong></td>
                <td>${rec.position ? formatOrdinal(rec.position) + ' of ' + rec.out_of : 'Unassigned'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-view-card" data-rec-id="${rec.id}" style="padding: 4px 8px; font-size: 0.75rem;">View Card</button>
                        <button class="btn btn-danger btn-delete-card" data-rec-id="${rec.id}" style="padding: 4px 8px; font-size: 0.75rem;">Delete</button>
                    </div>
                </td>
            `;
            DOMElements.historyTableTbody.appendChild(tr);
        });

        DOMElements.historyTableTbody.querySelectorAll(".btn-view-card").forEach(btn => {
            btn.addEventListener("click", () => {
                const recId = btn.getAttribute("data-rec-id");
                const matchedRecord = records.find(r => r.id === recId);
                if (matchedRecord) {
                    closeModal(DOMElements.resultsHistoryModal);
                    renderReportCard(student, matchedRecord);
                }
            });
        });

        DOMElements.historyTableTbody.querySelectorAll(".btn-delete-card").forEach(btn => {
            btn.addEventListener("click", async () => {
                const recId = btn.getAttribute("data-rec-id");
                const matchedRecord = records.find(r => r.id === recId);
                const confirmDelete = confirm(`Are you sure you want to permanently delete the results for ${matchedRecord.academic_year} ${matchedRecord.term}?\nThis cannot be undone!`);
                if (!confirmDelete) return;

                try {
                    const { error: delError } = await supabaseClient
                        .from("results")
                        .delete()
                        .eq("id", recId);

                    if (delError) throw delError;

                    showToast("Historical scorecard permanently deleted.", "success");
                    await openResultsHistoryModal(student); 
                    await loadResultsPublications();       
                } catch (err) {
                    showToast("Deletion failed: " + err.message, "error");
                }
            });
        });

    } catch (err) {
        showToast("Error retrieving history: " + err.message, "error");
    }
}

function prepNewResultsEntry(student) {
    const subjectInputs = DOMElements.subjectsGrid.querySelectorAll("input");
    subjectInputs.forEach(input => {
        input.value = "";
    });

    showToast("Form ready. Select a new Year and Term to add a new academic scorecard.", "info");
    DOMElements.marksEntryTermSelect.focus();
}

async function deleteSchoolAdmin(adminId) {
    const confirmDelete = confirm("Are you sure you want to permanently delete this administrator account?\nThis will immediately revoke their access and delete their profile!");
    if (!confirmDelete) return;

    try {
        if (!supabaseClient) throw new Error("Supabase is not initialized.");

        const { error } = await supabaseClient.rpc("delete_school_admin", {
            p_user_id: adminId
        });

        if (error) throw error;

        showToast("Administrator account permanently deleted.", "success");
        await loadAdmins(); 

    } catch (err) {
        showToast("Deletion failed: " + err.message, "error");
    }
}

// ==========================================
// 16. ADVANCED CLIENT-SIDE SECURITY & DEVTOOLS DETECTOR
// ==========================================

// A. Disable Context Menu (Prevents standard right-click inspecting)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// B. Block common Developer Tool Hotkeys (Excludes Ctrl + Shift + A)
document.addEventListener('keydown', (e) => {
    // Prevent F12 (DevTools)
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    // Prevent Ctrl + Shift + I (Inspect Element)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        return false;
    }
    // Prevent Ctrl + Shift + J (Console Tools)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        return false;
    }
    // Prevent Ctrl + Shift + C (Element Selector Tool)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
    }
    // Prevent Ctrl + U (View Page Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        return false;
    }
});

// C. Mute the global console to prevent data output extraction
(function() {
    const noop = function() {};
    window.console.log = noop;
    window.console.warn = noop;
    window.console.error = noop;
    window.console.info = noop;
    window.console.clear = noop;
})();

// D. Safe, Non-Blocking Anti-Debugging Timer
// Suspends browser execution only if DevTools is actually open on a live server
(function() {
    const antiDebug = function() {
        debugger;
    };
    
    // Only run on live domains (excludes localhost/127.0.0.1 development)
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        setInterval(antiDebug, 200); // Clean, non-recursive interval (safe for the event loop)
    }
})();
// ==========================================
// 17. PROFILE IMAGES AUTO-SAVE & PREVIEW ENGINE (PATCH OVERRIDE)
// ==========================================

// Helper to update live settings page previews
function updateSettingsImagePreviews() {
    const school = state.currentSchool;
    if (!school) return;

    const logoPreview = document.getElementById("preview-school-logo");
    const sigPreview = document.getElementById("preview-school-sig");
    const stampPreview = document.getElementById("preview-school-stamp");

    if (logoPreview) {
        if (school.logo_url) {
            logoPreview.src = school.logo_url;
            logoPreview.style.display = "block";
        } else {
            logoPreview.style.display = "none";
        }
    }

    if (sigPreview) {
        if (school.head_teacher_signature_url) {
            sigPreview.src = school.head_teacher_signature_url;
            sigPreview.style.display = "block";
        } else {
            sigPreview.style.display = "none";
        }
    }

    if (stampPreview) {
        if (school.stamp_url) {
            stampPreview.src = school.stamp_url;
            stampPreview.style.display = "block";
        } else {
            stampPreview.style.display = "none";
        }
    }
}

// Override establishAdminWorkspace to automatically unpack the schools array on login
async function establishAdminWorkspace(user) {
    try {
        const { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("*, schools(*)")
            .eq("id", user.id)
            .single();

        if (error || !profile) throw new Error("Admin privileges mapping corrupted.");

        state.user = user;
        state.profile = profile;
        
        // Defend against PostgREST returning linked schools as a single-element array inside profiles
        let schoolData = profile.schools;
        if (Array.isArray(schoolData)) {
            schoolData = schoolData[0];
        }
        state.currentSchool = schoolData;

        DOMElements.sidebarUsername.textContent = `${profile.first_name} ${profile.last_name}`;
        DOMElements.sidebarUserInitials.textContent = `${profile.first_name[0]}${profile.last_name[0]}`;
        
        if (profile.role === "super_admin") {
            DOMElements.sidebarRoleBadge.textContent = "Super Admin";
            DOMElements.superAdminMenu.classList.remove("hidden");
            DOMElements.schoolAdminMenu.classList.add("hidden");
            DOMElements.activeSchoolDisplay.textContent = "All Schools (Supervisory View)";
            switchTab("manage-schools");
            await loadSchools();
            await loadSchoolsForDropdown();
            await loadAdmins();
        } else {
            DOMElements.sidebarRoleBadge.textContent = "School Admin";
            DOMElements.superAdminMenu.classList.add("hidden");
            DOMElements.schoolAdminMenu.classList.remove("hidden");
            DOMElements.activeSchoolDisplay.textContent = profile.schools.name;
            switchTab("manage-students");
            await loadStudents();
            await loadResultsPublications();
            initializeSchoolProfileSettings();
        }

        DOMElements.studentSearchView.classList.add("hidden");
        DOMElements.resultsDisplayView.classList.add("hidden");
        DOMElements.adminDashboardView.classList.remove("hidden");

    } catch (err) {
        showToast(err.message, "error");
        await supabaseClient.auth.signOut();
    }
}

// Override initializeSchoolProfileSettings to trigger image previews
function initializeSchoolProfileSettings() {
    const school = state.currentSchool;
    if (!school) return;

    document.getElementById("settings-school-name").value = school.name;
    document.getElementById("settings-school-code").value = school.code;
    document.getElementById("settings-school-address").value = school.postal_address;
    document.getElementById("settings-school-phone").value = school.phone_number;
    document.getElementById("settings-school-email").value = school.email_address;
    document.getElementById("settings-school-head").value = school.head_teacher_name || "";
    document.getElementById("settings-school-district").value = school.district;
    document.getElementById("settings-school-country").value = school.country || "Malawi";

    // Render preview blocks immediately
    updateSettingsImagePreviews();
}

// Clone and replace the profile form element to wipe out older submit event listeners safely
const oldSettingsForm = DOMElements.schoolSettingsForm;
if (oldSettingsForm) {
    const newSettingsForm = oldSettingsForm.cloneNode(true);
    oldSettingsForm.parentNode.replaceChild(newSettingsForm, oldSettingsForm);
    DOMElements.schoolSettingsForm = newSettingsForm;

    // Bind updated submit validation logic (excluding text URLs since uploads are auto-saved)
    DOMElements.schoolSettingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("settings-school-name").value.trim();
        const address = document.getElementById("settings-school-address").value.trim();
        const phone = document.getElementById("settings-school-phone").value.trim();
        const email = document.getElementById("settings-school-email").value.trim();
        const head = document.getElementById("settings-school-head").value.trim();
        const district = document.getElementById("settings-school-district").value.trim();
        const country = document.getElementById("settings-school-country").value.trim();

        try {
            const { error } = await supabaseClient
                .from("schools")
                .update({
                    name,
                    postal_address: address,
                    phone_number: phone,
                    email_address: email,
                    head_teacher_name: head,
                    district,
                    country
                })
                .eq("id", state.currentSchool.id);

            if (error) throw error;
            showToast("School administrative profile updated.", "success");
            
            state.currentSchool.name = name;
            state.currentSchool.postal_address = address;
            state.currentSchool.phone_number = phone;
            state.currentSchool.email_address = email;
            state.currentSchool.head_teacher_name = head;
            state.currentSchool.district = district;
            state.currentSchool.country = country;

        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

// Clone and replace file input elements to clear old change listeners
function resetAndBindFileListeners() {
    const logoFileInput = document.getElementById("settings-school-logo-file");
    const sigFileInput = document.getElementById("settings-school-sig-file");
    const stampFileInput = document.getElementById("settings-school-stamp-file");

    if (logoFileInput) {
        const clone = logoFileInput.cloneNode(true);
        logoFileInput.parentNode.replaceChild(clone, logoFileInput);
        clone.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                showToast("Uploading school logo...", "info");
                const publicUrl = await uploadAssetToSupabase(file, "logos");
                
                const { error } = await supabaseClient
                    .from("schools")
                    .update({ logo_url: publicUrl })
                    .eq("id", state.currentSchool.id);

                if (error) throw error;

                state.currentSchool.logo_url = publicUrl;
                updateSettingsImagePreviews(); // Update settings preview instantly
                
                showToast("School logo uploaded and saved successfully.", "success");
            } catch (err) {
                showToast("Upload failed: " + err.message, "error");
            }
        });
    }

    if (sigFileInput) {
        const clone = sigFileInput.cloneNode(true);
        sigFileInput.parentNode.replaceChild(clone, sigFileInput);
        clone.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                showToast("Uploading principal signature...", "info");
                const publicUrl = await uploadAssetToSupabase(file, "signatures");
                
                const { error } = await supabaseClient
                    .from("schools")
                    .update({ head_teacher_signature_url: publicUrl })
                    .eq("id", state.currentSchool.id);

                if (error) throw error;

                state.currentSchool.head_teacher_signature_url = publicUrl;
                updateSettingsImagePreviews(); // Update settings preview instantly

                showToast("Signature uploaded and saved successfully.", "success");
            } catch (err) {
                showToast("Upload failed: " + err.message, "error");
            }
        });
    }

    if (stampFileInput) {
        const clone = stampFileInput.cloneNode(true);
        stampFileInput.parentNode.replaceChild(clone, stampFileInput);
        clone.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                showToast("Uploading school stamp...", "info");
                const publicUrl = await uploadAssetToSupabase(file, "stamps");
                
                const { error } = await supabaseClient
                    .from("schools")
                    .update({ stamp_url: publicUrl })
                    .eq("id", state.currentSchool.id);

                if (error) throw error;

                state.currentSchool.stamp_url = publicUrl;
                updateSettingsImagePreviews(); // Update settings preview instantly

                showToast("School stamp uploaded and saved successfully.", "success");
            } catch (err) {
                showToast("Upload failed: " + err.message, "error");
            }
        });
    }
}

// Run listeners setup on login and page load
document.addEventListener("DOMContentLoaded", resetAndBindFileListeners);
if (state.currentSchool) resetAndBindFileListeners();
// ==========================================
// 18. PWA INSTALLATION ORCHESTRATION ENGINE
// ==========================================

let deferredPrompt = null;
const pwaInstallBtn = document.getElementById("pwa-install-btn");

// 1. Register the non-caching Service Worker to satisfy PWA criteria
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}

// 2. Capture the browser's native installation prompt hook
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default browser-specific banner from showing
    e.preventDefault();
    // Cache the event so we can trigger it on the button click
    deferredPrompt = e;
    // Unhide the custom "Install App" button in the header nav
    if (pwaInstallBtn) {
        pwaInstallBtn.classList.remove("hidden");
    }
});

// 3. Handle the "Install App" button click event
if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // Trigger the native prompt
        deferredPrompt.prompt();
        // Wait for the user's decision
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User installation choice: ${outcome}`);
        // Clear the deferred prompt variable
        deferredPrompt = null;
        // Hide the install button again
        pwaInstallBtn.classList.add("hidden");
    });
}

// 4. Hide the button automatically if the app is successfully installed
window.addEventListener('appinstalled', (evt) => {
    console.log('Results Portal app successfully installed on device!');
    if (pwaInstallBtn) {
        pwaInstallBtn.classList.add("hidden");
    }
});