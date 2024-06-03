// Register
//

let register_params = {
    "phone": "",
    "pseudo": ""
};

function register_phone_err(txt) {
    document.querySelector("#input_register_phone").parentElement.querySelector(".err").innerHTML = txt;
}

function register_phone() 
{
    const input_phone = UTIL.normalizePhone(document.querySelector("#input_register_phone").value);
    if (!UTIL.isPhoneNumberValid(input_phone)) {
        register_phone_err("Numéro de téléphone invalide");
    } else {

         // Create or load user from phone
         NETWORK.query('User.init_byphone', input_phone)
            .then((data) => {
                console.log("User created:", data);
                userData = data;
                register_phone_err("Compte créé !");
                Cookies.set('token', data.uuid, 30);
                setTimeout(() => { NETWORK.loadUser() }, 1500);
            })
            .catch((err) => { 
                register_phone_err("Numéro de téléphone invalide"); 
                console.log("Error creating user:", err);
            })
    }
}

function register_pseudo_err(txt) {
    document.querySelector("#input_register_pseudo").parentElement.querySelector(".err").innerHTML = txt;
}

function register_pseudo() {
    const input_pseudo = document.querySelector("#input_register_pseudo").value;
    if (input_pseudo.length < 3) {
        register_pseudo_err("Le pseudo doit faire au moins 3 caractères");
    } else {

        // Save pseudo
        NETWORK.query('User.set_name', [userData.uuid, input_pseudo])
            .then((data) => {
                console.log("User updated:", data);
                userData = data;
                register_pseudo_err("Pseudo enregistré !");
                setTimeout(() => { NETWORK.loadUser() }, 1500);
            })
            .catch((err) => { register_pseudo_err("Erreur lors de l'enregistrement du pseudo"); })
    }
}

// Login
//

// function login_phone() {
//     const input_phone = UTIL.normalizePhone(document.querySelector("#input_login_phone").value);
//     if (!UTIL.isPhoneNumberValid(input_phone)) {
//         document.querySelector("#input_login_phone").parentElement.querySelector(".err").innerHTML = "Numéro de téléphone invalide";
//     } else {
//         fetch(`/phone?phone=${input_phone}`)
//         .then(res => res.json())
//         .then(data => {
//             if (data) {
//                 Cookies.set('token', input_phone, 30);
//                 PAGES.goto("main");
//             } else {
//                 document.getElementById("loginToRegister").style.visibility = "visible";
//                 document.querySelector("#input_login_phone").parentElement.querySelector(".err").innerHTML = "Aucun compte associé à ce numéro";
//             }
//         });
//     }
// }