// Register
//

let register_params = {
    "phone": "",
    "pseudo": ""
};

function register_phone_err(txt) {
    document.querySelector("#input_register_phone").parentElement.querySelector(".err").innerHTML = txt;
}

function register_phone() {
    const input_phone = UTIL.normalizePhone(document.querySelector("#input_register_phone").value);
    if (!UTIL.isPhoneNumberValid(input_phone)) {
        register_phone_err("Numéro de téléphone invalide");
    } else {
        fetch(`/phone?phone=${input_phone}`)
        .then(res => res.json())
        .then(data => {
            console.log("Is phone already in database :", data);
            if (data) {
                register_phone_err("Ce numéro est déjà enregistré");
                document.getElementById("registerToLogin").style.visibility = "visible";
            } else {
                register_params.phone = input_phone;
                PAGES.goto("pseudonyme_register");
            }
        });
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
        register_params.pseudo = input_pseudo;
        NETWORK.register(register_params);
        // PAGES.goto("main");
    }
}

// Login
//

function login_phone() {
    const input_phone = UTIL.normalizePhone(document.querySelector("#input_login_phone").value);
    if (!UTIL.isPhoneNumberValid(input_phone)) {
        document.querySelector("#input_login_phone").parentElement.querySelector(".err").innerHTML = "Numéro de téléphone invalide";
    } else {
        fetch(`/phone?phone=${input_phone}`)
        .then(res => res.json())
        .then(data => {
            if (data) {
                Cookies.set('token', input_phone, 30);
                PAGES.goto("main");
            } else {
                document.getElementById("loginToRegister").style.visibility = "visible";
                document.querySelector("#input_login_phone").parentElement.querySelector(".err").innerHTML = "Aucun compte associé à ce numéro";
            }
        });
    }
}