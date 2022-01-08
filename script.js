window.onload = function () {
    // Set date selector to current date
    document.getElementById("form-date").valueAsDate = new Date();

    // Fix textarea newlines
    Array.prototype.forEach.call(document.getElementsByTagName("textarea"), function (elem) {
        elem.placeholder = elem.placeholder.replace(/\\n/g, "\n");
    });

    // Bind image load handler
    let img = document.getElementById("form-logo");
    img.addEventListener("change", load_image, false);

    // document.getElementById("form-prefixes").value = "192.0.2.0/24\n2001:db8::/48";
    // document.getElementById("form-network-name").value = "Example Network";
    // document.getElementById("form-asn").value = 65530;
    // document.getElementById("form-peer-name").value = "Example Peer";
    // document.getElementById("form-peer-asn").value = 65510;
    // document.getElementById("form-contact-name").value = "Example User";
    // document.getElementById("form-email").value = "noc@example.com";
    // document.getElementById("form-phone").value = "000 000 0000";
    // document.getElementById("form-notes").value = "This\nis\na\ntest";
}

function reset_loa() {
    document.getElementById("form-prefixes").value = "";
    document.getElementById("form-network-name").value = "";
    document.getElementById("form-asn").value = undefined;
    document.getElementById("form-peer-name").value = "";
    document.getElementById("form-peer-asn").value = undefined;
    document.getElementById("form-contact-name").value = "";
    document.getElementById("form-email").value = "";
    document.getElementById("form-phone").value = "";
    document.getElementById("form-notes").value = "";
}

function date_string() {
    let today = new Date();
    return `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
}

function form_ok() {
    let all_filled = true;
    document.getElementById("form").querySelectorAll("[required]").forEach(function (i) {
        if (!all_filled) return;
        if (!i.value || i.value === "") all_filled = false;
    })
    if (!all_filled) {
        alert("Please complete all required fields")
    }
    return all_filled;
}

function load_peeringdb_data() {
    let local_asn = document.getElementById("form-asn").value;
    if (local_asn !== undefined) {
        fetch("https://www.peeringdb.com/api/net?asn=" + local_asn)
            .then(resp => resp.json())
            .then(data => {
                if (data.data.length === 1) {
                    network = data.data[0]
                    document.getElementById("form-network-name").value = network.name;
                }
            })
    }

    let peer_asn = document.getElementById("form-peer-asn").value;
    if (peer_asn !== undefined) {
        fetch("https://www.peeringdb.com/api/net?asn=" + peer_asn)
            .then(resp => resp.json())
            .then(data => {
                if (data.data.length === 1) {
                    network = data.data[0]
                    document.getElementById("form-peer-name").value = network.name;
                }
            })
    }
}

function generate_loa() {
    let prefixes = document.getElementById("form-prefixes").value.replace(/(\r\n|\r|\n){2}/g, "$1").replace(/(\r\n|\r|\n){3,}/g, "$1\n").replace(/\n+$/, ""); // Remove duplicate newlines
    let peer_name = document.getElementById("form-peer-name").value;
    let peer_asn = document.getElementById("form-peer-asn").value.toUpperCase().replace("AS", "");
    let date = document.getElementById("form-date").value;
    let name = document.getElementById("form-network-name").value;
    let asn = document.getElementById("form-asn").value.toUpperCase().replace("AS", "");
    let contact_name = document.getElementById("form-contact-name").value;
    let contact_email = document.getElementById("form-email").value;
    let contact_phone = document.getElementById("form-phone").value;
    let notes = document.getElementById("form-notes").value.replace(/\n+$/, ""); // Remove trailing newline

    let loa_body = new Date(date).toLocaleDateString() + `

To whom it may concern,

This letter serves to authorize AS${peer_asn} (${peer_name}) to announce the following IP address blocks:

${prefixes}

As a representative of AS${asn} (${name}) that is the owner of the prefix(es) and/or ASN, I hereby affirm that I'm authorized to represent and sign for this LOA.
`

    if (notes !== "") {
        loa_body += "\n" + notes + "\n"
    }

    loa_body += `
Should you have questions about this request, email ` + contact_email

    if (contact_phone !== "") {
        loa_body += " or call " + contact_phone
    }

    loa_body += `.

Sincerely,
` + contact_name

    return loa_body
}

function gen_text_loa(download) {
    if (!form_ok()) {
        return
    }

    let peer_asn = document.getElementById("form-peer-asn").value.toUpperCase().replace("AS", "");
    let loa_body = "Letter of Authorization\n\n" + generate_loa();
    let target_text = "data:text/plain;charset=utf-8," + encodeURIComponent(loa_body);

    if (download) {
        let element = document.createElement("a");
        element.style.display = "none";
        element.setAttribute("href", target_text);
        element.setAttribute("download", "LoA_AS" + peer_asn + "_" + date_string() + ".txt");
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    } else {
        alert(loa_body)
    }
}

function loa_pdf_doc() {
    let doc = new jspdf.jsPDF();

    let header_height = 20;
    let body_height = 30;

    // Image
    let logo = document.getElementById("logo-preview");
    if (logo.src !== "") {
        header_height = 50;
        body_height = 60;

        let target_height = 20;
        let target_width = (logo.clientWidth / logo.clientHeight) * target_height;
        doc.addImage(logo.src, 20, 20, target_width, target_height, "NONE", 0);
    }

    doc.setFontSize(20);
    doc.text(20, header_height, "Letter of Authorization");

    doc.setFontSize(12);
    let loa_body = generate_loa();
    doc.text(20, body_height, doc.splitTextToSize(loa_body, 180));
    return doc
}

function save_pdf_loa() {
    if (!form_ok()) {
        return
    }

    let doc = loa_pdf_doc();
    let peer_asn = document.getElementById("form-peer-asn").value.toUpperCase().replace("AS", "");
    doc.save("LoA_AS" + peer_asn + "_" + date_string() + ".pdf");
}

function open_pdf_loa() {
    if (!form_ok()) {
        return
    }

    let doc = loa_pdf_doc();
    doc.output('dataurlnewwindow');
}

function load_image(e) {
    let logo_preview = document.getElementById("logo-preview");
    logo_preview.style.display = "block";

    let reader = new FileReader();
    reader.onload = function (event) {
        logo_preview.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}
