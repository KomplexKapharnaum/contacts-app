let register_params = {
    "phone": "",
    "pseudo": ""
};

function register_phone() {
    const input_phone = document.querySelector("#input_register_phone").value;
    if (!UTIL.isPhoneNumberValid(input_phone)) {
        // UTIL.alert("Invalid phone number");
    } else {
        register_params.phone = input_phone;
        PAGES.goto("pseudonyme_register");
    }
}

function register_pseudo() {
    const input_pseudo = document.querySelector("#input_register_pseudo").value;
    if (input_pseudo.length < 3) {
        // UTIL.alert("Pseudo must be at least 3 characters long");
    } else {
        register_params.pseudo = input_pseudo;
        PAGES.goto("main");
    }
}