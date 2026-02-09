    let db = {
    profile: null,
    children: [],
    vaccines: [],
    completedVaccines: [],
    drives: []
    };

    function getToken() {
    return localStorage.getItem("accessToken");
    }

    async function apiRequest(endpoint, method = "GET", body = null, auth = true) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (auth) {
        const token = getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const options = { method, headers };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
        console.error("API error:", data);
        throw data;
    }

    return data;
    }
    async function registerUser(email, password) {
    const data = await apiRequest("/api/auth/register", "POST", { email, password }, false);
    localStorage.setItem("accessToken", data.tokens.accessToken);
    return data;
    }

    async function loginUser(email, password) {
    const data = await apiRequest("/api/auth/login", "POST", { email, password }, false);
    localStorage.setItem("accessToken", data.tokens.accessToken);
    return data;
    }
    function setAuthStatus(msg, color="gray") {
    const el = document.getElementById("authStatus");
    if (!el) return;
    el.textContent = msg;
    el.style.color = color;
    }

    async function handleRegister() {
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;

    try {
        await registerUser(email, password);
        setAuthStatus("Registered + Logged in successfully ✅", "green");
        await refreshAllData();
    } catch (err) {
        setAuthStatus("Register failed ❌ " + (err.error || ""), "red");
    }
    }

async function handleLogin() {
  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;

  try {
    const data = await loginUser(email, password);

    console.log("LOGIN RESPONSE:", data);
    console.log("TOKEN SAVED:", localStorage.getItem("accessToken"));
    localStorage.removeItem("vaxcareDB");

    if (!localStorage.getItem("accessToken")) {
      setAuthStatus("Login failed ❌ Token not stored", "red");
      return;
    }

    setAuthStatus("Logged in successfully ✅", "green");
    await refreshAllData();
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    setAuthStatus("Login failed ❌ " + (err.error || JSON.stringify(err)), "red");
  }
}


    function handleLogout() {
    localStorage.removeItem("accessToken");
    setAuthStatus("Logged out", "gray");
    }
async function refreshAllData() {
  try {
    // Profile
    const profileRes = await apiRequest("/api/profile", "GET", null, true);
    const p = profileRes.profile;

    db.profile = {
        name: p.fullName,
        dob: p.dateOfBirth,
        bloodGroup: p.bloodGroup,
        geneticInfo: p.geneticConditions,
        allergies: p.knownAllergies,
        symptoms: p.currentSymptoms,
        location: p.location
    };

document.getElementById("userName").value = p.fullName || "";
document.getElementById("userDob").value = p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "";
document.getElementById("bloodGroup").value = p.bloodGroup || "";
document.getElementById("geneticInfo").value = p.geneticConditions || "";
document.getElementById("allergies").value = p.knownAllergies || "";
document.getElementById("symptoms").value = p.currentSymptoms || "";
document.getElementById("location").value = p.location || "";

    setAuthStatus("Logged in ✅ Profile loaded", "green");
} catch (err) {
  console.log("Profile not loaded:", err);

  // If token exists, user IS logged in, profile just doesn't exist
  if (getToken()) {
    setAuthStatus("Logged in ✅ (Profile not created yet)", "orange");
  } else {
    setAuthStatus("Not logged in", "gray");
  }
}



        // Standard vaccine schedule
        const standardVaccines = [
            { name: "BCG", age: "At birth", description: "Protection against tuberculosis" },
            { name: "Hepatitis B (1st dose)", age: "At birth", description: "First dose of Hepatitis B vaccine" },
            { name: "OPV (0 dose)", age: "At birth", description: "Oral Polio Vaccine" },
            { name: "Hepatitis B (2nd dose)", age: "6 weeks", description: "Second dose of Hepatitis B vaccine" },
            { name: "DTaP (1st dose)", age: "6 weeks", description: "Diphtheria, Tetanus, Pertussis" },
            { name: "IPV (1st dose)", age: "6 weeks", description: "Inactivated Polio Vaccine" },
            { name: "Hib (1st dose)", age: "6 weeks", description: "Haemophilus influenzae type b" },
            { name: "Rotavirus (1st dose)", age: "6 weeks", description: "Protection against rotavirus" },
            { name: "PCV (1st dose)", age: "6 weeks", description: "Pneumococcal Conjugate Vaccine" },
            { name: "DTaP (2nd dose)", age: "10 weeks", description: "Diphtheria, Tetanus, Pertussis" },
            { name: "IPV (2nd dose)", age: "10 weeks", description: "Inactivated Polio Vaccine" },
            { name: "Hib (2nd dose)", age: "10 weeks", description: "Haemophilus influenzae type b" },
            { name: "Rotavirus (2nd dose)", age: "10 weeks", description: "Protection against rotavirus" },
            { name: "PCV (2nd dose)", age: "10 weeks", description: "Pneumococcal Conjugate Vaccine" },
            { name: "DTaP (3rd dose)", age: "14 weeks", description: "Diphtheria, Tetanus, Pertussis" },
            { name: "IPV (3rd dose)", age: "14 weeks", description: "Inactivated Polio Vaccine" },
            { name: "Hib (3rd dose)", age: "14 weeks", description: "Haemophilus influenzae type b" },
            { name: "Rotavirus (3rd dose)", age: "14 weeks", description: "Protection against rotavirus" },
            { name: "PCV (3rd dose)", age: "14 weeks", description: "Pneumococcal Conjugate Vaccine" },
            { name: "MMR (1st dose)", age: "9-12 months", description: "Measles, Mumps, Rubella" },
            { name: "Varicella (Chickenpox)", age: "12-15 months", description: "Protection against chickenpox" },
            { name: "Hepatitis A (1st dose)", age: "12-23 months", description: "First dose of Hepatitis A vaccine" },
            { name: "MMR (2nd dose)", age: "4-6 years", description: "Measles, Mumps, Rubella booster" },
            { name: "DTaP (Booster)", age: "4-6 years", description: "Diphtheria, Tetanus, Pertussis booster" },
            { name: "IPV (Booster)", age: "4-6 years", description: "Polio booster" },
            { name: "HPV (1st dose)", age: "11-12 years", description: "Human Papillomavirus vaccine" },
            { name: "Tdap (Booster)", age: "11-12 years", description: "Tetanus, Diphtheria, Pertussis booster" }
        ];

        // Sample drives
        const sampleDrives = [
            {
                title: "Free Polio Vaccination Camp",
                type: "vaccine",
                location: "City General Hospital",
                date: "November 15, 2025",
                time: "9:00 AM - 4:00 PM"
            },
            {
                title: "Child Safety Workshop",
                type: "safety",
                location: "Community Center, Downtown",
                date: "November 20, 2025",
                time: "10:00 AM - 2:00 PM"
            },
            {
                title: "MMR Vaccination Drive",
                type: "vaccine",
                location: "District Health Center",
                date: "November 25, 2025",
                time: "8:00 AM - 5:00 PM"
            }
        ];

        // Initialize
        function init() {
            //loadData();
            renderVaccineList();
            renderDrives();
            updateDashboard();
            
            // Show welcome notification
            setTimeout(() => {
                showNotification('Welcome! 🎉', 'Complete your profile to get personalized health recommendations!', 'info');
            }, 1000);

            // Simulate periodic drive notifications
            setInterval(checkForDriveNotifications, 30000);
        }

        function switchTab(tabName,event) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.nav-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.getElementById(tabName).classList.add('active');
            document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add("active");

        }

        async function saveProfile(event) {
        event.preventDefault();

        const profileData = {
            fullName: document.getElementById("fullName").value,
            dateOfBirth: document.getElementById("dateOfBirth").value,
            bloodGroup: document.getElementById("bloodGroup").value,
            geneticConditions: document.getElementById("geneticConditions").value,
            knownAllergies: document.getElementById("knownAllergies").value,
            currentSymptoms: document.getElementById("currentSymptoms").value,
            location: document.getElementById("location").value
        };

        try {
            const res = await apiRequest("/api/profile", "POST", profileData, true);
            alert(res.message || "Profile saved!");
            await refreshAllData();
        } catch (err) {
            alert("Failed to save profile: " + (err.error || "Unknown error"));
        }
        }


        function addNewborn(e) {
            e.preventDefault();
            
            const baby = {
                id: Date.now(),
                name: document.getElementById('babyName').value,
                dob: document.getElementById('babyDob').value,
                gender: document.getElementById('babyGender').value,
                birthWeight: document.getElementById('birthWeight').value,
                complications: document.getElementById('complications').value,
                vaccines: []
            };
            
            db.children.push(baby);
            saveData();
            
            document.getElementById('newbornForm').reset();
            renderChildrenList();
            updateDashboard();
            
            showNotification('Baby Added! 👶', `${baby.name}'s vaccination schedule has been created. We'll remind you of upcoming vaccines!`, 'success');
            
            // Simulate vaccine reminder
            setTimeout(() => {
                showNotification('Vaccine Reminder 💉', `${baby.name} is due for BCG and Hepatitis B vaccines. Please visit your healthcare provider.`, 'warning');
            }, 5000);
        }

        function renderChildrenList() {
            const container = document.getElementById('childrenList');
            if (db.children.length === 0) {
                container.innerHTML = '<p style="color: #718096;">No children registered yet. Add your newborn to get started!</p>';
                return;
            }
            
            container.innerHTML = db.children.map(child => `
                <div class="drive-card">
                    <h4>${child.name}</h4>
                    <p><strong>Date of Birth:</strong> ${child.dob}</p>
                    <p><strong>Gender:</strong> ${child.gender}</p>
                    <p><strong>Vaccines Completed:</strong> ${child.vaccines.length} / ${standardVaccines.length}</p>
                </div>
            `).join('');
        }

        function renderVaccineList() {
            const container = document.getElementById('vaccineList');
            container.innerHTML = standardVaccines.map((vaccine, index) => {
                const isCompleted = db.completedVaccines.includes(index);
                return `
                    <div class="vaccine-item ${isCompleted ? 'completed' : ''}">
                        <h4>${vaccine.name}</h4>
                        <p><strong>Age:</strong> ${vaccine.age}</p>
                        <p>${vaccine.description}</p>
                        <div class="checkbox-group">
                            <input type="checkbox" id="vax${index}" ${isCompleted ? 'checked' : ''} 
                                onchange="toggleVaccine(${index})">
                            <label for="vax${index}">${isCompleted ? 'Completed ✓' : 'Mark as completed'}</label>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function toggleVaccine(index) {
            const idx = db.completedVaccines.indexOf(index);
            if (idx > -1) {
                db.completedVaccines.splice(idx, 1);
            } else {
                db.completedVaccines.push(index);
                showNotification('Great Job! 🎉', `You've marked ${standardVaccines[index].name} as completed. Keep up the good work!`, 'success');
            }
            saveData();
            renderVaccineList();
            updateDashboard();
        }

        function renderDrives() {
            const container = document.getElementById('drivesList');
            container.innerHTML = sampleDrives.map(drive => `
                <div class="drive-card">
                    <span class="badge ${drive.type}">${drive.type === 'vaccine' ? '💉 Vaccine Drive' : '🛡️ Safety Drive'}</span>
                    <h4>${drive.title}</h4>
                    <p><strong>📍 Location:</strong> ${drive.location}</p>
                    <p><strong>📅 Date:</strong> ${drive.date}</p>
                    <p><strong>🕐 Time:</strong> ${drive.time}</p>
                </div>
            `).join('');
        }

        function updateDashboard() {
            document.getElementById('completedCount').textContent = db.completedVaccines.length;
            document.getElementById('upcomingCount').textContent = standardVaccines.length - db.completedVaccines.length;
            document.getElementById('familyCount').textContent = (db.profile ? 1 : 0) + db.children.length;
            
            const upcomingContainer = document.getElementById('upcomingVaccines');
            const upcoming = standardVaccines.filter((v, i) => !db.completedVaccines.includes(i)).slice(0, 3);
            
            if (upcoming.length === 0) {
                upcomingContainer.innerHTML = '<p style="color: #718096;">All vaccines completed! Great job! 🎉</p>';
            } else {
                upcomingContainer.innerHTML = upcoming.map(v => `
                    <div class="drive-card">
                        <h4>${v.name}</h4>
                        <p><strong>Recommended Age:</strong> ${v.age}</p>
                        <p>${v.description}</p>
                    </div>
                `).join('');}
            }
}

        function checkSymptoms() {
            if (db.profile && db.profile.symptoms) {
                const symptoms = db.profile.symptoms.toLowerCase();
                if (symptoms.includes('fever') || symptoms.includes('cough') || symptoms.includes('rash')) {
                    setTimeout(() => {
                        showNotification('Health Alert ⚠️', 'Based on your symptoms, we recommend consulting a healthcare provider before getting vaccinated.', 'warning');
                    }, 2000);
                }
            }
        }

        function checkForDriveNotifications() {
            if (Math.random() > 0.7 && db.profile) {
                const drive = sampleDrives[Math.floor(Math.random() * sampleDrives.length)];
                showNotification('New Drive Alert! 📢', `${drive.title} happening at ${drive.location} on ${drive.date}`, 'info');
            }
        }

        function showNotification(title, message, type = 'info') {
            const notif = document.getElementById('notification');
            document.getElementById('notifTitle').textContent = title;
            document.getElementById('notifMessage').textContent = message;
            
            notif.className = `notification ${type} show`;
            
            setTimeout(() => {
                closeNotification();
            }, 8000);
        }

        function closeNotification() {
            document.getElementById('notification').classList.remove('show');
        }

        function saveData() {
            try {
                localStorage.setItem('vaxcareDB', JSON.stringify(db));
            } catch (e) {
                console.log('Storage not available');
            }
        }

        function loadData() {
            try {
                const saved = localStorage.getItem('vaxcareDB');
                if (saved) {
                    Object.assign(db, JSON.parse(saved));
                    
                    // Populate profile form
                    if (db.profile) {
                        document.getElementById('userName').value = db.profile.name || '';
                        document.getElementById('userDob').value = db.profile.dob || '';
                        document.getElementById('bloodGroup').value = db.profile.bloodGroup || '';
                        document.getElementById('geneticInfo').value = db.profile.geneticInfo || '';
                        document.getElementById('allergies').value = db.profile.allergies || '';
                        document.getElementById('symptoms').value = db.profile.symptoms || '';
                        document.getElementById('location').value = db.profile.location || '';
                    }
                    
                    renderChildrenList();
                }
            } catch (e) {
                console.log('Could not load data');
            }
        }

        // Initialize on load
        window.onload = function () {
        init();
        };
        window.switchTab = switchTab;
        window.init = init;
        window.handleLogin = handleLogin;
        window.handleRegister = handleRegister;
        window.saveProfile = saveProfile;
        window.addNewborn = addNewborn;

